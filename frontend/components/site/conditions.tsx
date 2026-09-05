"use client"

import { HeartPulse, Activity, ArrowRight } from "lucide-react"

const conditions = [
  {
    icon: HeartPulse,
    module: "Assessment module 01",
    title: "Cardiovascular risk",
    description:
      "Structured clinical inputs and trained machine-learning models for cardiovascular risk assessment, from resting vitals to structured health features.",
    tags: ["Classical ML", "12 clinical inputs"],
  },
  {
    icon: Activity,
    module: "Assessment module 02",
    title: "Diabetes risk",
    description:
      "Combines structured metabolic inputs with classical baselines and a supplied hybrid quantum-classical model for diabetes risk assessment.",
    tags: ["Classical ML", "Hybrid QML"],
  },
]

export function Conditions() {
  return (
    <section id="conditions" className="border-y border-border bg-secondary/50">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Focused assessments
          </span>
          <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Built around the conditions that matter to your workflow.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {conditions.map((c) => (
            <article
              key={c.title}
              className="group flex flex-col rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <c.icon className="h-6 w-6" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.module}
                </span>
              </div>
              <h3 className="mt-6 font-serif text-2xl font-semibold text-foreground">{c.title}</h3>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                {c.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {c.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href="#cta"
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Explore module
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
