FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src ./src
RUN mkdir -p uploads && chown -R node:node /app
USER node
ENV NODE_ENV=production HOST=0.0.0.0
EXPOSE 8000
CMD ["node", "src/server.js"]
