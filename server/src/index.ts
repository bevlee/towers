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
import { registerProfileRoutes } from './routes/profile.js'
import { usernameError } from '@towers/shared'
import { initDb, findPlayer, createPlayer, isUsernameTaken, pool } from './db.js'
import { getSession, sessionUser, signOut } from './auth.js'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  // CORS headers don't cover WebSocket upgrades, so check Origin on every handshake.
  // Another *.bevsoft.com site is same-site and would otherwise get the player's cookie.
  // Browsers always send Origin here; a client without one has no cookie to abuse.
  allowRequest: (req, callback) => {
    const origin = req.headers.origin
    callback(null, !origin || origin === CLIENT_ORIGIN)
  },
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

const roomManager = new RoomManager()
const turnManager = new TurnManager()

/** Health check endpoint. */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

registerProfileRoutes(app)

/**
 * The signed-in account, or null. `username` stays null until the player picks
 * a name. The browser sends the shared bevsoft.com auth cookie.
 */
app.get('/api/me', async (req, res) => {
  res.set('cache-control', 'no-store')
  try {
    const { user, setCookies } = await getSession(req.headers.cookie)
    for (const cookie of setCookies) res.append('set-cookie', cookie)
    if (!user) return void res.json(null)
    if (!pool) return void res.status(503).json({ message: 'Accounts unavailable' })
    const player = await findPlayer(user.id)
    res.json({ id: user.id, username: player?.username ?? null })
  } catch (err) {
    logger.error({ err }, 'Failed to resolve session')
    res.status(502).json({ message: 'Sign-in is temporarily unavailable' })
  }
})

/** Reject cross-site form posts; these routes act on the player's cookie. */
function sameOrigin(req: express.Request, res: express.Response): boolean {
  if (req.headers.origin === CLIENT_ORIGIN) return true
  res.status(403).json({ message: 'Forbidden' })
  return false
}

/** Pull a name from a JSON body and check it, replying 400 when it's unusable. */
function requestedName(req: express.Request, res: express.Response): string | null {
  const username = typeof req.body?.username === 'string' ? req.body.username : ''
  const problem = usernameError(username)
  if (problem) {
    res.status(400).json({ message: problem })
    return null
  }
  return username
}

/** A signed-in account picks its player name, once. */
app.post('/api/me/username', express.json(), async (req, res) => {
  if (!sameOrigin(req, res)) return
  const username = requestedName(req, res)
  if (!username) return
  try {
    const user = await sessionUser(req.headers.cookie)
    if (!user) return void res.status(401).json({ message: 'Sign in first' })
    if (!pool) return void res.status(503).json({ message: 'Accounts unavailable' })
    if (await findPlayer(user.id)) return void res.status(409).json({ message: "You've already chosen a name" })
    const player = await createPlayer(user.id, username)
    if (!player) return void res.status(409).json({ message: 'That name is taken.' })
    res.json(player)
  } catch (err) {
    logger.error({ err }, 'Failed to choose name')
    res.status(502).json({ message: 'Could not save your name. Please try again.' })
  }
})

/** Check a guest's name: valid, and not a registered player's. Nothing is stored. */
app.post('/api/guest', express.json(), async (req, res) => {
  if (!sameOrigin(req, res)) return
  const username = requestedName(req, res)
  if (!username) return
  try {
    if (await isUsernameTaken(username)) return void res.status(409).json({ message: 'That name belongs to a registered player.' })
    res.json({ username })
  } catch (err) {
    logger.error({ err }, 'Failed to check guest name')
    res.status(502).json({ message: 'Could not check that name. Please try again.' })
  }
})

/** Same-origin sign-out, so the browser never calls the auth service cross-origin. */
app.post('/api/auth/sign-out', async (req, res) => {
  if (!sameOrigin(req, res)) return
  try {
    for (const cookie of await signOut(req.headers.cookie)) res.append('set-cookie', cookie)
    res.json({ success: true })
  } catch (err) {
    logger.error({ err }, 'Sign-out failed')
    res.status(502).json({ message: 'Sign-out is temporarily unavailable' })
  }
})

/**
 * Socket.IO middleware — resolve who is playing. A signed-in player with a name
 * gets `socket.data.userId` (stats are recorded) and `socket.data.username`.
 * A guest sends `guestName` in the handshake auth; it gets the same checks as
 * POST /api/guest. If the auth service or database fails, refuse the connection
 * so the client retries rather than silently playing a game that won't count.
 */
io.use(async (socket, next) => {
  try {
    const user = await sessionUser(socket.request.headers.cookie)
    const player = user && pool ? await findPlayer(user.id) : null
    if (player) {
      socket.data.userId = player.id
      socket.data.username = player.username
      return next()
    }
    const guestName = socket.handshake.auth?.guestName
    if (typeof guestName === 'string') {
      if (usernameError(guestName) || await isUsernameTaken(guestName)) return next(new Error('That guest name is not available'))
      socket.data.username = guestName
    }
    next()
  } catch (err) {
    logger.warn({ err }, 'Could not resolve socket session — refusing connection')
    next(new Error('Sign-in is temporarily unavailable'))
  }
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

// Log instead of exiting, so one failed background task can't end every live game.
process.on('unhandledRejection', (err) => logger.error({ err }, 'Unhandled promise rejection'))

// Migrate the database after the server is listening (non-blocking)
void initDb()
