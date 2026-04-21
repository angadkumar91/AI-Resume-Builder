# 04. Development Guide

## Prerequisites

- Node.js 18+
- npm 9+

## Install Dependencies

From repository root:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## Environment Setup

### Backend

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend

Create `client/.env` from `client/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Run Locally

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Scripts

### Root

- `npm run dev` -> starts frontend + backend concurrently
- `npm run build` -> builds frontend
- `npm test` -> runs backend tests then frontend tests

### Client

- `npm run dev --prefix client`
- `npm run test --prefix client`
- `npm run lint --prefix client`
- `npm run build --prefix client`

### Server

- `npm run dev --prefix server`
- `npm run test --prefix server`
- `npm run start --prefix server`

## Code Quality Workflow

Recommended before every push:

```bash
npm run lint --prefix client
npm run test --prefix server
npm run test --prefix client
npm run build --prefix client
```

## Adding New Resume Sections (Pattern)

1. Extend canonical shape in store + backend normalizer.
2. Add editable UI in `ResumeTemplateBase`.
3. Add print rendering in `TemplatePrintRenderer`.
4. Extend DOCX/PDF mapping if needed.
5. Add or update tests.

## ATS Checker Behavior Notes

- ATS analysis uses backend first; frontend has local fallback logic.
- ATS apply currently auto-adds keywords into `Other Skills` to avoid content interference.
- Repeated ATS apply is dedupe-safe.

## Known Dev Pitfalls

- Missing `GEMINI_API_KEY` causes parse endpoint failure.
- Incorrect `VITE_API_BASE_URL` causes ATS/parse API network errors.
- Browser cache can show stale UI after major style changes; use hard refresh.
