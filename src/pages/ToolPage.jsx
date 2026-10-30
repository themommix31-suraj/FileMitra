import { Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import SEO, { SITE_URL } from '../components/SEO'
import PromoBanner from '../components/PromoBanner'
import ToolGrid from '../components/ToolGrid'
import { getTool, tools, toolsByCategory } from '../data/tools'
import { getCategory } from '../data/categories'
import { toolRegistry } from '../tools/registry'
import NotFound from './NotFound'

const HOW_TO_STEPS = {
  'image-tools': [
    'Drag your image into the upload area, or click to choose a file.',
    'Adjust the settings — quality, size, or output format.',
    'Click the action button and download your result instantly.',
  ],
  'pdf-tools': [
    'Drag your PDF (or PDFs) into the upload area, or click to choose files.',
    'Adjust the order, page selection, or compression settings.',
    'Run the tool and download your finished PDF or images.',
  ],
  'other-tools': [
    'Paste or type your text, data, or values into the input area.',
    'Adjust any options — format, length, or style.',
    'Copy the result or download it, generated instantly in your browser.',
  ],
}

const FEATURES = [
  'Runs entirely in your browser — nothing is uploaded to a server',
  'No account, signup, or watermark required',
  'Works on desktop, tablet and mobile',
  'Free with no daily usage limit',
]

const FAQS = {
  'photo-signature-resizer': [
    { q: 'Can it reach a minimum file size, like 20–50 KB?', a: 'Yes. It first finds the best quality under your maximum, and if the file is still below your minimum it adds invisible padding data, so the picture is unchanged but the file reaches the minimum your portal checks.' },
    { q: 'Are the exam sizes in the presets official?', a: 'They are starting points taken from recent notices and widely reported specifications. Requirements change every year and websites often disagree, so always compare with your exam’s official notification — every value can be edited.' },
    { q: 'What does “name and date strip” do?', a: 'Some forms want your name and the date the photo was taken printed on a white bar at the bottom of the photo. Tick the option, type your name, and it is added for you.' },
    { q: 'Is my photo uploaded anywhere?', a: 'No. Resizing, compressing and the optional background change all happen in your browser, so your photo and signature never leave your device.' },
    { q: 'Why do some exams ask for a live photo?', a: 'Some recent notices (for example SSC) have the photo captured live inside the application form instead of uploaded. Check your notice — you may only need to upload a signature.' },
  ],
  'passport-photo-maker': [
    { q: 'What size is a passport photo?', a: 'Common sizes are 35×45 mm (India, UK, EU/Schengen, Australia and many others), 2×2 in / 51×51 mm (US), 50×70 mm (Canada) and 33×48 mm (China visa). Always check the current rules for your country.' },
    { q: 'How do I print it?', a: 'Download the sheet as JPG or PDF and print it at 100% (“actual size”, no fit-to-page scaling) on photo paper. A 4×6 in sheet holds 8 photos of 35×45 mm. Cutting guides are included.' },
    { q: 'Will the white background be accepted?', a: 'The AI cut-out works well on most portraits but can struggle with hair edges and busy backgrounds. Check the result at full size, and take the photo against a plain, evenly lit wall for best results.' },
    { q: 'Is my photo uploaded?', a: 'No. The photo and the AI model run on your device, so your picture never leaves your browser.' },
  ],
  'background-remover': [
    { q: 'Is there a size limit or a watermark?', a: 'No watermark, no signup and no daily limit. The result is downloaded at your photo’s full resolution (up to 4096 px on the longest side).' },
    { q: 'What is the difference between Best quality and Fast?', a: 'Best quality is a larger AI model (about 44 MB) that handles arms, hair and bags more cleanly. Fast is a small model (about 4.5 MB) that is quicker to download and fine for simple photos and products. The model downloads once and is remembered by your browser.' },
    { q: 'Is my photo uploaded?', a: 'No. The AI runs inside your browser, so the photo never leaves your device.' },
    { q: 'Can I get a white or coloured background instead of transparent?', a: 'Yes. After removing the background, choose white, light blue, light grey or any colour, and download it as a JPG; choose Transparent to keep a PNG.' },
  ],
  'compress-pdf': [
    { q: 'Will my text still be selectable after compressing?', a: 'Yes, by default. FileSwift compresses only the photos and scans inside the PDF and leaves text and vector graphics alone. Only if a target size can’t be reached that way (or if you choose Maximum compression) are pages converted to images, and you are told when that happens.' },
    { q: 'Why can’t some PDFs get much smaller?', a: 'A PDF that is mostly text is already small, and PDFs whose images are stored in other formats can’t be recompressed without flattening. Try the target-size option or Maximum compression for those.' },
    { q: 'Is there a daily limit or a watermark?', a: 'No. There are no limits, no watermarks and no signup, and your file never leaves your device.' },
    { q: 'Which size limits do forms usually ask for?', a: 'Government and exam portals commonly ask for PDFs under 100 KB, 200 KB, 300 KB or 500 KB. Choose the matching target or type your own — and always check the size and format rules on the official notice.' },
  ],
  'compress-image-to-size': [
    { q: 'How does it reach an exact size?', a: 'FileSwift searches for the highest JPG/WebP quality whose file size still fits under your target. If even the lowest quality is too big, it also reduces the image dimensions a little until it fits.' },
    { q: 'Why is my result a bit smaller than the target?', a: 'The goal is the largest file that is still under your limit, so the result is usually just below it (for example 48 KB for a 50 KB target). Sizes are measured with 1 KB = 1,024 bytes, the way most upload portals count.' },
    { q: 'Can I compress to a minimum size as well, like 20–50 KB?', a: 'This tool sets an upper limit. If a portal also needs a minimum, compress to the upper limit and check the result — most photos land close to the target.' },
    { q: 'Is my photo uploaded anywhere?', a: 'No. Everything happens in your browser, so your photo, signature or ID never leaves your device.' },
  ],
  'heic-to-jpg': [
    { q: 'What is a HEIC file?', a: 'HEIC (or HEIF) is the photo format iPhones use by default. It saves space, but many Windows PCs, older apps and websites can’t open it — JPG works everywhere.' },
    { q: 'Do my photos get uploaded?', a: 'No. The conversion runs in your browser using WebAssembly, so your photos stay on your device.' },
    { q: 'Why does the first conversion take longer?', a: 'The HEIC decoder is a few MB and is downloaded the first time you convert. After that it is cached and conversion is quick.' },
    { q: 'Does it keep Live Photos and EXIF data?', a: 'Only the main still image is converted. Location and camera metadata are not carried over to the output file.' },
  ],
  'image-to-text': [
    { q: 'How accurate is the text extraction?', a: 'Clear, high-resolution images of printed text work best. Handwriting, blur, low contrast and angled photos reduce accuracy, so review and edit the result before using it.' },
    { q: 'Which languages are supported?', a: 'English, Hindi (and English + Hindi together), Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Urdu, Spanish, French, German, Portuguese, Arabic and Simplified Chinese.' },
    { q: 'Is my image uploaded?', a: 'No — the text is read in your browser. Only the small language data file is downloaded the first time you use a language.' },
  ],
  'svg-to-png': [
    { q: 'Why convert SVG to PNG?', a: 'SVGs are scalable vectors, but many sites, apps and email tools only accept raster images like PNG or JPG.' },
    { q: 'How do I get a sharper PNG?', a: 'Choose a larger size — 3×, 4× or a custom width. Because SVG is vector, it stays crisp at any size.' },
    { q: 'Will the PNG have a transparent background?', a: 'Yes, by default. You can also fill it with white or any colour. JPG doesn’t support transparency, so it always gets a background.' },
  ],
  'favicon-generator': [
    { q: 'What files do I get?', a: 'favicon.ico (16, 32 and 48 px), 16×16 and 32×32 PNGs, an Apple touch icon (180 px), Android icons (192 and 512 px) and a site.webmanifest — plus the HTML to paste into your head tag.' },
    { q: 'What image should I upload?', a: 'A square logo of at least 512×512 px works best. SVG is ideal. Non-square images can be fitted with padding or cropped to the centre.' },
    { q: 'Where do I put the files?', a: 'Upload them to the root folder of your website, then add the shown link tags inside the head of your pages.' },
  ],
  'reorder-pdf-pages': [
    { q: 'Can I also rotate or delete pages?', a: 'Yes — each page has buttons to rotate it 90° or remove it, in addition to dragging it to a new position.' },
    { q: 'Does it work on a phone?', a: 'Yes. Dragging works on many devices, and the arrow buttons under each page let you move pages without dragging.' },
    { q: 'Will the quality of my PDF change?', a: 'No. Pages are copied as they are into a new PDF, so text stays selectable and images keep their quality. Password-protected PDFs need to be unlocked first.' },
  ],
  'percentage-calculator': [
    { q: 'How do I calculate X% of a number?', a: 'Multiply the number by X and divide by 100. For example, 15% of 200 is 200 × 15 ÷ 100 = 30.' },
    { q: 'How is percentage change calculated?', a: '(New value − Old value) ÷ Old value × 100. A positive result is an increase, a negative result is a decrease.' },
  ],
  'age-calculator': [
    { q: 'How is the exact age calculated?', a: 'Years, months and days are counted from the date of birth to the chosen date, using the real length of each month.' },
    { q: 'What if I was born on 29 February?', a: 'In non-leap years the birthday is counted on 1 March.' },
  ],
  'gst-calculator': [
    { q: 'What are the current GST rates in India?', a: 'Since GST 2.0 came into effect on 22 September 2025, the main slabs are 5% and 18%, with a 40% rate for luxury and sin goods, plus 0% for exempt items and a special 3% rate for gold and silver. Always check the rate for your HSN/SAC code.' },
    { q: 'How do I remove GST from a GST-inclusive price?', a: 'Choose “Remove GST”, enter the total and the rate. The tool divides by (1 + rate ÷ 100) to give the base price and the GST amount.' },
    { q: 'When is CGST + SGST used instead of IGST?', a: 'For sales within the same state GST is split equally into CGST and SGST. For sales to another state, the full amount is charged as IGST.' },
  ],
  'emi-calculator': [
    { q: 'How is EMI calculated?', a: 'EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r is the monthly interest rate (annual rate ÷ 12 ÷ 100) and n is the number of monthly instalments.' },
    { q: 'Will this match my bank’s figure exactly?', a: 'It should be very close for a standard reducing-balance loan. Processing fees, insurance and rate changes on floating-rate loans can make the bank’s numbers differ slightly.' },
  ],
  'case-converter': [
    { q: 'What is the difference between Title Case and Sentence case?', a: 'Title Case capitalises the first letter of every word, while Sentence case only capitalises the first letter of each sentence.' },
    { q: 'Can it convert camelCase or snake_case text?', a: 'Yes — it understands existing camelCase, snake_case and kebab-case, so you can convert between them directly.' },
  ],
  'remove-duplicate-lines': [
    { q: 'Which copy of a duplicate line is kept?', a: 'The first occurrence is kept and later repeats are removed, so your original order is preserved (unless you choose to sort).' },
    { q: 'Can it ignore differences in capitals or spaces?', a: 'Yes — untick “Case sensitive” to treat Apple and apple as the same, and tick “Trim spaces” to ignore spaces at the start and end of lines.' },
  ],
  'image-converter': [
    { q: 'Which formats can I convert from and to?', a: 'You can upload JPG, PNG, WebP, GIF, BMP and AVIF images and convert them to JPG, PNG, WebP or BMP.' },
    { q: 'Can I convert many images at once?', a: 'Yes — add as many files as you like, choose one output format, and convert them all in one click. Multiple results download as a single ZIP.' },
    { q: 'What happens to transparency?', a: 'PNG and WebP keep transparency. JPG and BMP do not support it, so transparent areas are filled with white.' },
    { q: 'What about animated GIFs?', a: 'Only the first frame is converted, since JPG, PNG, WebP and BMP outputs here are single still images.' },
  ],
  'compress-image': [
    { q: 'Will compressing reduce image quality?', a: 'Some quality loss is expected with JPG and WebP at lower settings, but you control the trade-off with the quality slider. PNG compression is lossless.' },
    { q: 'Is there a file size limit?', a: 'Files up to 50MB are supported, which covers the vast majority of photos and screenshots.' },
    { q: 'Are my images uploaded anywhere?', a: 'No. Compression happens directly in your browser using the Canvas API — your image never leaves your device.' },
  ],
  'resize-image': [
    { q: 'Can I resize without distorting the image?', a: 'Yes — turn on "Maintain aspect ratio" and the tool will calculate the matching height or width automatically.' },
    { q: 'What happens if I enlarge a small image?', a: 'You can scale up, but very small source images will look softer when enlarged since no extra detail is created.' },
  ],
  'images-to-pdf': [
    { q: 'Can I reorder images before creating the PDF?', a: 'Yes — drag any image up or down in the list to change its page order.' },
    { q: 'What page sizes are supported?', a: 'A4, US Letter, or "Fit to image" which sizes each page to match its image exactly.' },
  ],
  'pdf-to-jpg': [
    { q: 'Can I convert only some pages?', a: 'Yes — click any page thumbnail to select or deselect it before converting.' },
    { q: 'How do I download multiple pages at once?', a: 'When more than one page is converted, FileSwift automatically packages them into a ZIP file.' },
  ],
  'merge-pdf': [
    { q: 'How many PDFs can I merge?', a: 'There is no hard limit — add as many as you need, then drag to set the order.' },
    { q: 'Will bookmarks or forms be preserved?', a: 'Page content is preserved; interactive forms and some bookmarks may not carry over depending on the source PDF.' },
  ],
  'compress-pdf': [
    { q: 'Will the text still be selectable after compressing?', a: 'No — this tool re-renders each page as an optimized image to achieve real size savings, so text becomes part of the image. It works best for scanned documents.' },
    { q: 'What compression level should I pick?', a: '"Medium" is a good default. Use "Low" if visual quality matters most, or "High" when file size is the priority.' },
  ],
  'repair-pdf': [
    { q: 'What kinds of PDF problems can this fix?', a: 'It rebuilds broken cross-reference tables, corrupted trailers, and similar structural issues by re-parsing the file leniently and writing a fresh, valid PDF from the pages it can recover.' },
    { q: 'Can it recover missing content?', a: 'No — it can only reconstruct valid structure around data that\u2019s still present in the file. Severely damaged or truncated files may not be recoverable.' },
  ],
  'sign-pdf': [
    { q: 'Is this a legally binding digital signature?', a: 'No — this places a visual signature image on the page, similar to signing a printed document. It doesn\u2019t use cryptographic certificates, so it isn\u2019t equivalent to a qualified electronic signature.' },
    { q: 'Can I sign more than one page?', a: 'Currently you can place one signature per pass — run the tool again on the result to add another signature to a different page.' },
  ],
  'redact-pdf': [
    { q: 'Is redacted content really removed, or just covered up?', a: 'Really removed. Each page is rasterized into an image before the black boxes are drawn, so there\u2019s no hidden text or layer left underneath — unlike tools that just draw a shape over live content.' },
    { q: 'Will the PDF still be searchable after redacting?', a: 'No — because pages become images, text is no longer selectable or searchable anywhere in the file, not just in the redacted areas.' },
  ],
}

export default function ToolPage() {
  const { toolSlug } = useParams()
  const tool = getTool(toolSlug)

  if (!tool) return <NotFound />

  const registryEntry = toolRegistry[tool.slug]
  const categoryMeta = getCategory(tool.category)
  const relatedTools = toolsByCategory(tool.category).filter((t) => t.slug !== tool.slug && t.implemented).slice(0, 3)
  const faqs = FAQS[tool.slug] || FAQS[tool.faqFrom] || []
  const howTo = tool.howTo || HOW_TO_STEPS[tool.category] || HOW_TO_STEPS['image-tools']
  const seo = tool.seo || {
    title: `${tool.name} — Free Online Tool`,
    description: tool.shortDescription,
    h1: tool.name,
    intro: tool.shortDescription,
  }

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (browser-based)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      url: `${SITE_URL}/tools/${tool.slug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: categoryMeta?.name, item: `${SITE_URL}/category/${tool.category}` },
        { '@type': 'ListItem', position: 3, name: tool.name, item: `${SITE_URL}/tools/${tool.slug}` },
      ],
    },
    ...(faqs.length
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
        ]
      : []),
  ]

  return (
    <>
      <SEO path={`/tools/${tool.slug}`} title={seo.title} description={seo.description} jsonLd={jsonLd} />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-4 flex items-center gap-1 text-xs text-ink-soft" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/category/${tool.category}`} className="hover:text-ink">{categoryMeta?.name}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink">{tool.name}</span>
        </nav>

        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{seo.h1 || tool.name}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">{seo.intro}</p>

        <div className="mt-8">
          {registryEntry ? (
            <Suspense fallback={<div className="rounded-2xl border border-line bg-mist p-10 text-center text-sm text-ink-soft">Loading tool…</div>}>
              <registryEntry.Component {...(registryEntry.props || {})} />
            </Suspense>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-mist p-10 text-center">
              <p className="font-display text-lg font-semibold text-ink">This tool is coming soon</p>
              <p className="mt-2 text-sm text-ink-soft">
                We're still building {tool.name}. In the meantime, explore the tools that are ready today.
              </p>
              <Link to="/tools" className="mt-4 inline-block text-sm font-semibold" style={{ color: 'var(--color-brand-600)' }}>
                Browse all tools →
              </Link>
            </div>
          )}
        </div>

        <div className="mt-10">
          <PromoBanner />
        </div>

        {registryEntry && (
          <>
            <section className="mt-14">
              <h2 className="font-display text-xl font-bold text-ink">How to use {tool.name}</h2>
              <ol className="mt-4 space-y-3">
                {howTo.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-ink-soft">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: 'var(--color-brand-500)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-xl font-bold text-ink">Why use FileSwift</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <li key={f} className="rounded-xl border border-line bg-white p-3 text-sm text-ink-soft">{f}</li>
                ))}
              </ul>
            </section>

            {faqs.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-xl font-bold text-ink">Frequently asked questions</h2>
                <div className="mt-4 space-y-3">
                  {faqs.map((f) => (
                    <details key={f.q} className="group rounded-xl border border-line bg-white p-4">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-ink">{f.q}</summary>
                      <p className="mt-2 text-sm text-ink-soft">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {relatedTools.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-ink">Related tools</h2>
            <div className="mt-4">
              <ToolGrid tools={relatedTools} />
            </div>
          </section>
        )}
      </div>
    </>
  )
}
