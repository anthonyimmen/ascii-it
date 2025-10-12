import { NextResponse } from 'next/server'

// Proxy to backend API; returns only { profileUrl, bannerUrl }
export async function GET(
  _request: Request,
  context: { params: Record<string, string | string[]> }
) {
  try {
    const p = context?.params?.username as string | string[] | undefined
    const username = Array.isArray(p) ? p[0] : p
    if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 })

    const backendBase = process.env.BACKEND_BASE_URL || 'http://localhost:3000'
    const resp = await fetch(`${backendBase}/api/twitter/${encodeURIComponent(username)}`)
    const data = await resp.json().catch(() => null)
    if (!resp.ok) {
      return NextResponse.json({ error: 'twitter_fetch_failed', status: resp.status, details: data }, { status: 502 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying Twitter profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
