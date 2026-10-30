// Static blog content. No CMS or database — add a new post by adding an
// object here with a unique slug.
export const blogPosts = [
  {
    slug: 'compress-image-without-losing-quality',
    title: 'How to Compress an Image Without Losing Quality',
    excerpt: 'The difference between lossy and lossless compression, and how to pick a quality setting that keeps photos looking sharp.',
    date: '2026-06-02',
    relatedTool: 'compress-image',
    body: [
      'Image compression works by removing data that the human eye barely notices. JPG and WebP use "lossy" compression, which throws away fine detail to shrink the file. PNG uses "lossless" compression, which keeps every pixel but compresses less overall.',
      'For photos, a quality setting between 65% and 80% is usually the sweet spot — small enough for fast page loads, close enough to the original that nobody notices the difference at normal viewing sizes.',
      'If your image has flat colors, text, or transparency (like a logo or screenshot), stick with PNG or a high-quality WebP instead of JPG, since JPG artifacts show up clearly around sharp edges.',
      'A simple way to check your work: compress at a few different quality levels and compare file size against how the image looks at 100% zoom. Once you can\'t tell the difference from the original, you\'ve found your setting.',
    ],
  },
  {
    slug: 'jpg-vs-png-vs-webp',
    title: 'JPG vs PNG vs WebP: Which Image Format Is Best?',
    excerpt: 'A practical breakdown of when to use each image format for photos, graphics and the web.',
    date: '2026-06-05',
    relatedTool: 'jpg-to-webp',
    body: [
      'JPG is the default for photographs. It compresses well and is supported everywhere, but it doesn\'t support transparency and loses quality every time it\'s re-saved.',
      'PNG is best for images that need transparency or sharp edges — logos, icons, screenshots, illustrations with text. It\'s lossless, so files are larger, but nothing is ever degraded.',
      'WebP is a newer format that typically produces smaller files than JPG at similar quality, and it supports transparency like PNG. Browser support is now near-universal, which makes it a strong default for websites.',
      'Rule of thumb: use WebP for web images where you control the format, JPG when you need broad compatibility with old software, and PNG whenever transparency or pixel-perfect accuracy matters.',
    ],
  },
  {
    slug: 'reduce-image-size-to-100kb',
    title: 'How to Reduce Image Size to 100KB',
    excerpt: 'A step-by-step approach for hitting a specific file size target, useful for forms and upload limits.',
    date: '2026-06-09',
    relatedTool: 'compress-image',
    body: [
      'Many upload forms cap file size at 100KB or similar. The fastest way to hit that target is to combine two levers: image dimensions and compression quality.',
      'Start by resizing the image down to the dimensions it will actually be displayed at — there\'s no reason to upload a 4000px-wide photo for a 400px avatar.',
      'Then compress the resized image and check the output size. If it\'s still too big, lower the quality slider in 5-10% steps until you land under your target.',
      'Converting to WebP before compressing can also help, since it tends to produce smaller files than JPG at the same visual quality — often the easiest way to squeeze under a tight size limit.',
    ],
  },
  {
    slug: 'convert-jpg-to-webp',
    title: 'How to Convert JPG to WebP',
    excerpt: 'Why WebP is worth switching to, and how to convert your JPG images in seconds.',
    date: '2026-06-12',
    relatedTool: 'jpg-to-webp',
    body: [
      'WebP images are, on average, noticeably smaller than JPGs at the same visual quality — which means faster page loads if you\'re publishing to the web.',
      'To convert, open the JPG to WebP tool, drop in your image, and download the result. The conversion happens in your browser, so nothing is uploaded anywhere.',
      'If you\'re converting images for a website, batch-convert your image library once and keep both formats: WebP as the primary source, with a JPG fallback for very old browsers if you need maximum compatibility.',
    ],
  },
  {
    slug: 'merge-pdf-files-online',
    title: 'How to Merge PDF Files Online',
    excerpt: 'Combine multiple PDFs into a single document without installing any software.',
    date: '2026-06-16',
    relatedTool: 'merge-pdf',
    body: [
      'Merging PDFs is one of the most common document tasks — combining scanned pages, joining chapters, or putting together a single report from several sources.',
      'With a browser-based merge tool, you upload your files, drag them into the order you want, and download a single combined PDF — no installation, and no need to email files back and forth.',
      'Because the merge happens locally, it\'s also a good option for documents you\'d rather not upload to a third-party server, like contracts or personal paperwork.',
    ],
  },
  {
    slug: 'convert-images-to-pdf',
    title: 'How to Convert Images to PDF',
    excerpt: 'Turn a folder of photos or scans into a single, easy-to-share PDF.',
    date: '2026-06-19',
    relatedTool: 'images-to-pdf',
    body: [
      'Converting images to PDF is the easiest way to package multiple photos — like scanned documents or receipts — into one shareable file instead of sending several separate images.',
      'Upload your images in the order you want them to appear, choose a page size (A4 and Letter are the most common), and generate the PDF.',
      'If your images are already close to the size you want printed, the "fit to image" page option keeps each page sized exactly to its photo instead of adding extra white space.',
    ],
  },
]

export const getPost = (slug) => blogPosts.find((p) => p.slug === slug)
