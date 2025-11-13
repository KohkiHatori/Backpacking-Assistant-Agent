# Backpacking Assistant Agent

Trip Planner: Plan multi-country routes with AI assistance — routes, activities, budgets.

## Tech Stack

-   **Monorepo:** Turborepo
-   **Frontend:** Next.js 15 with React
-   **Backend:** FastAPI (Python 3.11+)
-   **Database:** PostgreSQL 16 (via Supabase)
-   **ORM:** Drizzle ORM (TypeScript) / SQLModel (Python)
-   **Cache/Queue:** Redis
-   **Real-time:** Supabase Realtime / Yjs + y-websocket
-   **Auth:** NextAuth.js
-   **API:** REST (public) + tRPC (internal TypeScript services)
-   **WebSockets:** Socket.io or native WebSockets with Redis pub/sub
-   **Agent Framework:** Langgraph
-   **Deployment:** Vercel (frontend), Railway (backend)
-   **CI/CD:** GitHub Actions
-   **Containerization:** Docker

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/backpacking-assistant-agent.git
    cd backpacking-assistant-agent
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    -   Create a `.env` file in `apps/web` by copying the example: `cp apps/web/.env.example apps/web/.env`
    -   Fill in the required values in `apps/web/.env`.

4.  **Run the development servers:**
    ```bash
    docker-compose up --build
    ```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8000`.
