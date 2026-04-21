# 02. Architecture

## High-Level Design

The system follows a clear client-server split:

- **Client** handles UX, editing, template rendering, ATS interactions, and export actions.
- **Server** handles AI parsing and ATS scoring API endpoints.

```text
Browser (React + Zustand)
   |
   | HTTP /api/*
   v
Express API (Node.js)
   |
   | Gemini API call
   v
Google Generative Language API
```

## Frontend Architecture

### State Ownership
Centralized in Zustand store (`client/src/store/useResumeStore.js`):

- `rawText`
- `resume`
- `templateId`
- `jobDescription`
- `atsResult`
- `theme`
- async actions: `generateResume`, `runAtsCheck`, `applyAtsSuggestions`

### Rendering Layers

- **Edit View**: powered by `ResumeTemplateBase` (`mode="edit"`)
- **Print View**: powered by template print renderer (`mode="print"`) for consistent export behavior

### Templates

- Minimal
- Modern
- Corporate

Each template is single-column and receives the same resume data contract.

## Backend Architecture

### Request Flow

- Router (`server/routes/resumeRoutes.js`)
- Controller (`server/controllers/resumeController.js`)
- Service layer (`server/services/*.js`)
- Schema normalization/validation (`server/utils/resumeSchema.js`)

### Endpoints

- `POST /api/parse-resume`
- `POST /api/ats-score`
- `GET /health`

### AI Flow

1. Receive `rawText`.
2. Build strict prompt for Gemini.
3. Parse/sanitize model JSON response.
4. Normalize shape and infer missing structured details from raw text where possible.

## Data Contract (Canonical Resume Shape)

```json
{
  "name": "",
  "contact": {
    "email": "",
    "phone": "",
    "location": "",
    "portfolio": "",
    "profiles": [{ "label": "", "value": "" }]
  },
  "summary": "",
  "skills": [{ "category": "", "items": [""] }],
  "experience": [{ "role": "", "company": "", "duration": "", "points": [""] }],
  "projects": [{ "name": "", "role": "", "duration": "", "points": [""] }],
  "education": [""],
  "certifications": [""],
  "achievements": [""],
  "additional": [""],
  "customSections": [{ "title": "", "items": [""] }],
  "sectionTitles": {
    "summary": "Professional Summary",
    "experience": "Work Experience",
    "projects": "Projects",
    "skills": "Technical Skills",
    "education": "Education",
    "certifications": "Certifications",
    "achievements": "Achievements",
    "additional": "Additional Details",
    "custom": "Custom Sections",
    "profiles": "Profiles"
  }
}
```

## Reliability Considerations

- Input validation at API boundary
- Normalization fallback if AI misses fields
- Deduplication in sections (skills, projects, experience)
- ATS fallback to local scoring if server ATS request fails
- Non-destructive state updates in UI

## Security and Safety Notes

- API key stored only on backend (`GEMINI_API_KEY`)
- CORS restricted via `CORS_ORIGIN`
- No secrets in client bundle
- JSON import is parsed and normalized before hydration
