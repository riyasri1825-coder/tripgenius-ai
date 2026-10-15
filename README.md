# TripGenius AI

## Trip generation API

Run the FastAPI service from the repository root:

```powershell
.\backend\venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Copy `backend/.env.example` to `backend/.env` and set `OPENAI_API_KEY` before
starting the backend. The backend loads this file when its package initializes,
before importing the route and itinerary service. It uses the OpenAI-compatible
Chat Completions API; `OPENAI_BASE_URL` and `OPENAI_MODEL` can be changed for
compatible providers. Keep the populated `.env` file private.

Send a `POST` request to `/api/trips/generate` with destination, trip length,
budget, interests, and travel type:

```json
{
  "destination": "Jaipur",
  "days": 3,
  "budget": 15000,
  "interests": ["history", "food"],
  "travel_type": "solo"
}
```

`days` must be between 1 and 60, budget must be a positive whole number (or
one of the planner's `budget`, `comfortable`, or `luxury` tiers), and at least
one non-empty interest is required. Travel type must be `solo`, `couple`,
`family`, or `friends`. The planner's camel-case `travelType` field is also
accepted.

Successful requests return `{ "success": true, "message": "...", "data": {...} }`.
The `data` object contains the submitted trip preferences and an `itinerary`
with a budget note and one entry per day. Each day includes morning,
afternoon, and evening activities with a name, description, suggested place,
and cost level.
Invalid requests return HTTP 422 with
`{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`.
AI provider configuration and generation errors return HTTP 503 or 502,
respectively, using the same `{ "success": false, "error": {...} }` structure.
