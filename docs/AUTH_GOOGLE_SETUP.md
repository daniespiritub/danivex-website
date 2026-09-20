# Google activation

Not live: Google Cloud credentials and a hosted Supabase project are absent.
Create a Web OAuth client under the authorized owner's Google Cloud project.
Use only openid, email and profile scopes. Configure DaniVex branding/consent,
production audience and domain ownership. Authorized redirect is the Supabase
provider callback shown in that project's dashboard, not the DaniVex BFF URL.

Store Google client ID/secret in Supabase provider settings, never Vite. Supabase
redirects to the fixed BFF callback with PKCE. Allow that URL in Supabase, test a
new and an existing identity, then set AUTH_GOOGLE_ENABLED=true on Vercel.
Keep the button hidden until tested. Enable manual linking in Supabase and
AUTH_LINKING_ENABLED only after an authenticated linking test passes. The app
does not perform its own email matching or identity merging.

Source: https://supabase.com/docs/guides/auth/social-login/auth-google
