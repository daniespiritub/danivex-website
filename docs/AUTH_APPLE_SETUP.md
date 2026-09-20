# Apple activation

Not live: requires an authorized Apple Developer account and hosted Supabase.
Configure Sign in with Apple App ID/Services ID, Team ID, Key ID, private signing
key and approved domain/return URL following the provider dashboard instructions.
Store Apple provider credentials in Supabase only. The secret has an expiry and
must be rotated before expiry; schedule this operationally outside application code.

Test normal and Hide My Email identities. Never merge an Apple relay address with
another account by string matching. Official authenticated linkIdentity is the only
manual linking path. App profile avatar is local and does not depend on Apple photos.
Set AUTH_APPLE_ENABLED=true only after staging callback and production URL checks.
Purchasing membership, accepting terms and owner 2FA are external actions.

Source: https://supabase.com/docs/guides/auth/social-login/auth-apple
