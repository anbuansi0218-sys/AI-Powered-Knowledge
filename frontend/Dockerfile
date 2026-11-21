FROM node:22-slim AS build

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace frontend --include-workspace-root=false

COPY frontend ./frontend
ARG VITE_API_URL=http://localhost:5001/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build --workspace frontend

FROM nginx:alpine
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html
EXPOSE 80
