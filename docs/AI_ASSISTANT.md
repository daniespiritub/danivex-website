# DaniVex Assistant

Backend: api/assistant.js; public retrieval: api/_account/knowledge.js; model/tool
boundary: api/_account/assistant.js. Real OpenAI Responses integration, not canned
answers. No API credential/model is configured, so it is hidden in production.

Knowledge consists of reviewed existing sensitivity/Scanner/Mobilador/privacy facts.
Simple bounded lexical retrieval is sufficient for five documents; no vector DB
or external scraping is introduced. Update these records and review their sources
with each release. Sources are returned as allowlisted links separately from text.
The fifth record explicitly states that VEXA/modules have no verified published
catalog yet. This is not a fabricated module or compatibility database.

The only tool is get_my_summary, accepts an empty object and returns own counts.
No IDs, email, history, arbitrary SQL, URLs, filesystem or shell tools. Consent and
session are checked outside the model; tools cannot mutate anything. Two bounded
provider rounds, store:false, output cap and request deadlines. Public context strips
UID URLs into allowlisted categories. Conversations are independent; full history
is never automatically replayed. Persisting a turn requires explicit opt-in.
Private tool arguments are parsed JSON with an empty-object schema; extra IDs,
arrays, null, arbitrary tools and lack of consent are rejected before a query.
Signed-in requests receive a per-user limit even when asking public questions.

Activation: provision authorized OPENAI_API_KEY, choose/test OPENAI_MODEL, set spend
limits in provider, review privacy/retention, configure RATE_LIMIT_SECRET + Redis,
test success/provider failure/injection/cost gates, then ASSISTANT_ENABLED=true.
Live model quality and provider response tests remain BLOCKED until credentials.

Source: https://developers.openai.com/api/docs/guides/function-calling
