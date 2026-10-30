import SEO from '../components/SEO'
import { Zap, ShieldCheck, Gauge } from 'lucide-react'

export default function About() {
  return (
    <>
      <SEO path="/about" title="About FileSwift" description="FileSwift is a free, browser-based toolkit for images and PDFs. Learn what we do and why." />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">About FileSwift</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          FileSwift is a free toolkit for everyday file tasks — compressing photos, converting formats,
          and putting together PDFs — built to run directly in your browser instead of on a server.
        </p>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          We built it because most "free" file tools online come with slow uploads, watermarks, account
          walls, or vague promises about what happens to your files. FileSwift processes what it can on
          your own device using open web standards, so there's nothing to upload and nothing to wait on.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Zap, title: 'Fast', text: 'No upload queue — processing starts instantly.' },
            { icon: ShieldCheck, title: 'Private', text: 'Files stay on your device wherever technically possible.' },
            { icon: Gauge, title: 'No friction', text: 'No account, no watermark, no artificial limits.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-white p-5">
              <f.icon className="h-5 w-5" style={{ color: 'var(--color-brand-500)' }} />
              <h2 className="mt-3 font-display text-sm font-semibold text-ink">{f.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">{f.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-ink-soft">
          FileSwift is an independent project and is not affiliated with Adobe, Smallpdf, iLovePDF or any
          other document tool provider.
        </p>
      </div>
    </>
  )
}
