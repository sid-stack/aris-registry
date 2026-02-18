# Aris-Core Migration Complete

The migration to a monorepo structure with `apps/web` (Next.js) and `apps/api` (FastAPI) is complete.

## Architecture Overview

### Backend (`apps/api`)
- **Framework**: FastAPI with Motor (Async MongoDB).
- **Core Logic**: `main.py` handles CORS and routes.
- **Routers**:
    - `users.py`: Credit balance check.
    - `registry.py`: Agent listing.
    - `analyze.py`: PDF Analysis via Google Gemini 1.5.
- **Services**:
    - `core/gemini.py`: Integration with Gemini API.
    - `core/rfp_orchestrator.py`: Integration with Aris Protocol.

### Frontend (`apps/web`)
- **Framework**: Next.js 14 App Router with Clerk Auth.
- **Pages**:
    - `/`: Modern Landing Page ("The Operating System for Government Contracts").
    - `/dashboard`: Layout with Sidebar and Credit Widget.
    - `/dashboard/analyze`: File upload and analysis results.

## Next Steps

1.  **Environment Variables**:
    Update `apps/api/.env` with:
    ```
    MONGODB_URI=...
    CLERK_PEM_PUBLIC_KEY=...
    GEMINI_API_KEY=...
    ```
    Update `apps/web/.env.local` with:
    ```
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
    CLERK_SECRET_KEY=...
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```

2.  **Running Locally**:
    ```bash
    # API
    cd apps/api
    uvicorn main:app --reload

    # Web
    cd apps/web
    npm run dev
    ```
