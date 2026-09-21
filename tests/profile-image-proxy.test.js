import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { EventEmitter } from 'node:events'
import { scannerProfileImage, PROFILE_IMAGE_HOST } from '../src/utils/scannerImages.js'
import { fetchProfileImage, publicImageLookup, isPublicIPv4, validatePng, IMAGE_MAX_BYTES } from '../api/_lib/profile-image-fetch.js'
import { createProfileImageHandler } from '../api/profile-image.js'

const asset = 'Icon_face_RUactivity.png'
const source = `https://${PROFILE_IMAGE_HOST}/images/itens/${asset}`
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==', 'base64')

function transport({ status = 200, headers = { 'content-type': 'image/png' }, chunks = [png], inspect = () => {} } = {}) {
  return (options, callback) => {
    inspect(options)
    const req = new EventEmitter()
    req.end = () => {
      const res = Readable.from(chunks)
      res.statusCode = status
      res.headers = headers
      callback(res)
    }
    return req
  }
}

test('Scanner proxies only exact trusted profile image URLs, including old cached profiles', () => {
  assert.equal(scannerProfileImage(source), `/api/profile-image?asset=${asset}`)
  assert.equal(scannerProfileImage(''), '')
  for (const value of [
    'https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG/902033014.png',
    'https://www.freefiremania.com.br.evil.test/images/itens/x.png',
    'https://evil.test/www.freefiremania.com.br/images/itens/x.png',
    'https://www.freefiremania.com.br@evil.test/images/itens/x.png',
    'https://www.freefiremania.com.br:444/images/itens/x.png',
    'http://www.freefiremania.com.br/images/itens/x.png',
    'https://www.freefiremania.com.br/images/itens/%2e%2e/x.png',
    `${source}?url=http://127.0.0.1`, `${source}#fragment`, '/local.png',
  ]) assert.equal(scannerProfileImage(value), value)
})

test('image proxy rejects private, reserved, loopback, metadata, IPv6 and mapped IPs', () => {
  for (const value of ['0.0.0.0', '10.0.0.1', '127.0.0.1', '169.254.169.254', '100.64.0.1',
    '100.127.255.255', '172.16.0.1', '172.31.255.255', '192.168.1.1', '192.0.0.1', '192.0.2.1',
    '192.88.99.1', '198.18.0.1', '198.19.0.1', '198.51.100.1', '203.0.113.1', '224.0.0.1',
    '255.255.255.255', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', 'localhost', '2130706433']) {
    assert.equal(isPublicIPv4(value), false, value)
  }
  for (const value of ['104.21.1.1', '172.67.1.1', '1.1.1.1']) assert.equal(isPublicIPv4(value), true)
})

const lookupResult = (resolver, host = PROFILE_IMAGE_HOST, options = {}) => new Promise((accept, reject) => {
  publicImageLookup(resolver)(host, options, (error, ...values) => error ? reject(error) : accept(values))
})

test('image socket DNS pins checked addresses and rejects mixed/private answers', async () => {
  const valid = async () => [{ address: '104.21.1.1', family: 4 }]
  assert.deepEqual(await lookupResult(valid), ['104.21.1.1', 4])
  assert.deepEqual(await lookupResult(valid, PROFILE_IMAGE_HOST, { all: true }), [[{ address: '104.21.1.1', family: 4 }]])
  await assert.rejects(lookupResult(valid, 'localhost'), /host_denied/)
  for (const records of [[], [{ address: '127.0.0.1', family: 4 }],
    [{ address: '104.21.1.1', family: 4 }, { address: '10.0.0.1', family: 4 }],
    [{ address: '::ffff:104.21.1.1', family: 6 }]]) {
    await assert.rejects(lookupResult(async () => records), /address_denied/)
  }
  await assert.rejects(lookupResult(async () => { throw new Error('resolver unavailable') }), /dns_failed/)
})

test('proxy accepts PNG bytes with fixed HTTPS host and no client cookie/auth headers', async () => {
  const result = await fetchProfileImage(asset, { transport: transport({ inspect(options) {
    assert.equal(options.hostname, PROFILE_IMAGE_HOST)
    assert.equal(options.protocol, 'https:')
    assert.equal(options.path, `/images/itens/${asset}`)
    assert.equal(options.agent, false)
    assert.equal(options.family, 4)
    assert.equal(typeof options.lookup, 'function')
    assert.deepEqual(Object.keys(options.headers).sort(), ['Accept', 'Accept-Encoding', 'User-Agent'])
  } }) })
  assert.deepEqual(result, png)
})

test('proxy cannot accept arbitrary URLs, traversal, query strings or executable types', async () => {
  for (const name of ['https://evil.test/a.png', '//127.0.0.1/a.png', '../a.png', 'a.png?url=x', '%2e%2e.png',
    'a.svg', 'a.html', 'a.png/../../x', 'a\\b.png', 'a'.repeat(161) + '.png', '', null]) {
    await assert.rejects(fetchProfileImage(name, { transport: () => assert.fail('must not fetch') }), /name_denied/)
  }
})

test('proxy rejects every redirect without following Location, including same-host and metadata', async () => {
  for (const status of [301, 302, 303, 307, 308]) {
    for (const location of ['http://169.254.169.254/latest/meta-data', source, 'https://evil.test/x.png']) {
      await assert.rejects(fetchProfileImage(asset, { transport: transport({ status, headers: { location } }) }), /upstream_status/)
    }
  }
})

test('proxy rejects upstream errors, HTML, SVG, mislabeled body and compression', async () => {
  await assert.rejects(fetchProfileImage(asset, { transport: transport({ status: 403 }) }), /upstream_status/)
  for (const type of ['text/html', 'image/svg+xml', 'application/octet-stream', undefined]) {
    await assert.rejects(fetchProfileImage(asset, { transport: transport({ headers: { 'content-type': type } }) }), /type_denied/)
  }
  await assert.rejects(fetchProfileImage(asset, { transport: transport({ chunks: [Buffer.from('<html>not an image</html>')] }) }), /content_denied/)
  await assert.rejects(fetchProfileImage(asset, { transport: transport({ headers: { 'content-type': 'image/png', 'content-encoding': 'gzip' } }) }), /encoding_denied/)
})

test('proxy limits declared and streamed sizes, including missing Content-Length', async () => {
  await assert.rejects(fetchProfileImage(asset, { transport: transport({ headers: { 'content-type': 'image/png', 'content-length': String(IMAGE_MAX_BYTES + 1) } }) }), /too_large/)
  await assert.rejects(fetchProfileImage(asset, { transport: transport({ chunks: [png, Buffer.alloc(IMAGE_MAX_BYTES)] }) }), /too_large/)
  const huge = Buffer.from(png)
  huge.writeUInt32BE(100000, 16)
  assert.equal(validatePng(huge), false)
  assert.equal(validatePng(Buffer.alloc(0)), false)
})

test('proxy deadline aborts a request before headers and during a stalled body', async () => {
  for (const hasHeaders of [false, true]) {
    let aborted = false
    const stalled = (options, callback) => {
      const req = new EventEmitter()
      const res = new Readable({ read() {} })
      res.statusCode = 200
      res.headers = { 'content-type': 'image/png' }
      req.end = () => { if (hasHeaders) callback(res) }
      options.signal.addEventListener('abort', () => {
        aborted = true
        const error = new Error('test_deadline')
        if (hasHeaders) res.destroy(error)
        else req.emit('error', error)
      }, { once: true })
      return req
    }
    await assert.rejects(fetchProfileImage(asset, { transport: stalled, timeoutMs: 15 }), /test_deadline/)
    assert.equal(aborted, true)
  }
})

async function invoke(url, method = 'GET', dependencies = {}) {
  const res = { code: 0, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k] = v }, status(code) { this.code = code; return this }, end(body) { this.body = body; return this } }
  await createProfileImageHandler({ download: async () => png, limit: async () => ({ blocked: false }), ...dependencies })({ url, method, headers: {} }, res)
  return res
}

test('image handler validates query and methods before fetching or rate limiting', async () => {
  const blocked = { download: () => assert.fail('must not fetch'), limit: () => assert.fail('must not count') }
  for (const query of ['', '?url=https://evil.test', '?asset=../x.png', `?asset=${asset}&asset=${asset}`, `?asset=${asset}&url=x`]) {
    assert.equal((await invoke(`/api/profile-image${query}`, 'GET', blocked)).code, 400)
  }
  assert.equal((await invoke(`/api/profile-image?asset=${asset}`, 'POST', blocked)).code, 405)
})

test('image handler caches only successful images, does not expose upstream errors or permit cross-origin embedding', async () => {
  const url = `/api/profile-image?asset=${asset}`
  const ok = await invoke(url)
  assert.equal(ok.code, 200)
  assert.deepEqual(ok.body, png)
  assert.equal(ok.headers['Content-Type'], 'image/png')
  assert.equal(ok.headers['Cross-Origin-Resource-Policy'], 'same-origin')
  assert.equal(ok.headers['X-Content-Type-Options'], 'nosniff')
  assert.match(ok.headers['Cache-Control'], /s-maxage=86400/)
  assert.equal(ok.headers['Access-Control-Allow-Origin'], undefined)
  assert.equal((await invoke(url, 'HEAD')).body, undefined)
  const failed = await invoke(url, 'GET', { download: async () => { throw new Error('sensitive upstream internals') } })
  assert.equal(failed.code, 502)
  assert.equal(failed.headers['Cache-Control'], 'no-store')
  assert.equal(failed.body, undefined)
})

test('image rate limit stops upstream traffic with Retry-After', async () => {
  const result = await invoke(`/api/profile-image?asset=${asset}`, 'GET', {
    limit: async () => ({ blocked: true, retryAfter: 42 }), download: () => assert.fail('must not fetch'),
  })
  assert.equal(result.code, 429)
  assert.equal(result.headers['Retry-After'], '42')
  assert.equal(result.headers['Cache-Control'], 'no-store')
})
