# AI Resume Builder

Production-ready AI Resume Builder that converts raw resume text into a professional ATS-friendly resume with live editing, multiple templates, ATS analysis, and export options.

## Highlights

- AI resume parsing with Gemini (`gemini-2.5-flash-lite`)
- Real-time two-pane workflow (input -> live preview)
- Inline editing for all major sections
- Single-column ATS-friendly templates:
  - Minimal
  - Modern
  - Corporate
- ATS checker with missing keyword analysis + iterative suggestion application
- PDF and DOCX export
- Local save/load, JSON import/export, dark mode

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Zustand

### Backend
- Node.js + Express

### AI
- Google Gemini API

### Export
- PDF: `jsPDF`
- DOCX: `docx`

### Testing
- Vitest
- Testing Library
- Supertest

## Repository Structure

```text
.
├─ client/
├─ server/
├─ docs/
├─ package.json
└─ README.md
```

## Quick Start

## 1) Install dependencies

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## 2) Configure environment variables

### Backend (`server/.env`)

Copy `server/.env.example` to `server/.env` and set:

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend (`client/.env`)

Copy `client/.env.example` to `client/.env` and set:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## 3) Run locally

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Scripts

### Root

- `npm run dev` -> run frontend + backend
- `npm run build` -> build frontend
- `npm test` -> run backend tests then frontend tests

### Client

- `npm run dev --prefix client`
- `npm run lint --prefix client`
- `npm run test --prefix client`
- `npm run build --prefix client`

### Server

- `npm run dev --prefix server`
- `npm run test --prefix server`
- `npm run start --prefix server`

## API Endpoints

- `GET /health`
- `POST /api/parse-resume`
- `POST /api/ats-score`

Detailed schema and examples: [API Reference](./docs/03-api-reference.md)

## Documentation

Full documentation is available in [`docs/`](./docs/README.md):

- [Project Overview](./docs/01-project-overview.md)
- [Architecture](./docs/02-architecture.md)
- [API Reference](./docs/03-api-reference.md)
- [Development Guide](./docs/04-development-guide.md)
- [GitHub + Vercel Deployment](./docs/05-deployment-github-vercel.md)
- [Operations & Troubleshooting](./docs/06-operations-troubleshooting.md)

## Deployment

For production deployment on GitHub + Vercel, follow:

- [GitHub + Vercel Deployment Guide](./docs/05-deployment-github-vercel.md)

This repo is configured for two-project Vercel deployment:

- Frontend project root: `client`
- Backend project root: `server`

## Testing and Quality Gate

Recommended before each push:

```bash
npm run lint --prefix client
npm run test --prefix server
npm run test --prefix client
npm run build --prefix client
```

## License

MIT
