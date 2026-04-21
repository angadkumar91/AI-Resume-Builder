# 06. Operations & Troubleshooting

## Runtime Diagnostics

### Backend Health

```bash
curl https://<backend-domain>/health
```

Expected:

```json
{ "status": "ok" }
```

### Frontend API Config

Check `VITE_API_BASE_URL` in deployed frontend environment settings.

## Typical Issues and Fixes

### Issue: `POST /api/parse-resume` returns 500

Possible causes:
- Missing `GEMINI_API_KEY`
- Invalid key

Fix:
- Set correct key in backend env
- Redeploy backend

### Issue: Resume parse returns 502

Cause:
- Gemini output not parseable JSON

Fix:
- Retry request
- Keep raw input cleaner (clear sections/headings)
- Check backend logs for parse details

### Issue: ATS score call fails

Cause:
- Backend unavailable or network issue

Behavior:
- Frontend falls back to local ATS scoring automatically

### Issue: PDF output style mismatch

Cause:
- Browser cache using stale build

Fix:
- Hard refresh (`Ctrl + F5`)
- Ensure current deployment selected on Vercel

### Issue: Skills order unexpectedly changes after ATS apply

Current behavior:
- ATS apply is designed to avoid reordering categories and append keywords to `Other Skills`.

If issue appears:
- Export JSON and inspect `resume.skills`
- Reproduce steps and run latest tests

## Observability Recommendations

- Enable Vercel deployment notifications
- Monitor backend function logs for:
  - Gemini request failures
  - CORS failures
  - input validation errors

## Incident Response Playbook

1. Confirm blast radius (frontend, backend, or both)
2. Check latest deployment status
3. Roll back to previous healthy deployment if needed
4. Patch in branch
5. Run tests + build locally
6. Redeploy and validate core flows

## Backup and Recovery

For users:
- Encourage `Export JSON` before major edits
- Support `Import JSON` for restore

For maintainers:
- Tag stable releases in GitHub
- Keep deployment notes per release

## Performance Notes

- AI parse response time depends on Gemini network latency
- PDF export complexity increases with very long resumes
- Keep one-page target where possible for best export quality
