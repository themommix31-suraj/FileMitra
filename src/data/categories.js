export const categories = [
  {
    slug: 'image-tools',
    name: 'Image Tools',
    description: 'Compress, resize and convert images without leaving your browser.',
    color: 'brand',
  },
  {
    slug: 'pdf-tools',
    name: 'PDF Tools',
    description: 'Merge, compress and convert PDFs in a few clicks.',
    color: 'sky',
  },
  {
    slug: 'other-tools',
    name: 'Other Tools',
    description: 'Everyday utilities for text, data and codes.',
    color: 'mint',
  },
]

export const getCategory = (slug) => categories.find((c) => c.slug === slug)
