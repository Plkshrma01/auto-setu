# AutoSetu — plain HTML, CSS & JavaScript

A responsive starter for a local auto-rickshaw and carpool service. **No React, no Vite, no build step.**

## What works immediately (browser demo)
- Passenger can create a ride request, view its status and cancel it.
- Driver can go online/offline, accept/reject requests and progress a trip through statuses.
- Carpool posts can be created, filtered and requested locally.
- Admin overview and JSON export of browser demo data.
- Responsive layout and an OpenStreetMap/Leaflet map with optional browser geolocation.
- Optional Supabase email authentication scaffold and SQL schema.

## Important limitations
This is a **working prototype, not a production ride-hailing service**. Without Supabase configuration, records live only in the current browser profile and are not shared with other people/devices. The optional cloud insert currently syncs ride creation only; driver actions, carpools, realtime dispatch, payments, SMS/WhatsApp, verified driver onboarding, secure admin roles, SOS response, route-based pricing and production-grade abuse controls are not implemented end-to-end. Do not use it to coordinate real rides until the backend and safety workflow are completed and tested.

## 1. Run locally
1. Download and unzip the AutoSetu folder.
2. Open the folder in VS Code.
3. Install the VS Code extension **Live Server** (or use any static web server).
4. Right-click `index.html` → **Open with Live Server**. It will open a local URL such as `http://127.0.0.1:5500`.
5. Try a ride request, open **Driver**, switch online, and accept the request. Use the same browser and local server origin.
6. Test carpool creation/search and the Admin overview.

Do not simply double-click `index.html` if using ES modules or auth later; use localhost/HTTPS. Internet is required for CDN scripts and map tiles.

## 2. Configure Supabase authentication/database (optional next step)
1. Create a project at https://supabase.com/.
2. In Project Settings → API, copy the **Project URL** and the **publishable/anon key**.
3. Open `js/config.js` and paste values into `supabaseUrl` and `supabaseAnonKey`. Browser keys are public; never paste a `service_role`/secret key here.
4. In Supabase → SQL Editor, open `supabase/schema.sql`, paste the full SQL and run it.
5. In Authentication → URL Configuration, add your local site URL (for example `http://127.0.0.1:5500`) to allowed redirect URLs/site URL as appropriate.
6. In Authentication → Providers, configure Email. For testing, follow the project's email confirmation settings.
7. Reload the page and use Sign in/Create account.
8. Test with two separate user accounts and confirm that database access follows RLS policies.

**Security note:** review and tighten RLS before production. The included SQL is a starting point, not a complete security audit. In particular, the sample rides update policy is intentionally simple and should be replaced with status-transition rules and driver assignment validation enforced server-side. Never use an admin role supplied by browser input as proof of authorization.

## 3. What must be built before real launch
- Server-side ride dispatch: atomic driver assignment, driver eligibility/verification and allowed status transitions.
- Full authenticated database integration for profiles, driver presence/location, carpools and seat requests.
- Realtime updates with Supabase Realtime or a server WebSocket; push/SMS notifications with a trusted server.
- Maps/geocoding/directions with an appropriate provider and key restrictions. The current map is a visual map and does not calculate road routes or live driver tracking.
- Secure admin authorization enforced by database policies/server, not hidden links.
- Driver document verification, incident/SOS escalation plan, audit logs, rate limits, privacy/retention policy, consent and local legal review.
- Real fare rules, refunds/cancellations, ratings moderation, accessibility and multilingual UI.
- Automated tests, backups, monitoring and deployment on HTTPS.

## 4. Deploy a static prototype
1. Push the folder to a private GitHub repository.
2. Import it into Netlify, Cloudflare Pages or GitHub Pages (static site).
3. Publish the project root; there is no build command and no output folder.
4. Add the deployed HTTPS domain to Supabase Auth URL configuration.
5. Test on mobile and desktop. Remember: frontend-only demo data is per browser, not a shared service.

## Suggested implementation order
1. Supabase auth + profiles.
2. Role-based access and verified driver onboarding.
3. Complete ride lifecycle using secure database functions/RPCs.
4. Realtime driver presence and ride updates.
5. Carpool listings and transactional seat requests.
6. SOS/report moderation + admin-only dashboard.
7. Payments, notifications, matching and analytics.
8. Security review and limited pilot with a small, trusted group.

## Files
- `index.html` — passenger landing/ride request/map
- `driver.html` — driver centre
- `carpool.html` — shared trips
- `admin.html` — local demo dashboard
- `css/style.css` — responsive styling
- `js/config.js` — optional Supabase config
- `js/app.js`, `js/driver.js`, `js/carpool.js`, `js/admin.js` — app behaviour
- `supabase/schema.sql` — initial database schema and RLS policies
