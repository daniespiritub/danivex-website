export async function request(endpoint, action, data, signal, cursor) {
  const params = new URLSearchParams({ action })
  if (cursor) params.set('cursor', cursor)
  const response = await fetch(`/api/${endpoint}?${params}`, {
    method: data === undefined ? 'GET' : 'POST', credentials: 'same-origin', signal,
    ...(data === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  })
  const result = await response.json()
  if (!response.ok || !result.ok) throw new Error(result.error || 'service_unavailable')
  return result
}
