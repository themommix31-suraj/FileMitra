import SEO from '../components/SEO'

export default function Cookies() {
  return (
    <>
      <SEO path="/cookies" title="Cookie Policy" description="How FileSwift uses cookies." />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-ink">Cookie Policy</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated: June 2026</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-[15px] leading-relaxed text-ink-soft">
          <p>
            FileSwift itself does not require cookies to process your files — all tool logic runs locally
            in your browser without a login or session. If we display advertising (for example, through
            Google AdSense) or use basic analytics, those third-party services may set cookies to measure
            traffic or serve relevant ads.
          </p>
          <p>You can control or clear cookies at any time through your browser settings.</p>
        </div>
      </div>
    </>
  )
}
