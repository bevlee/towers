import type { Express } from 'express'
import { pb } from '../pb.js'
import { logger } from '../logger.js'

const PAGE_SIZE = 10

/** Extract an expanded user relation into the wire shape. */
function expandedUser(record: any, key: string): { id: string; username: string } {
  return { id: record.expand?.[key]?.id, username: record.expand?.[key]?.username }
}

/** Map a game_results record (with winner/loser expanded) into the wire shape. */
function mapMatch(m: any) {
  return {
    id: m.id,
    created: m.created,
    winner: expandedUser(m, 'winner'),
    loser: expandedUser(m, 'loser'),
    win_reason: m.win_reason,
    turn_count: m.turn_count,
  }
}

/** Register the public profile / match-history REST endpoints. */
export function registerProfileRoutes(app: Express): void {
  /** Profile stats for a given username. */
  app.get('/api/profile/:username', async (req, res) => {
    try {
      const user = await pb.collection('users').getFirstListItem(
        pb.filter('username = {:username}', { username: req.params.username }),
        { fields: 'id,username,wins,losses,win_tower_built,win_tower_destroyed,win_resources' }
      )
      res.json(user)
    } catch (err: any) {
      if (err?.status === 404) return void res.status(404).json({ message: 'User not found' })
      res.status(500).json({ message: 'Failed to load profile' })
    }
  })

  /** Paginated match history for a given username. */
  app.get('/api/profile/:username/matches', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10) || 1)
    try {
      const user = await pb.collection('users').getFirstListItem(
        pb.filter('username = {:username}', { username: req.params.username }),
        { fields: 'id' }
      )
      const result = await pb.collection('game_results').getList(page, PAGE_SIZE, {
        filter: pb.filter('winner = {:id} || loser = {:id}', { id: user.id }),
        sort: '-created',
        expand: 'winner,loser',
      })
      res.json({
        page: result.page,
        totalPages: result.totalPages,
        items: result.items.map(mapMatch),
      })
    } catch (err: any) {
      logger.error({ err }, 'Failed to load matches')
      if (err?.status === 404) return void res.status(404).json({ message: 'User not found' })
      res.status(500).json({ message: 'Failed to load matches' })
    }
  })

  /** Match detail with card plays. */
  app.get('/api/match/:id', async (req, res) => {
    try {
      const [match, plays] = await Promise.all([
        pb.collection('game_results').getOne(req.params.id, { expand: 'winner,loser' }),
        pb.collection('card_plays').getFullList({
          filter: pb.filter('game = {:id}', { id: req.params.id }),
          sort: 'turn_number,sequence',
          expand: 'player',
        }),
      ])
      res.json({
        ...mapMatch(match),
        plays: (plays as any[]).map((p) => ({
          id: p.id,
          player: expandedUser(p, 'player'),
          card_name:   p.card_name,
          card_color:  p.card_color,
          action:      p.action,
          turn_number: p.turn_number,
          sequence:    p.sequence,
        })),
      })
    } catch (err: any) {
      if (err?.status === 404) return void res.status(404).json({ message: 'Match not found' })
      res.status(500).json({ message: 'Failed to load match' })
    }
  })
}
