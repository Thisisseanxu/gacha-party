const encoder = new TextEncoder()

async function signingKey(secret, usages) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  )
}

function signedMessage(url, timestamp, body) {
  const target = new URL(url)
  return encoder.encode(`POST\n${target.pathname}${target.search}\n${timestamp}\n${body}`)
}

export async function signSourceRequest(url, body, secret, now = Date.now()) {
  const timestamp = String(now)
  const signature = await crypto.subtle.sign(
    'HMAC',
    await signingKey(secret, ['sign']),
    signedMessage(url, timestamp, body),
  )
  return {
    'Content-Type': 'application/json',
    'X-Ranking-Timestamp': timestamp,
    'X-Ranking-Signature': Array.from(new Uint8Array(signature), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join(''),
  }
}

export async function verifySourceRequest(request, body, secret, now = Date.now()) {
  const timestamp = request.headers.get('X-Ranking-Timestamp') || ''
  const signature = request.headers.get('X-Ranking-Signature') || ''
  if (typeof secret !== 'string' || secret.length < 32) return false
  if (!/^\d{13}$/.test(timestamp) || Math.abs(now - Number(timestamp)) > 60_000) return false
  if (!/^[a-f0-9]{64}$/.test(signature)) return false
  const bytes = Uint8Array.from(signature.match(/../g), (value) => parseInt(value, 16))
  return crypto.subtle.verify(
    'HMAC',
    await signingKey(secret, ['verify']),
    bytes,
    signedMessage(request.url, timestamp, body),
  )
}
