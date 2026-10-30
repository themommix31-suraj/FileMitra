import SEO from '../components/SEO'

export default function Privacy() {
  return (
    <>
      <SEO path="/privacy" title="Privacy Policy" description="How FileSwift handles your files and data." />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated: June 2026</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-[15px] leading-relaxed text-ink-soft">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">How your files are processed</h2>
            <p className="mt-2">
              Wherever it is technically possible, FileSwift processes your files entirely inside your web
              browser using standard browser APIs (such as the Canvas API for images and JavaScript PDF
              libraries running locally). In these cases, your file is never transmitted to our servers or
              any third party, and it is discarded from memory when you close or refresh the page.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">When a tool requires server processing</h2>
            <p className="mt-2">
              Some tools may, now or in the future, require sending a file to a server because a browser
              cannot perform that operation on its own. Where this is the case, the relevant tool page will
              say so clearly, and we do not permanently store uploaded files — they are processed and then
              deleted.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Accounts and personal data</h2>
            <p className="mt-2">
              FileSwift does not require an account, login, or email address to use any tool. We do not
              collect personal information beyond standard, anonymized website analytics used to understand
              overall traffic.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Advertising</h2>
            <p className="mt-2">
              FileSwift may display ads (for example, via Google AdSense) to support free hosting of these
              tools. Advertising partners may use cookies to serve relevant ads; see our Cookie Policy for
              details.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Contact</h2>
            <p className="mt-2">Questions about this policy can be sent through our Contact page.</p>
          </section>
        </div>
      </div>
    </>
  )
}
