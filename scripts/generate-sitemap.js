// Generates public/sitemap.xml from the tool and blog registries so it's
// always in sync with the live routes. Runs automatically before `npm run build`.
import { writeFileSync } from 'node:fs'
import { tools } from '../src/data/tools.js'
import { categories } from '../src/data/categories.js'
import { blogPosts } from '../src/data/blogPosts.js'

const SITE_URL = 'https://filesw.app' // TODO: update once your domain is live

const staticRoutes = ['/', '/tools', '/blog', '/about', '/contact', '/privacy', '/terms', '/cookies']
const categoryRoutes = categories.map((c) => `/category/${c.slug}`)
const toolRoutes = tools.filter((t) => t.implemented).map((t) => `/tools/${t.slug}`)
const blogRoutes = blogPosts.map((p) => `/blog/${p.slug}`)

const allRoutes = [...staticRoutes, ...categoryRoutes, ...toolRoutes, ...blogRoutes]

const urlset = allRoutes
  .map((route) => {
    const priority = route === '/' ? '1.0' : route.startsWith('/tools/') ? '0.9' : '0.6'
    return `  <url>\n    <loc>${SITE_URL}${route}</loc>\n    <priority>${priority}</priority>\n  </url>`
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml)
console.log(`sitemap.xml written with ${allRoutes.length} URLs`)
