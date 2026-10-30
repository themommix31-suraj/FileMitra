import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://filesw.app' // TODO: replace with your purchased domain
const SITE_NAME = 'FileSwift'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

export default function SEO({ title, description, path = '/', jsonLd, ogImage }) {
  const url = `${SITE_URL}${path}`
  const fullTitle = title?.includes('FileSwift') ? title : `${title} | ${SITE_NAME}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage || DEFAULT_OG_IMAGE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage || DEFAULT_OG_IMAGE} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}

export { SITE_URL, SITE_NAME }
