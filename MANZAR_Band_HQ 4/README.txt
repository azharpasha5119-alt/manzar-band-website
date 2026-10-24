MANZAR — NETLIFY FILE-BASED PRODUCTION SETUP (NO DATABASE)
=========================================================

WHAT THIS VERSION DOES
- Public website has no Admin link in its navigation or footer.
- /admin.html is a private control-room URL. Login and all write operations are checked by Netlify serverless functions.
- Shows are stored in data/shows.json (a website file, not a database).
- After an admin clicks “Save & publish all shows”, a Netlify Function validates the data and commits the file to your GitHub repository using a token stored only in Netlify environment variables. GitHub's connected Netlify site then deploys the change automatically.
- Guest requests are collected with Netlify Forms. No payment is collected.
- No database or Supabase project is required.

IMPORTANT LIMITATIONS
1. Netlify Forms collects requests, but it does not atomically reserve/decrement seats. The site cannot guarantee seat capacity or prevent two guests from requesting the last seat. Confirm requests manually and update capacity/availability in the show notes, or move to a database/booking service if strict capacity enforcement is required.
2. Form submissions are available in Netlify Dashboard > Forms > reservations. To show them inside the admin dashboard, configure NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID as described below.
3. Poster images are referenced by HTTPS URL. This version does not upload binary image files through the admin dashboard; host the image (for example in the repository or an image host) and paste its public HTTPS URL.
4. Publishing only works when Netlify is connected to the GitHub repository. Manual drag-and-drop deployments do not create a GitHub commit/deploy pipeline for future admin changes.
5. The admin URL is not a secret. Authentication is enforced by server functions, but the static login page itself can be loaded by anyone. Use a strong unique password and keep the GitHub token secret.

STEP 1 — PUT THE WEBSITE IN A PRIVATE GITHUB REPOSITORY
1. Extract the MANZAR production ZIP.
2. Create a private repository on GitHub.
3. Upload the contents of the MANZAR_Band_HQ folder to the repository root (index.html should be at root).
4. Use the branch name you intend to deploy (usually main).

STEP 2 — CONNECT NETLIFY TO GITHUB
1. Open https://app.netlify.com/ and choose Add new site > Import an existing project.
2. Connect the private GitHub repository.
3. Build command: leave blank. Publish directory: .
4. Deploy the site. Netlify Functions are in netlify/functions.

STEP 3 — CREATE A LIMITED GITHUB TOKEN
Create a fine-grained GitHub personal access token restricted to this repository, with Contents: Read and write permission. Do not put this token in website files or share it. You may also use a GitHub App token if you manage one.

STEP 4 — SET NETLIFY ENVIRONMENT VARIABLES
In Netlify Site configuration > Environment variables, add:
- ADMIN_PASSWORD = a strong unique password (use at least 16 characters; do not reuse another password)
- ADMIN_SESSION_SECRET = a long random secret (32+ random bytes recommended)
- GITHUB_TOKEN = the fine-grained token from Step 3
- GITHUB_OWNER = your GitHub username or organisation
- GITHUB_REPO = exact repository name
- GITHUB_BRANCH = main (or the deployed branch)

Generate a session secret on macOS Terminal with:
  openssl rand -base64 48

Trigger a new Netlify deploy after adding environment variables. Do not commit secrets to GitHub.

STEP 5 — OPTIONAL: SHOW RESERVATIONS INSIDE ADMIN
Netlify Forms always stores submissions in Netlify Dashboard > Forms. To fetch those submissions into the authenticated admin page, add:
- NETLIFY_AUTH_TOKEN = a personal access token for the Netlify account/site
- NETLIFY_SITE_ID = the site API ID from Netlify site settings
Keep this token only in Netlify environment variables. If you skip this optional setup, view requests in Netlify Dashboard > Forms > reservations.

STEP 6 — CREATE AND PUBLISH SHOWS
1. Open https://YOUR-SITE.netlify.app/admin.html
2. Enter ADMIN_PASSWORD.
3. Click Add a show. Use a unique Show ID containing only letters, numbers, hyphens or underscores (e.g. paytey-live-oct-2026).
4. For poster, enter a public HTTPS image URL.
5. Leave status Draft until ready. Set Published to display the event publicly.
6. Click Save & publish all shows. Wait for Netlify's new deploy to finish, then refresh the public site.
7. To edit/delete shows, update them in admin and publish again.

NETLIFY FORMS / CAPACITY
- Reservation forms are named “reservations”. Fan review form is named “fan-reviews”.
- Submissions are requests, not guaranteed bookings. Netlify Forms does not reserve seats or enforce capacity.
- Manually review each submission and confirm with the guest/venue. If capacity is reached, mark the show cancelled/unpublish it or add a clear note; this is not real-time inventory control.
- Enable Netlify's spam filtering and consider CAPTCHA or another anti-abuse mechanism before public promotion.

URLS
Public: https://YOUR-SITE.netlify.app/
Admin:  https://YOUR-SITE.netlify.app/admin.html
No Admin link appears on the public website.

LOCAL PREVIEW
The static pages can be previewed using:
  python3 -m http.server 8080
Public: http://localhost:8080
Admin functions require Netlify deployment and configured environment variables; the protected publishing workflow does not work on the simple Python server.
