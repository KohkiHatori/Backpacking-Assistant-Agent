# Backpacking Assistant Agent

A unified, multi-agent travel companion designed to address the fragmentation and manual overhead inherent in planning complex, multi-destination trips.

## Overview

The process of planning a complex backpacking trip is often fragmented and labor-intensive, forcing travelers to rely on a disjointed ecosystem of tools. This project centralizes trip planning and management into a single, "AI-native" platform.

At its core is a modular AI architecture where a cohort of specialized agents automates key planning domains. These agents leverage large language models like **Google’s Gemini 2.5 Flash** for creative and structured data generation and **Perplexity AI** for real-time, citation-backed web research.

The system is architected to provide holistic and personalized support, maintaining a persistent, context-aware understanding of user preferences, past trips, and chat history.

## Key Features

-   **Specialized AI Agents:** A cohort of agents handles specific domains:
    -   **Itinerary Generation:** Automates route planning and activity suggestions.
    -   **Visa & Vaccination:** conducts research on entry and health requirements.
    -   **Accommodation:** Provides personalized stay suggestions.
-   **Advanced AI Integration:**
    -   **Gemini 2.5 Flash:** Used for creative content and structured data generation.
    -   **Perplexity AI:** Enables real-time, citation-backed web research.
-   **Unified Experience:** Eliminates context-switching by combining research, itinerary management, and budget tracking in one modern web application.
-   **Scalable Architecture:** Built with LangGraph for complex orchestration, currently optimized for performance via direct agent invocation.

## Tech Stack

-   **Monorepo:** Turborepo
-   **Frontend:** Next.js 15 with React
-   **Backend:** FastAPI (Python 3.11+)
-   **Database:** PostgreSQL 16 (via Supabase)
-   **AI Framework:** LangGraph
-   **LLMs:** Google Gemini 2.5 Flash, Perplexity AI
-   **ORM:** Drizzle ORM (TypeScript) / SQLModel (Python)
-   **Real-time:** Supabase Realtime / Yjs
-   **Auth:** NextAuth.js
-   **Deployment:** Vercel (frontend), Railway (backend)
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

## Citation

```text
Kohki Hatori. 2025. Backpacking Assistant Agent. 1, 1 (December 2025), 8 pages. https://doi.org/10.1145/nnnnnnn.nnnnnnn
```
