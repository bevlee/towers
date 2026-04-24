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
import { initPb } from './pb.js'

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
