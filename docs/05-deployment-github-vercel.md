# 05. GitHub + Vercel Deployment Guide

This project is a monorepo with separate frontend and backend apps.

- Frontend root: `client/`
- Backend root: `server/`

Best practice is to deploy them as **two Vercel projects** from the same GitHub repository.

---

## A. Push Project to GitHub

From repo root:

```bash
git init
git add .
git commit -m "Initial commit: AI Resume Builder"

git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If repo already exists locally:

```bash
git add .
git commit -m "docs + deployment setup"
git push
```

---

## B. Deploy Backend on Vercel

The backend is already prepared for Vercel serverless deployment using:

- `server/api/index.js`
- `server/vercel.json`

### Steps

1. Open Vercel Dashboard -> **Add New... Project**
2. Import your GitHub repo
3. In project settings:
   - **Root Directory**: `server`
   - Framework preset: `Other`
4. Add environment variables:
   - `GEMINI_API_KEY` = your Gemini key
   - `CORS_ORIGIN` = frontend URL (set after frontend deploy, then redeploy)
5. Deploy

### Verify

- `https://<backend-project>.vercel.app/health`
- `https://<backend-project>.vercel.app/api/parse-resume` (POST)

---

## C. Deploy Frontend on Vercel

1. Add another Vercel project from same repo
2. Settings:
   - **Root Directory**: `client`
   - Framework preset: `Vite`
3. Add environment variable:
   - `VITE_API_BASE_URL` = `https://<backend-project>.vercel.app`
4. Deploy

### Update Backend CORS

After frontend deployment, update backend env:

- `CORS_ORIGIN=https://<frontend-project>.vercel.app`

Then redeploy backend.

---

## D. Post-Deploy Checklist

1. Open frontend URL
2. Paste raw resume text
3. Click **Generate Resume** (should hit backend)
4. Run ATS checker
5. Download PDF and DOCX
6. Verify no CORS errors in browser console

---

## E. Optional Custom Domain

For each Vercel project:

1. Project Settings -> Domains
2. Add domain/subdomain
3. Update `VITE_API_BASE_URL` and `CORS_ORIGIN` accordingly

---

## F. Rollback Strategy

If deployment breaks:

1. Vercel -> Deployments
2. Promote previous healthy deployment
3. Investigate with logs, then re-deploy fix

---

## G. Common Vercel Issues

### 1. `Failed to fetch` from frontend
- Check `VITE_API_BASE_URL` value (must include `https://`)
- Check backend deployment is healthy

### 2. CORS blocked
- Ensure backend `CORS_ORIGIN` exactly matches frontend origin

### 3. Gemini errors in production
- Verify `GEMINI_API_KEY` is set on backend Vercel project
- Redeploy after env changes

### 4. 404 for backend API
- Ensure backend project root is `server`
- Ensure `server/vercel.json` exists

---

## H. Recommended Branch Workflow

- `main`: production-ready
- `develop`: integration testing
- feature branches: `feature/<name>`

Use PR checks:

```bash
npm run test
npm run build --prefix client
```
