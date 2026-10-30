import SEO from '../components/SEO'

export default function Terms() {
  return (
    <>
      <SEO path="/terms" title="Terms of Service" description="Terms of service for using FileSwift's free tools." />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-ink">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated: June 2026</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-[15px] leading-relaxed text-ink-soft">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Using FileSwift</h2>
            <p className="mt-2">
              FileSwift provides free file, image and PDF utilities "as is." You may use these tools for
              personal or commercial purposes at no cost, without creating an account.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">No warranty</h2>
            <p className="mt-2">
              While we aim for reliable results, FileSwift is provided without warranties of any kind. You
              are responsible for keeping your own backups of any files you process, and for verifying
              output files before relying on them for important purposes.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Acceptable use</h2>
            <p className="mt-2">
              Don't use FileSwift to process content you don't have the legal right to handle, or to attempt
              to disrupt or reverse-engineer the service.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Changes</h2>
            <p className="mt-2">We may update these terms as the site evolves. Continued use means you accept the current version.</p>
          </section>
        </div>
      </div>
    </>
  )
}
