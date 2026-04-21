# 03. API Reference

Base URL (local): `http://localhost:5000`

## Health

### `GET /health`

Checks API process availability.

**Response**

```json
{ "status": "ok" }
```

---

## Parse Resume

### `POST /api/parse-resume`

Converts raw resume text into structured ATS-friendly JSON.

### Request Body

```json
{
  "rawText": "Paste raw unstructured resume text here..."
}
```

### Success Response `200`

```json
{
  "resume": {
    "name": "",
    "contact": {
      "email": "",
      "phone": "",
      "location": "",
      "portfolio": "",
      "profiles": []
    },
    "summary": "",
    "skills": [],
    "experience": [],
    "projects": [],
    "education": [],
    "certifications": [],
    "achievements": [],
    "additional": [],
    "customSections": [],
    "sectionTitles": {}
  },
  "meta": {
    "model": "gemini-2.5-flash-lite"
  }
}
```

### Error Responses

- `400` Invalid input (`rawText` missing/too short)
- `502` Gemini parse failure / malformed model output
- `500` Server configuration/runtime error

---

## ATS Score

### `POST /api/ats-score`

Compares resume content with a job description.

### Request Body

```json
{
  "resume": { "...": "canonical resume object" },
  "jobDescription": "Role requirements and responsibilities"
}
```

### Success Response `200`

```json
{
  "score": 84,
  "matchedKeywords": ["python", "sql"],
  "missingKeywords": ["docker", "kubernetes"],
  "keywordsToReach90": ["docker"],
  "stretchKeywordsFor99": ["kubernetes"],
  "targetRange": { "min": 90, "max": 99 },
  "requiredKeywordCountFor90": 1,
  "requiredKeywordCountFor99": 2,
  "actionPlan": {
    "summaryKeywords": ["docker"],
    "skillsKeywords": ["docker", "kubernetes"],
    "experienceKeywords": ["docker"]
  },
  "keywordPlacementHints": [
    {
      "keyword": "docker",
      "section": "Skills",
      "note": "Add to the most relevant skill category. If unavailable, use Other Skills.",
      "example": "Add \"docker\" under a matching skill group (or Other Skills)."
    }
  ],
  "suggestions": ["..."]
}
```

### Error Responses

- `400` invalid `resume` or `jobDescription`

---

## cURL Examples

### Parse Resume

```bash
curl -X POST http://localhost:5000/api/parse-resume \
  -H "Content-Type: application/json" \
  -d '{"rawText":"Your raw resume text"}'
```

### ATS Score

```bash
curl -X POST http://localhost:5000/api/ats-score \
  -H "Content-Type: application/json" \
  -d '{"resume":{"name":"A","contact":{"email":"","phone":"","location":"","portfolio":"","profiles":[]},"summary":"","skills":[],"experience":[],"projects":[],"education":[],"certifications":[],"achievements":[],"additional":[],"customSections":[],"sectionTitles":{}},"jobDescription":"Need Python and AWS"}'
```
