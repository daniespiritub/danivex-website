# Privacy data flow

Browser -> Vercel BFF -> Supabase Auth/PostgreSQL: credentials/session and owned
profile/favorites/presets/download requests/support. No email primary keys. Browser
receives own email/settings but no bearer/refresh token. No public profiles/handles.

Browser -> public Scanner -> public FF providers: public UID/region only. Redis
observations stay separate. These providers never receive account UUIDs, email,
tokens, favorites or chats. Source images may reveal browser network metadata.

Browser -> Assistant -> OpenAI: user-written message, allowlisted page category,
language and reviewed public docs. No automatic identity/full history. Optional
authorized tool sends only three owned counts. Chat save requires profile opt-in
AND per-message choice; opt-out deletes history. Support transcript requires separate
consent. Model output is untrusted text, not executable content or authorization.

Browser -> GitHub release: actual outbound download. Account history stores requested
resource/version/time, never claims completion. No tracking pixels/ads/third-party
analytics were added. Redis rate keys store HMAC identifiers with short TTLs.

Owner must approve provider retention/region, legal controller/contact details and
backup retention before enabling accounts/AI. Published privacy text states actual
technical behavior; it is not a claim of legal certification. OpenAI store:false is
not a promise of zero abuse-monitoring retention.
