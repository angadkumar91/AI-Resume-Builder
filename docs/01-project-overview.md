# 01. Project Overview

## Product Name
AI Resume Builder

## Purpose
AI Resume Builder converts unstructured raw resume text into a structured, ATS-friendly resume with editable sections, template switching, and export capabilities (PDF and DOCX).

## Core User Journey

1. User pastes messy resume text.
2. User clicks **Generate Resume**.
3. Backend calls Gemini (`gemini-2.5-flash-lite`) and returns structured JSON.
4. Frontend renders live resume preview.
5. User edits sections inline.
6. User runs ATS analysis against a job description.
7. User applies ATS keyword suggestions.
8. User exports resume as PDF/DOCX or saves/imports JSON.

## Key Features

- Raw text to professional structured resume JSON (AI-assisted)
- Inline editing across all major sections
- Single-column ATS-safe templates:
  - Minimal
  - Modern
  - Corporate
- ATS scoring + missing keywords + iterative keyword application
- PDF and DOCX export
- Local persistence via `localStorage`
- JSON import/export
- Dark mode support

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Zustand (state management)

### Backend
- Node.js + Express

### AI
- Google Gemini (`gemini-2.5-flash-lite`)

### Export
- PDF: `jsPDF` (text-based PDF generation)
- DOCX: `docx`

### Testing
- Vitest
- Testing Library (frontend)
- Supertest (backend API tests)

## Monorepo Structure

```text
Resume_Generator/
  client/
  server/
  docs/
  package.json
```

## Non-Goals (Current Version)

- No authentication/authorization
- No database persistence
- No multi-user collaboration
- No payment or subscription layer

## Quality Principles

- Keep generated resume readable and ATS-oriented
- Avoid section loss or malformed schema
- Preserve deterministic behavior for ATS suggestions
- Keep templates single-column and print-safe
