const items = ["Patient data", "Machine learning", "Explainability", "Clinical clarity", "Data security"]

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-8 sm:px-8 md:flex-row md:justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Designed around
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {items.map((item) => (
            <span key={item} className="text-sm font-semibold text-foreground/80">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
