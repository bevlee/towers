import type { Express } from 'express'
import { pool } from '../db.js'
import { logger } from '../logger.js'

const PAGE_SIZE = 10

/** Postgres rejects a malformed uuid with this code; treat it as a missing match. */
const INVALID_TEXT_REPRESENTATION = '22P02'

/** game_results joined to both players, in the wire shape the client expects. */
const MATCH_SELECT = `
  SELECT g.id, g.created, g.win_reason, g.turn_count,
         json_build_object('id', w.id, 'username', w.username) AS winner,
         json_build_object('id', l.id, 'username', l.username) AS loser
  FROM game_results g
  JOIN players w ON w.id = g.winner
  JOIN players l ON l.id = g.loser`

/** Register the public profile / match-history REST endpoints. */
export function registerProfileRoutes(app: Express): void {
  app.use(['/api/profile', '/api/match'], (_req, res, next) => {
    if (!pool) return void res.status(503).json({ message: 'Stats unavailable' })
    next()
  })

  /** Profile stats for a given username. */
  app.get('/api/profile/:username', async (req, res) => {
    try {
      const { rows: [user] } = await pool!.query(
        `SELECT id, username, wins, losses, win_tower_built, win_tower_destroyed, win_resources, win_forfeit
         FROM players WHERE username = $1`,
        [req.params.username],
      )
      if (!user) return void res.status(404).json({ message: 'User not found' })
      res.json(user)
    } catch (err) {
      logger.error({ err }, 'Failed to load profile')
      res.status(500).json({ message: 'Failed to load profile' })
    }
  })

  /** Paginated match history for a given username. */
  app.get('/api/profile/:username/matches', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10) || 1)
    try {
      const { rows: [user] } = await pool!.query<{ id: string }>(
        'SELECT id FROM players WHERE username = $1',
        [req.params.username],
      )
      if (!user) return void res.status(404).json({ message: 'User not found' })
      const [count, items] = await Promise.all([
        pool!.query<{ total: number }>(
          'SELECT count(*)::int AS total FROM game_results WHERE winner = $1 OR loser = $1',
          [user.id],
        ),
        pool!.query(
          `${MATCH_SELECT} WHERE g.winner = $1 OR g.loser = $1 ORDER BY g.created DESC LIMIT $2 OFFSET $3`,
          [user.id, PAGE_SIZE, (page - 1) * PAGE_SIZE],
        ),
      ])
      res.json({
        page,
        totalPages: Math.ceil(count.rows[0].total / PAGE_SIZE),
        items: items.rows,
      })
    } catch (err) {
      logger.error({ err }, 'Failed to load matches')
      res.status(500).json({ message: 'Failed to load matches' })
    }
  })

  /** Match detail with card plays. */
  app.get('/api/match/:id', async (req, res) => {
    try {
      const [match, plays] = await Promise.all([
        pool!.query(`${MATCH_SELECT} WHERE g.id = $1`, [req.params.id]),
        pool!.query(
          `SELECT c.id, json_build_object('id', p.id, 'username', p.username) AS player,
                  c.card_name, c.card_color, c.action, c.turn_number, c.sequence
           FROM card_plays c JOIN players p ON p.id = c.player
           WHERE c.game = $1 ORDER BY c.turn_number, c.sequence, c.id`,
          [req.params.id],
        ),
      ])
      if (!match.rows[0]) return void res.status(404).json({ message: 'Match not found' })
      res.json({ ...match.rows[0], plays: plays.rows })
    } catch (err: any) {
      if (err?.code === INVALID_TEXT_REPRESENTATION) return void res.status(404).json({ message: 'Match not found' })
      logger.error({ err }, 'Failed to load match')
      res.status(500).json({ message: 'Failed to load match' })
    }
  })
}
