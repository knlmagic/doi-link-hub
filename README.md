# Insurance Filing Link Hub

A static, auto-updating directory of state insurance product filing portals (SERFF and DOI links). Built for high reuse and low maintenance.

## Quick Start (Local)

```bash
# serve locally
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy to GitHub Pages (auto-updating)

1. Create a new GitHub repo, e.g., `doi-link-hub` and push these files.
2. In GitHub: **Settings → Pages**: set Source to "GitHub Actions".
3. The included workflow `.github/workflows/linkcheck.yml` will:
   - Run a weekly link check (Mon 09:00 UTC),
   - Update `assets/health.json`,
   - Deploy the site to Pages.

> You can also trigger it manually via **Actions → Link Check & Deploy → Run workflow**.

## Add/Refine Links

- Edit `assets/statePortals.json`. Use known SERFF public access or state DOI public portals.
- The generic pattern used here for SERFF is `https://filingaccess.serff.com/sfa/home/XX` (XX = state code).
  This works for many states; replace any that fail health checks with the correct link.
- After edits, push to `main`. The next deploy will reflect changes.

## How Health Works

- `scripts/check_links.mjs` performs HEAD/GET requests for each link and writes `assets/health.json`.
- The UI displays status (`OK` or `ERR ###`) for each URL.

## Filters & Search

- Search by name/code/region. Filter by Region or Line of Business.
- LoB tags are metadata only; adjust per state if you know differences.

## Netlify / Vercel

This is a plain static site. For Netlify:
- Drag and drop the folder, or connect repo.  
For Vercel:
- Import the repo and deploy as a static project.

## Roadmap Ideas

- Per-carrier deep links and saved searches.
- SERFF query templates (company name, TOI, date windows).
- Bulk export to CSV from the UI.
- Role-based notes (compliance vs. product vs. actuarial).

_Last generated: 2025-08-13T17:27:42.064897Z_


## Deploy to Heroku (auto-deploy from GitHub)

1. In Heroku, create a new app (e.g., `doi-link-hub`).
2. **Deploy → Deployment method → GitHub** → Connect your repo.
3. Enable **Automatic deploys** from your `main` branch.
4. Go to **Resources** and make sure a **web** dyno is enabled.
5. (Optional) Keep GitHub Actions enabled in this repo to update `assets/health.json` weekly.
   - Every Action commit will trigger Heroku to rebuild and redeploy automatically.
6. Open the app. The static site is served by `server.js` (Express).

> Note: This is a static site; Heroku is not strictly required, but this setup mirrors your existing workflow.


## Deploy to GitHub Pages (free & simplest)

1. Create a **public** GitHub repository (Pages is free for public repos).
2. Push all files from this project to the `main` branch.
3. In your GitHub repo: go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Save. The included `.github/workflows/linkcheck.yml` will:
   - Run the weekly link checker (`scripts/check_links.mjs`).
   - Commit updated `assets/health.json` if needed.
   - Auto-deploy the site to Pages.

Your live site will be available at:
```
https://<your-username>.github.io/<your-repo-name>/
```

> You can also trigger the deploy instantly by going to **Actions → Link Check & Deploy → Run workflow**.
