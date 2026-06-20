export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  }
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
      ...extraHeaders,
    },
  })
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}

export function getGachaKv(env = {}) {
  const kv =
    env.gacha_data ||
    globalThis.gacha_data ||
    // eslint-disable-next-line no-undef
    (typeof gacha_data !== 'undefined' ? gacha_data : null)
  if (!kv) {
    const error = new Error('EdgeOne KV 变量 gacha_data 未绑定。')
    error.status = 503
    throw error
  }
  return kv
}
