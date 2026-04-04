import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import crypto from 'node:crypto'
import { SERVER_PORT, CLIENT_ORIGIN } from './config.js'
import { logger } from './logger.js'
import { RoomManager } from './roomManager.js'
import { TurnManager } from './turnManager.js'
import { registerLobbyHandlers } from './handlers/lobbyHandlers.js'
import { registerGameHandlers } from './handlers/gameHandlers.js'

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
