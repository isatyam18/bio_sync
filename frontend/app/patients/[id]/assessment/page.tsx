"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Shell } from "@/components/workspace-shell"
import { Atom, CheckCircle2, Stethoscope } from "lucide-react"

const labels: Record<string, string> = { cardiovascular: "Cardiovascular", diabetes: "Diabetes" }

export default function AssessmentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [role, setRole] = useState<string>()
  const [condition, setCondition] = useState<string>("cardiovascular")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>()
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      api<any>("/auth/me"),
      api<any>(`/patients/${id}`),
    ]).then(([me, patient]) => {
      setRole(me.user?.role)
      setCondition(patient.patient?.condition || "cardiovascular")
    }).catch((e) => {
      setError(e instanceof Error ? e.message : "Could not load the assessment")
      if (String(e?.message || "").includes("Authentication")) router.push("/login")
    })
  }, [id, router])

  async function run() {
    setLoading(true)
    setError("")
    try {
      const x = await api<any>(`/patients/${id}/predict`, { method: "POST", body: JSON.stringify({}) })
      setResult(x)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assessment failed")
    } finally {
      setLoading(false)
    }
  }

  const doctor = role === "doctor"
  const label = labels[condition] || "Health"

  return (
    <main className="min-h-screen bg-background">
      <Shell />
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link href={`/patients/${id}`} className="text-sm text-muted-foreground">← Patient profile</Link>
        <p className="mt-6 text-sm font-semibold text-primary">{label} assessment</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Run an assessment</h1>
        <p className="mt-2 text-muted-foreground">
          {doctor
            ? `Run the available ${label.toLowerCase()} models for this registered patient.`
            : `Process your submitted ${label.toLowerCase()} health information.`}
        </p>

        <section className="mt-8 rounded-2xl border bg-card p-7 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Stethoscope className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Model-based assessment</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            BioSync will send the saved patient record through the condition-specific model set and store the resulting assessment history.
            Model output is decision support, not a diagnosis.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-background/60 p-4">
              <p className="text-xs text-muted-foreground">Condition</p>
              <p className="mt-1 font-semibold">{label}</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <p className="text-xs text-muted-foreground">Quantum component</p>
              <p className="mt-1 inline-flex items-center gap-1.5 font-semibold"><Atom className="h-4 w-4 text-primary" /> Included</p>
            </div>
          </div>

          <button
            onClick={run}
            disabled={loading || !role}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Running models…" : "Run assessment"}
          </button>

          {error && <p className="mt-4 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}

          {result && (
            <div className="mt-7 rounded-2xl border bg-background/60 p-6">
              {doctor ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Assessment completed
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {result.results?.length || result.modelsRun || 0} model result(s) were saved. Open the patient profile to review the detailed comparison, evidence and report.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-primary">Assessment completed</p>
                  <p className="mt-3 text-2xl font-semibold">
                    {result.riskLevel === "high" ? "Higher model-derived risk band" : result.riskLevel === "moderate" ? "Moderate model-derived risk band" : result.riskLevel === "low" ? "Lower model-derived risk band" : "Assessment processed"}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.patientMessage}</p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-semibold">
                    <Stethoscope className="h-4 w-4" /> Recommended next step: discuss the result with a healthcare professional
                  </div>
                </>
              )}
              <button onClick={() => { router.push(`/patients/${id}?updated=${Date.now()}`); router.refresh() }} className="mt-5 text-sm font-semibold text-primary">Back to patient →</button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
