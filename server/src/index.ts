import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import crypto from 'node:crypto'
import PocketBase from 'pocketbase'
import { SERVER_PORT, CLIENT_ORIGIN } from './config.js'
import { logger } from './logger.js'
import { RoomManager } from './roomManager.js'
import { TurnManager } from './turnManager.js'
import { registerLobbyHandlers } from './handlers/lobbyHandlers.js'
import { registerGameHandlers } from './handlers/gameHandlers.js'
import { pb, initPb } from './pb.js'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
})

const roomManager = new RoomManager()
const turnManager = new TurnManager()

/** Health check endpoint. */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

/** Profile stats for a given username. */
app.get('/api/profile/:username', async (req, res) => {
  try {
    const user = await pb.collection('users').getFirstListItem(
      `username="${req.params.username}"`,
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
  const PAGE_SIZE = 10
  try {
    const user = await pb.collection('users').getFirstListItem(
      `username="${req.params.username}"`,
      { fields: 'id' }
    )
    const result = await pb.collection('game_results').getList(page, PAGE_SIZE, {
      filter: `(winner='${user.id}'||loser='${user.id}')`,
      sort: '-created',
      expand: 'winner,loser',
    })
    res.json({
      page: result.page,
      totalPages: result.totalPages,
      items: result.items.map((m: any) => ({
        id: m.id,
        created: m.created,
        winner: { id: m.expand?.winner?.id, username: m.expand?.winner?.username },
        loser:  { id: m.expand?.loser?.id,  username: m.expand?.loser?.username },
        win_reason: m.win_reason,
        turn_count: m.turn_count,
      })),
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
        filter: `game="${req.params.id}"`,
        sort: 'turn_number,sequence',
        expand: 'player',
      }),
    ])
    res.json({
      id: match.id,
      created: match.created,
      winner: { id: (match as any).expand?.winner?.id, username: (match as any).expand?.winner?.username },
      loser:  { id: (match as any).expand?.loser?.id,  username: (match as any).expand?.loser?.username },
      win_reason: match.win_reason,
      turn_count: match.turn_count,
      plays: (plays as any[]).map((p) => ({
        id: p.id,
        player: { id: p.expand?.player?.id, username: p.expand?.player?.username },
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

/**
 * Socket.IO middleware — verify an optional PocketBase auth token sent by the
 * client as `socket.handshake.auth.pbToken`.  On success, `socket.data.pbUserId`
 * is set to the PocketBase user record ID; connections without a valid token
 * are still allowed (stats just won't be recorded for that session).
 */
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.pbToken as string | undefined
  if (token) {
    try {
      const tempPb = new PocketBase(process.env.PB_URL ?? 'http://localhost:8090')
      tempPb.authStore.save(token, null)
      const result = await tempPb.collection('users').authRefresh()
      socket.data.pbUserId = result.record.id
    } catch {
      // Invalid/expired token — continue without PB integration for this socket
    }
  }
  next()
})

io.on('connection', (socket) => {
  // Assign a unique player ID to each connection
  socket.data.playerId = crypto.randomUUID()

  logger.info({ socketId: socket.id, playerId: socket.data.playerId }, 'Client connected')

  registerLobbyHandlers(io, socket, roomManager, turnManager)
  registerGameHandlers(io, socket, roomManager, turnManager)
})

httpServer.listen(SERVER_PORT, () => {
  logger.info({ port: SERVER_PORT, cors: CLIENT_ORIGIN }, 'Two Towers server started')
})

// Connect to PocketBase after the server is listening (non-blocking)
initPb().catch((err) => logger.error({ err }, 'PocketBase init failed'))
