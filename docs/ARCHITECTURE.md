# DaniVex platform architecture

`src/App.jsx` resolves public, account/auth and privacy routes. Existing home and
Scanner remain independent. `src/account/AccountProvider.jsx` loads a small public
capability response; unavailable services have no navigation/widget. Account UI,
translations and chat are separate lazy chunks. No account dependency downloads the
38k catalog before a sensitivity search.

`api/auth.js`: email, password, recovery, PKCE callback, official identity linking,
session/logout, email update and recent-auth account deletion.
`api/account.js`: strict action/table allowlist, owned rows, cursor pagination,
profile, favorites, presets, requested downloads, support and activity.
`api/assistant.js`: availability, fail-closed limits, budget, minimal retrieval/tools.
`api/_account/`: transport security, Supabase client, resource registry and knowledge.

`supabase/migrations/202609190001_accounts.sql` creates profiles, favorites, saved,
downloads, chats, support, activity, column grants, indexes and RLS. UUID ownership
cascades on deletion. Chat opt-out removes saved exchanges. Download completion is
not observable, so status is honestly `requested`. Distribution UUID remains unused
until a real signed-distribution design exists. No DRM or admin console.

`scripts/dev-api.mjs` maps a closed set of API handlers in Vite dev, keeping secrets
in the server process. `scripts/qa-account.mjs` is browser-fixture QA, explicitly not
production Auth proof. `tests/account-security.test.js` executes PostgreSQL policies.
`tests/account-api.test.js` checks BFF gates and SDK PKCE storage. Existing tests cover
Scanner, sensitivity and Companion. `scripts/security-scan.mjs` is a bounded secret /
bundle scan, not a substitute for GitHub secret scanning or a penetration test.

Deployment: Vercel project danivex-website. Existing Redis remains exclusively for
public FF observations, visits and rate/budget keys; private records use PostgreSQL.
