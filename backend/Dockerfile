FROM node:22-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace backend --include-workspace-root=false

COPY backend ./backend

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "run", "start:docker", "--workspace", "backend"]
