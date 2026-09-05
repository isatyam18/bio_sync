"use client"

import { Database, Brain, ScanLine } from "lucide-react"

export function Platform() {
  return (
    <section id="platform" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
      <div className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          One intelligent workspace
        </span>
        <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          From patient data to a clearer assessment.
        </h2>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
          BioSync keeps the workflow simple: capture the right information, run the appropriate
          model, and review the model output alongside relevant patient indicators.
        </p>
      </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {/* Structured records */}
        <article className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Database className="h-5.5 w-5.5" />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Structured patient records</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Keep assessment-ready patient information organised in one place for repeatable assessments.
          </p>
          <div className="mt-6 space-y-2.5">
            {[
              ["Patient profile", "Ready"],
              ["Assessment types", "2 conditions"],
              ["Assessment", "Pending"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </article>

        {/* AI risk assessment - highlighted card */}
        <article className="flex flex-col rounded-2xl border border-primary/20 bg-accent/60 p-7 shadow-sm ring-1 ring-primary/10">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Brain className="h-5.5 w-5.5" />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Model-based risk assessment</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Run disease-specific models through a clean, guided workflow with input validation.
          </p>
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Condition models</span>
              <span>Assessment-ready</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <span className="rounded-lg bg-muted px-3 py-2">Classical baselines</span>
              <span className="rounded-lg bg-muted px-3 py-2">Random Forest</span>
              <span className="rounded-lg bg-muted px-3 py-2">SVM / Logistic</span>
              <span className="rounded-lg bg-muted px-3 py-2">Hybrid QML</span>
            </div>
          </div>
        </article>

        {/* Explainability */}
        <article className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <ScanLine className="h-5.5 w-5.5" />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Relevant assessment context</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Keep the model output alongside the patient parameters that matter for professional review.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
            {["Blood pressure", "BMI", "Cholesterol", "Age"].map((label) => (
              <div key={label} className="rounded-lg bg-muted px-3 py-2.5 text-muted-foreground">{label}</div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
