# AI-Powered Knowledge Assistant

A full-stack starter for managing documents and asking questions grounded in their contents. The frontend is React + Vite + Material UI, with responsive desktop and mobile navigation. The API is Express, metadata and embeddings are stored in Microsoft SQL Server, Hugging Face Transformers generates local document embeddings, and Qwen generates answers through Hugging Face Inference Providers.

The frontend pages live in `frontend/src/components` (`dashboard.jsx`, `document.jsx`, `chat.jsx`, `chathistory.jsx`, `setting.jsx`, and `profile.jsx`), with the API client in `frontend/src/services/api.js` and image assets in `frontend/src/assets`.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- Microsoft SQL Server 2017+ with TCP/IP enabled
- A Hugging Face token with Inference Providers permission and a Tavily API key for web fallback
- Network access on first use to download the Hugging Face embedding model

## Local setup

1. Create a SQL Server database named `AI-assistant` and enable TCP/IP connections. For SQL Server Express, you can configure `MSSQL_INSTANCE` in `backend/.env`; otherwise set `MSSQL_PORT`. `sa` is configured here for local development; use a least-privilege SQL login outside local development.
2. If `backend/.env` does not exist, copy `backend/.env.example` to it (PowerShell: `Copy-Item backend/.env.example backend/.env`). Preserve any existing SQL Server settings, then set `HF_TOKEN` to a fine-grained Hugging Face token with "Make calls to Inference Providers" permission and set `TAVILY_API_KEY` for web fallback.
3. Hugging Face downloads `Xenova/all-MiniLM-L6-v2` automatically the first time embeddings are generated. Chat inference runs through Hugging Face Inference Providers and may require provider credits.
4. Install dependencies from the project root:

   ```sh
   npm install
   ```

5. Start the frontend and API together. The backend applies pending SQL Server migrations before it starts:

   ```sh
   npm run dev
   ```

   The frontend runs at `http://localhost:5001` and the API at `http://localhost:5000`.

SQL Server migrations are stored as per-table `up.sql`/`down.sql` pairs in `backend/migrations`. Run pending migrations with `npm run db:migrate --workspace backend`. Rollbacks are manual: execute each `down.sql` in reverse migration order.

## Docker

1. If the root `.env` does not exist, copy `.env.example` to it (PowerShell: `Copy-Item .env.example .env`). Preserve any existing SQL Server settings, then set `HF_TOKEN` and `TAVILY_API_KEY`.
2. From the project root, run:

   ```sh
   docker compose up --build
   ```

Docker connects to a SQL Server instance on the host (`host.docker.internal` by default), applies migrations from the backend container, then starts the API and frontend. Ensure that the database exists and SQL Server accepts TCP/IP connections before starting Compose. Open `http://localhost:5001`. Set `MSSQL_SERVER`, `MSSQL_PORT`, `MSSQL_DATABASE`, `MSSQL_USER`, and `MSSQL_PASSWORD` in the root `.env`; keep the password out of source control.

## Included

- Dashboard statistics, document upload/management, document-first RAG chat with direct FAQ answers, local arithmetic, and Tavily web fallback, saved chat history, and profile/model preferences
- PDF and TXT ingestion, Hugging Face `all-MiniLM-L6-v2` embeddings, cosine-similarity retrieval from SQL Server, and context-grounded Qwen responses via Hugging Face Inference Providers
- Existing document vectors from another model are regenerated with the configured Hugging Face model the first time they are used for retrieval
- Per-table SQL Server migrations for profiles, dashboard snapshots, documents/chunks, chats, and chat history
- API health endpoint at `GET /api/health`

Documents are saved under `backend/uploads` (created automatically and ignored by Git). This is a local-development starter: add authentication, authorization, production-grade file storage, and rate limiting before exposing it to users.

## Configuration

Chat inference defaults to `https://router.huggingface.co/v1` with `Qwen/Qwen3-8B:featherless-ai`. Set `HF_TOKEN` to a Hugging Face fine-grained token that permits "Make calls to Inference Providers"; `QWEN_API_KEY` is also accepted as a compatibility alias for an existing setup. Inference-provider access and credits may be required for answers synthesized from document context. `TAVILY_API_KEY` is required when the answer is not present in the uploaded documents; web answers use Tavily's answer or search snippets directly. `HF_EMBEDDING_MODEL` remains `Xenova/all-MiniLM-L6-v2` and is used only for local embeddings.
