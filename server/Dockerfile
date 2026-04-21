FROM node:22-alpine

WORKDIR /app

COPY shared/ ./shared/

COPY server/package*.json ./server/
RUN cd server && npm install

COPY server/ ./server/

EXPOSE 3001
ENV TOWERS_PORT=3001 LOG_LEVEL=info NODE_ENV=production

WORKDIR /app/server
CMD ["npm", "start"]
