import { saveCachedProfile } from './_lib/private-db.js'

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  const body = request.body || {}
  const uid = normalizeUid(body.uid)

  if (!uid || !body.nickname) {
    response.status(400).json({
      ok: false,
      error: 'uid_and_nickname_required',
    })
    return
  }

  const saveResult = await saveCachedProfile(uid, {
    ...body,
    uid,
    provider: body.provider || 'DaniVex Manual Private DB',
  })

  response.status(200).json({
    ok: saveResult.saved,
    uid,
    saved: saveResult.saved,
    storage: saveResult.storage || '',
    reason: saveResult.reason || '',
  })
}

function normalizeUid(value) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 14)
}
