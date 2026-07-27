FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace backend --include=dev
COPY backend ./backend
RUN npm run build --workspace backend

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --omit=dev --workspace backend && npm cache clean --force
COPY --from=build /app/backend/dist ./backend/dist
USER node
EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
