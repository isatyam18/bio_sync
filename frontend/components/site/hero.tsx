"use client"

import Image from "next/image"
import { ArrowRight, HeartPulse, ShieldCheck, Activity } from "lucide-react"

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* soft ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_0%,oklch(0.94_0.05_170)_0%,transparent_60%)]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        {/* Copy */}
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            Explainable model-based decision support
          </div>

          <h1 className="mt-6 text-pretty font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
            Turn patient data into clear, explainable risk insights.
          </h1>

          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            BioSync brings patient data, disease-specific machine learning, and easy-to-read
            explanations together in one calm, clinician-first workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#platform"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Explore the platform
            </a>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-8">
            {["Cardiovascular risk", "Diabetes risk", "Explainable results"].map((item) => (
              <li key={item} className="text-sm font-medium text-foreground/80">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-xl shadow-primary/10 ring-1 ring-black/5">
            <Image
              src="/images/biosync-hero.png"
              alt="BioSync health intelligence visualization showing cardiovascular and diabetes assessment models with clinical signal panels"
              width={1100}
              height={733}
              priority
              className="h-auto w-full rounded-2xl"
            />
          </div>

          {/* Floating card — top left */}
          <div className="absolute -left-3 top-8 flex items-center gap-3 rounded-xl border border-border bg-card/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:-left-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-medium text-muted-foreground">Assessment workspace</p>
              <p className="text-sm font-semibold text-foreground">Health signals</p>
            </div>
          </div>

          {/* Floating card — bottom right */}
          <div className="absolute -right-3 bottom-8 flex items-center gap-3 rounded-xl border border-border bg-card/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:-right-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-medium text-muted-foreground">Decision support</p>
              <p className="text-sm font-semibold text-foreground">Explainable by design</p>
            </div>
          </div>

          {/* Floating chip — mid right */}
          <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur lg:flex">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Model-based assessment</span>
          </div>
        </div>
      </div>
    </section>
  )
}
