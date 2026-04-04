import pino from 'pino'

/** Application logger — console transport for development. */
export const logger = pino({
  transport: {
    target: 'pino/file',
    options: { destination: 1 }, // stdout
  },
  level: process.env.LOG_LEVEL || 'info',
})
