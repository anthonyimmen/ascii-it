import { NextResponse } from 'next/server'

const getHighResProfileImageUrl = (url: string | null | undefined) => {
  if (!url) return null
  try {
    let out = url
    out = out.replace(/_normal(\.[a-zA-Z]+)(\?.*)?$/, '_400x400$1$2')
    out = out.replace(/_mini(\.[a-zA-Z]+)(\?.*)?$/, '_400x400$1$2')
    out = out.replace(/_bigger(\.[a-zA-Z]+)(\?.*)?$/, '_400x400$1$2')
    out = out.replace(/([?&])name=(normal|bigger|mini)(&|$)/, '$1name=400x400$3')
    return out
  } catch {
    return url
  }
}

const getHighResBannerUrl = (url: string | null | undefined) => {
  if (!url) return null
  try {
    if (/\/\d+x\d+(\?|$)/.test(url)) {
      return url.replace(/\/\d+x\d+(\?|$)/, '/1500x500$1')
    }
    if (/\.(jpg|png)(\?.*)?$/.test(url)) {
      const [base, query = ''] = url.split('?')
      return `${base}/1500x500${query ? `?${query}` : ''}`
    }
    return url.endsWith('/') ? `${url}1500x500` : `${url}/1500x500`
  } catch {
    return url
  }
}

export const runtime = 'nodejs'

type RouteParams = { params: Record<string, string | string[]> }

export async function GET(_request: Request, context: RouteParams) {
  try {
    const p = context?.params?.username
    const username = Array.isArray(p) ? p[0] : p
    if (!username) {
      return NextResponse.json({ error: 'missing_twitter_username' }, { status: 400 })
    }

    const apiKey = process.env.SOCIAL_DATA_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'twitter_api_key_not_configured' }, { status: 500 })
    }

    const resp = await fetch(`https://api.socialdata.tools/twitter/user/${encodeURIComponent(username)}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return NextResponse.json(
        { error: 'twitter_fetch_failed', status: resp.status, body: text },
        { status: 502 }
      )
    }

    const data = await resp.json().catch(() => ({}))
    const profileRaw = data?.profile_image_url_https || data?.profile_image_url || null
    const bannerRaw = data?.profile_banner_url || null
    const profileUrl = getHighResProfileImageUrl(profileRaw)
    const bannerUrl = getHighResBannerUrl(bannerRaw)

    const response = NextResponse.json({ profileUrl, bannerUrl })
    response.headers.set('Cache-Control', 'public, max-age=300')
    return response
  } catch (error) {
    console.error('twitter profile fetch error:', error)
    return NextResponse.json({ error: 'twitter_profile_error' }, { status: 500 })
  }
}
