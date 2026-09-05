"use client"

import { Lock, ShieldCheck, LineChart, Layers } from "lucide-react"

const points = [
  {
    icon: Lock,
    title: "Privacy-minded design",
    desc: "Patient records are scoped to each account, so data stays separated between users.",
  },
  {
    icon: ShieldCheck,
    title: "Decision support, not diagnosis",
    desc: "Every output is framed as healthcare-focused support with clear limitations.",
  },
  {
    icon: LineChart,
    title: "Assessment history",
    desc: "Each assessment stores its inputs and relevant indicators for review.",
  },
  {
    icon: Layers,
    title: "Model isolation",
    desc: "Disease models stay independent so inputs are never mismatched.",
  },
]

export function Trust() {
  return (
    <section id="trust" className="border-y border-border bg-secondary/50">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Built to be trusted
          </span>
          <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Careful, transparent handling from data to decision.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <p.icon className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-5 font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
