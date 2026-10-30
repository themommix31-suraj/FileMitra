import SEO from '../components/SEO'
import { Mail, Phone } from 'lucide-react'

export default function Contact() {
  return (
    <>
      <SEO path="/contact" title="Contact FileSwift" description="Get in touch with the FileSwift team." />
      <div className="mx-auto max-w-xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'color-mix(in srgb, var(--color-brand-500) 12%, white)' }}
        >
          <Mail className="h-7 w-7" style={{ color: 'var(--color-brand-500)' }} />
        </div>
        <h1 className="font-display text-3xl font-bold text-ink">Get in touch</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Found a bug, have a tool request, or want to talk about advertising? Send us a note and we'll get
          back to you.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <a
            href="mailto:surajmanral2002@gmail.com"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm"
            style={{ background: 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-500))' }}
          >
            <Mail className="h-4 w-4" /> surajmanral2002@gmail.com
          </a>
          <a
            href="tel:+918285007827"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-mist"
          >
            <Phone className="h-4 w-4" /> +91 82850 07827
          </a>
        </div>
      </div>
    </>
  )
}
