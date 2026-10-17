# AutoSetu role login upgrade

## Included in this package
- `login.html`: combined login/signup screen with passenger/driver selection.
- `js/auth.js`: Supabase email/password signup and login; verifies the saved profile role before redirecting.
- `js/guard.js`: protects passenger (`index.html`) and driver (`driver.html`) workspaces and redirects users to the right one.
- `supabase/role_auth_setup.sql`: creates profile rows from trusted auth signup events and blocks users changing their own role.
- `css/role-auth.css`: tracker panel styling.

## Deploy steps
1. Upload the complete `AutoSetu` folder contents while preserving `css/`, `js/`, and `supabase/` folders. The HTML files must stay at the repository root.
2. Make sure `js/config.js` contains the Supabase project URL and the public anon/publishable key. Never put a `service_role`/secret key in browser JavaScript.
3. In Supabase SQL Editor, run `supabase/role_auth_setup.sql` once. This assumes the original `supabase/schema.sql` was already run and created `profiles`, `drivers`, and `user_role`.
4. In Supabase Authentication > URL Configuration, add your GitHub Pages origin and URLs, including `https://YOURNAME.github.io/YOURREPO/` and `https://YOURNAME.github.io/YOURREPO/login.html` to Redirect URLs.
5. In Supabase Authentication > Providers, enable Email. During testing, either confirm emails or configure the confirmation setting according to your test plan.
6. Visit `https://YOURNAME.github.io/YOURREPO/login.html`. Create a passenger account and a separate driver account. If email confirmation is enabled, confirm the email before signing in.
7. At login, select the role that account was registered with. A role mismatch signs the user out and explains which role to choose.
8. After signup, the database trigger creates the profile and (for drivers) a pending driver record. Driver approval is not automated.

## Important limitations
This is still a starter, not a production ride service. The current driver/ride demo interactions are largely local browser storage. The map is a map display, not a live moving vehicle tracker; the tracker panel explains status steps but actual cross-device GPS, realtime notifications, dispatch, and secure status updates need additional database/API work. Do not use for real passenger transport until RLS policies and server-side ride assignment/status changes are reviewed and tested.
