import { NextRequest } from 'next/server'

function isAllowed(method: string, path: string): boolean {
  const normalized = path.replace(/\/+/g, '/').toLowerCase()
  const allowGetPrefixes = ['/rest/workflows', '/rest/executions']
  const allowPatchPrefixes = ['/rest/workflows/']
  if (method === 'GET') return allowGetPrefixes.some(p => normalized.startsWith(p))
  if (method === 'PATCH') return allowPatchPrefixes.some(p => normalized.startsWith(p))
  return false
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | null | undefined>) {
  const u = new URL(baseUrl.replace(/\/$/, '') + path)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue
      u.searchParams.set(k, String(v))
    }
  }
  return u.toString()
}

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, apiKey, method, path, query, body } = await req.json()

    if (!baseUrl || !apiKey || !method || !path) {
      return new Response('Missing baseUrl, apiKey, method or path', { status: 400 })
    }

    const httpMethod = String(method).toUpperCase()
    if (!isAllowed(httpMethod, path)) {
      return new Response('Method/path not allowed', { status: 400 })
    }

    const url = buildUrl(String(baseUrl), String(path), query)

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': String(apiKey),
      'Authorization': `Bearer ${String(apiKey)}`,
    }

    const upstream = await fetch(url, {
      method: httpMethod,
      headers,
      body: httpMethod === 'GET' ? undefined : JSON.stringify(body ?? {}),
      // Avoid leaking cookies of our domain
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'follow',
    })

    const contentType = upstream.headers.get('content-type') || ''
    const status = upstream.status

    if (contentType.includes('application/json')) {
      const data = await upstream.json()
      // Normalize into {workflows} / {executions} for common GETs
      if (httpMethod === 'GET' && path.startsWith('/rest/workflows')) {
        const arr = Array.isArray(data) ? data : (data?.data ?? data?.workflows ?? [])
        return Response.json({ workflows: arr }, { status })
      }
      if (httpMethod === 'GET' && path.startsWith('/rest/executions')) {
        const arr = Array.isArray(data) ? data : (data?.data ?? data?.executions ?? [])
        return Response.json({ executions: arr }, { status })
      }
      return Response.json(data, { status })
    }

    // Fallback to text
    const text = await upstream.text()
    return new Response(text, { status, headers: { 'content-type': 'text/plain' } })
  } catch (err: any) {
    return new Response(err?.message || 'Proxy error', { status: 500 })
  }
}
