"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Shell } from "@/components/workspace-shell"
import {
  Download,
  TrendingUp,
  CalendarDays,
  Activity,
  ShieldCheck,
  Stethoscope,
  Atom,
  Edit3,
  CheckCircle2,
  X,
  History,
} from "lucide-react"

type Prediction = {
  _id: string
  assessmentId: string
  condition: string
  model: string
  prediction: number
  probability?: number
  decisionScore?: number
  assessmentProbability?: number
  riskLevel?: string
  createdAt: string
  riskFactors?: string[]
  rawOutput?: any
}

type Assessment = {
  assessmentId: string
  condition: string
  createdAt: string
  items: Prediction[]
  summary: { probability?: number | null; riskLevel: string }
}

const MODEL_ORDER: Record<string, string[]> = {
  cardiovascular: ["RandomForest", "XGBoost", "SVM", "HybridQuantum"],
  diabetes: ["LogisticRegression", "RandomForest", "FinetunedHybridQML"],
}

const modelLabel: Record<string, string> = {
  RandomForest: "Random Forest",
  XGBoost: "XGBoost",
  SVM: "SVM (RBF)",
  HybridQuantum: "Hybrid Quantum",
  LogisticRegression: "Logistic Regression",
  FinetunedHybridQML: "Finetuned Hybrid QML",
}

const conditionLabel: Record<string, string> = {
  cardiovascular: "Cardiovascular",
  diabetes: "Diabetes",
}

function pct(x?: number | null) {
  return typeof x === "number" ? `${(x * 100).toFixed(1)}%` : "—"
}

function band(x?: string) {
  return x === "high" ? "Higher" : x === "moderate" ? "Moderate" : x === "low" ? "Lower" : "Unavailable"
}

function TrajectoryChart({ assessments }: { assessments: Assessment[] }) {
  // Chronological order for trajectory progression (Run 1 -> Run 2 -> ...)
  const data = useMemo(
    () =>
      assessments
        .slice()
        .reverse()
        .filter((a) => typeof a.summary.probability === "number")
        .slice(-10),
    [assessments]
  )

  if (data.length < 2) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed bg-background/50 p-6 text-center text-sm text-muted-foreground">
        <TrendingUp className="mb-2 h-6 w-6 text-muted-foreground/60" />
        <p className="font-medium text-foreground">Single assessment recorded</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          Update the patient biometrics and run a second assessment to map the risk trajectory curve across multiple test runs.
        </p>
      </div>
    )
  }

  const w = 760
  const h = 250
  const pad = 42

  const pts = data.map((a, i) => {
    const value = a.summary.probability || 0
    return {
      runNumber: i + 1,
      x: pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1),
      y: pad + (1 - value) * (h - pad * 2),
      value,
      label: `Run ${i + 1}`,
      date: new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }
  })

  // Trajectory delta between first and latest run
  const firstVal = pts[0].value
  const latestVal = pts[pts.length - 1].value
  const delta = latestVal - firstVal
  const isImprovement = delta < 0

  return (
    <div className="rounded-xl border bg-background/50 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Trajectory Mapping:</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
            {pts.length} Assessment Runs
          </span>
        </div>
        <div className="font-medium">
          Net Change:{" "}
          <span className={isImprovement ? "text-emerald-600 font-semibold" : delta > 0 ? "text-amber-600 font-semibold" : "text-muted-foreground"}>
            {delta > 0 ? `+${(delta * 100).toFixed(1)}% risk` : delta < 0 ? `${(delta * 100).toFixed(1)}% risk` : "No change"}
          </span>{" "}
          (Run 1 → Run {pts.length})
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="min-w-[650px] w-full" role="img" aria-label="Assessment probability trajectory">
          {/* Background grid lines */}
          <line x1={pad} y1={pad} x2={w - pad} y2={pad} stroke="currentColor" strokeOpacity=".08" />
          <line x1={pad} y1={pad + (h - pad * 2) / 2} x2={w - pad} y2={pad + (h - pad * 2) / 2} stroke="currentColor" strokeOpacity=".08" strokeDasharray="4 4" />
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="currentColor" strokeOpacity=".14" />
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="currentColor" strokeOpacity=".14" />

          {/* Y Axis Labels */}
          <text x="8" y={pad + 4} className="fill-muted-foreground text-[10px]">100%</text>
          <text x="14" y={pad + (h - pad * 2) / 2 + 4} className="fill-muted-foreground text-[10px]">50%</text>
          <text x="20" y={h - pad + 4} className="fill-muted-foreground text-[10px]">0%</text>

          {/* Trajectory Path */}
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          />

          {/* Points & Run Badges */}
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="6" className="fill-background stroke-primary" strokeWidth="3" />
              <text x={p.x} y={h - 14} textAnchor="middle" className="fill-primary font-bold text-[11px]">
                {p.label}
              </text>
              <text x={p.x} y={h - 2} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                {p.date}
              </text>
              <text x={p.x} y={p.y - 12} textAnchor="middle" className="fill-foreground font-semibold text-[11px]">
                {(p.value * 100).toFixed(1)}%
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

function MetricTable({ metrics }: { metrics: any }) {
  const rows = Object.entries(metrics || {}) as [string, any][]
  if (!rows.length)
    return <p className="text-sm text-muted-foreground">Evaluation metrics for this condition have not been supplied in the model package.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-3">Model</th>
            <th className="pb-3">Accuracy</th>
            <th className="pb-3">Sensitivity</th>
            <th className="pb-3">Specificity</th>
            <th className="pb-3">F1</th>
            <th className="pb-3">ROC-AUC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([m, v]) => (
            <tr key={m} className="border-b last:border-0">
              <td className="py-3 font-medium">{modelLabel[m] || m}</td>
              <td className="py-3">{(v.accuracy * 100).toFixed(1)}%</td>
              <td className="py-3">{(v.sensitivity * 100).toFixed(1)}%</td>
              <td className="py-3">{(v.specificity * 100).toFixed(1)}%</td>
              <td className="py-3">{(v.f1 * 100).toFixed(1)}%</td>
              <td className="py-3">{v.roc_auc.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Patient() {
  const { id } = useParams()
  const router = useRouter()
  const [d, setD] = useState<any>()
  const [error, setError] = useState("")
  const [downloading, setDownloading] = useState(false)
  const [metrics, setMetrics] = useState<any>()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  function loadData() {
    if (!id) return
    api<any>(`/patients/${id}`)
      .then((data) => {
        setD(data)
        setEditForm(data.patient || {})
      })
      .catch((e) => {
        setError(e.message)
        if (e.message.includes("Authentication")) router.push("/login")
      })
  }

  useEffect(() => {
    loadData()
  }, [id, router])

  useEffect(() => {
    if (d?.viewerRole === "doctor" && d?.patient?.condition) {
      api<any>(`/ml-info`)
        .then((x) => setMetrics(x.conditions?.[d.patient.condition]))
        .catch(() => {})
    }
  }, [d?.viewerRole, d?.patient?.condition])

  async function handleSaveData(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const payload = { ...editForm }
      if (condition === "cardiovascular") {
        ["age", "height", "weight", "ap_hi", "ap_lo", "bmi", "gender", "cholesterol", "gluc", "smoke", "alco", "active"].forEach(
          (k) => {
            if (payload[k] !== undefined && payload[k] !== "") payload[k] = Number(payload[k])
          }
        )
      } else {
        ["age", "bmi", "HbA1c_level", "blood_glucose_level", "hypertension", "heart_disease"].forEach((k) => {
          if (payload[k] !== undefined && payload[k] !== "") payload[k] = Number(payload[k])
        })
      }
      await api<any>(`/patients/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      setIsEditing(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update patient data")
    } finally {
      setSaving(false)
    }
  }

  if (error && !d)
    return (
      <main className="min-h-screen bg-background">
        <Shell />
        <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-destructive">{error}</div>
      </main>
    )

  if (!d)
    return (
      <main className="min-h-screen bg-background">
        <Shell />
        <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-muted-foreground">Loading…</div>
      </main>
    )

  const doctor = d.viewerRole === "doctor"
  const patientData = d.patient || {}
  const predictions: Prediction[] = d.predictions || []
  const assessments: Assessment[] = d.assessments || []
  const latest = assessments[0]
  const latestItems = latest?.items || []
  const consensus = latest?.summary?.probability
  const riskIndicators = d.riskIndicators || []
  const condition = patientData.condition || "cardiovascular"
  const order = MODEL_ORDER[condition]
  const performance = metrics?.production_test_set?.models || metrics?.test_set?.models || {}
  const fair = metrics?.fair_same_feature_benchmark?.models || {}

  async function downloadReport() {
    setDownloading(true)
    try {
      const r = await fetch(`/api/patients/${id}/report`, { credentials: "include" })
      if (!r.ok) {
        const data = await r.json().catch(() => null)
        throw new Error(data?.message || "Could not download report")
      }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `BioSync-${patientData.patientId}-${condition}-analysis-report.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download report")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Shell />
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/patients" className="text-sm text-muted-foreground hover:text-foreground">
          ← Patients
        </Link>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-primary font-medium">
              {doctor ? `${conditionLabel[condition]} patient profile` : `Your ${conditionLabel[condition].toLowerCase()} profile`}
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{patientData.name}</h1>
            <p className="mt-2 text-muted-foreground">{patientData.patientId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-sm hover:bg-muted"
            >
              <Edit3 className="h-4 w-4" /> Edit Data
            </button>
            <Link
              href={`/patients/${id}/assessment`}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Run New Assessment
            </Link>
            {doctor && (
              <button
                onClick={downloadReport}
                disabled={downloading}
                className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-sm hover:bg-muted disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloading ? "Preparing…" : "Download PDF"}
              </button>
            )}
          </div>
        </div>

        {error && <div className="mt-6 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {/* Current Biometric Snapshot Card */}
        <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-sm">Active Biometric Snapshot</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Update values for trajectory →
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 text-xs">
            <div className="rounded-xl border bg-background/50 p-3">
              <span className="text-muted-foreground">Age</span>
              <p className="mt-1 font-semibold text-sm">{patientData.age ?? "—"} yrs</p>
            </div>
            <div className="rounded-xl border bg-background/50 p-3">
              <span className="text-muted-foreground">BMI</span>
              <p className="mt-1 font-semibold text-sm">{patientData.bmi ?? "—"}</p>
            </div>
            {condition === "cardiovascular" ? (
              <>
                <div className="rounded-xl border bg-background/50 p-3">
                  <span className="text-muted-foreground">Blood Pressure</span>
                  <p className="mt-1 font-semibold text-sm">
                    {patientData.ap_hi || "—"}/{patientData.ap_lo || "—"}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/50 p-3">
                  <span className="text-muted-foreground">Cholesterol</span>
                  <p className="mt-1 font-semibold text-sm">
                    {patientData.cholesterol === 1 ? "Normal" : patientData.cholesterol === 2 ? "Above Normal" : "High"}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/50 p-3">
                  <span className="text-muted-foreground">Glucose</span>
                  <p className="mt-1 font-semibold text-sm">
                    {patientData.gluc === 1 ? "Normal" : patientData.gluc === 2 ? "Above Normal" : "High"}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/50 p-3">
                  <span className="text-muted-foreground">Smoker</span>
                  <p className="mt-1 font-semibold text-sm">{patientData.smoke === 1 ? "Yes" : "No"}</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border bg-background/50 p-3">
                  <span className="text-muted-foreground">HbA1c</span>
                  <p className="mt-1 font-semibold text-sm">{patientData.HbA1c_level ?? "—"}%</p>
                </div>
                <div className="rounded-xl border bg-background/50 p-3">
                  <span className="text-muted-foreground">Blood Glucose</span>
                  <p className="mt-1 font-semibold text-sm">{patientData.blood_glucose_level ?? "—"} mg/dL</p>
                </div>
                <div className="rounded-xl border bg-background/50 p-3">
                  <span className="text-muted-foreground">Gender</span>
                  <p className="mt-1 font-semibold text-sm">{patientData.diabetesGender ?? "—"}</p>
                </div>
                <div className="rounded-xl border bg-background/50 p-3">
                  <span className="text-muted-foreground">Smoking History</span>
                  <p className="mt-1 font-semibold text-sm">{patientData.smoking_history ?? "—"}</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Trajectory Mapping Section - Available for Both Patients & Doctors */}
        <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-base">Risk Trajectory & Trend Mapping</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tracks how model-derived risk evolves over time as patient parameters are retested or updated across consecutive runs.
              </p>
            </div>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-5">
            <TrajectoryChart assessments={assessments} />
          </div>
        </section>

        {/* Assessment Snapshot & Risk Band */}
        <section className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" /> Model-derived {conditionLabel[condition].toLowerCase()} risk band
            </div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-semibold">{typeof consensus === "number" ? pct(consensus) : "—"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Latest assessment consensus probability. Not a diagnosis.
                </p>
              </div>
              <span className="rounded-full border px-3 py-1 text-xs font-semibold">{band(latest?.summary?.riskLevel)}</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${typeof consensus === "number" ? Math.max(0, Math.min(100, consensus * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Assessment Snapshot
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Trajectory Runs</p>
                <p className="mt-1 font-semibold">{assessments.length} Completed</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Run Timestamp</p>
                <p className="mt-1 font-semibold">
                  {latest ? new Date(latest.createdAt).toLocaleString() : "No assessments yet"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Granular Comparison */}
        {doctor && (
          <>
            <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Model Comparison (Latest Run)</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Individual model predictions for the latest submitted patient record.
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-3">Model</th>
                      <th className="pb-3">Prediction</th>
                      <th className="pb-3">Probability / score</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.map((name) => {
                      const x = latestItems.find((p) => p.model === name)
                      return (
                        <tr key={name} className="border-b last:border-0">
                          <td className="py-4 font-medium">{modelLabel[name] || name}</td>
                          <td className="py-4">{x ? (x.prediction === 1 ? "Positive" : "Negative") : "Not run"}</td>
                          <td className="py-4">
                            {x
                              ? typeof x.probability === "number"
                                ? pct(x.probability)
                                : typeof x.decisionScore === "number"
                                ? `Decision ${x.decisionScore.toFixed(3)}`
                                : "Not probabilistic"
                              : "—"}
                          </td>
                          <td className="py-4 text-muted-foreground">{x ? "Completed" : "Unavailable"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Hybrid Quantum Component Output</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Quantum branch evaluation for this assessment run.</p>
                </div>
                <Atom className="h-5 w-5 text-muted-foreground" />
              </div>
              {(() => {
                const q = latestItems.find(
                  (p) => p.model === (condition === "diabetes" ? "FinetunedHybridQML" : "HybridQuantum")
                )
                return q ? (
                  <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Prediction</p>
                      <p className="mt-1 text-2xl font-semibold">{q.prediction === 1 ? "Positive" : "Negative"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {typeof q.probability === "number" ? "Model probability" : "Decision score"}
                      </p>
                      <p className="mt-1 font-semibold">
                        {typeof q.probability === "number"
                          ? pct(q.probability)
                          : typeof q.decisionScore === "number"
                          ? q.decisionScore.toFixed(3)
                          : "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed bg-background/50 p-4 text-sm text-muted-foreground">
                    Quantum model execution completed with classical ensemble.
                  </div>
                )
              })()}
            </section>
          </>
        )}

        {/* Indicators */}
        <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Relevant Submitted-Value Indicators</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Directly derived from the current entered patient biometrics; these are not model attribution weights.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {riskIndicators.length ? (
              riskIndicators.map((f: string) => (
                <div key={f} className="rounded-xl border bg-background/60 px-4 py-3 text-sm font-medium">
                  {f}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No high-risk biometric indicators identified.</p>
            )}
          </div>
        </section>

        {/* Complete Assessment History (Trajectory Log) */}
        <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-semibold">Assessment Run History</h2>
              <p className="text-xs text-muted-foreground">Chronological log of all executed assessment runs</p>
            </div>
            <History className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 divide-y">
            {assessments.map((a, idx) => (
              <div key={a.assessmentId} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      Run {assessments.length - idx}
                    </span>
                    <p className="text-sm font-medium">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.items.map((x) => modelLabel[x.model] || x.model).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{pct(a.summary.probability)}</span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{band(a.summary.riskLevel)}</span>
                </div>
              </div>
            ))}
            {!assessments.length && <p className="py-5 text-sm text-muted-foreground">No assessments run yet.</p>}
          </div>
        </section>
      </div>

      {/* Edit Data Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-semibold">Edit Patient Health Data</h3>
                <p className="text-xs text-muted-foreground">
                  Update values to track improvements or changes in your trajectory
                </p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-full p-1.5 hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveData} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-medium">
                  Age
                  <input
                    type="number"
                    value={editForm.age ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="input mt-1"
                    required
                  />
                </label>

                {condition === "cardiovascular" ? (
                  <>
                    <label className="text-xs font-medium">
                      Height (cm)
                      <input
                        type="number"
                        value={editForm.height ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Weight (kg)
                      <input
                        type="number"
                        value={editForm.weight ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      BMI
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.bmi ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, bmi: e.target.value })}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Systolic BP (ap_hi)
                      <input
                        type="number"
                        value={editForm.ap_hi ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, ap_hi: e.target.value })}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Diastolic BP (ap_lo)
                      <input
                        type="number"
                        value={editForm.ap_lo ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, ap_lo: e.target.value })}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Cholesterol
                      <select
                        value={editForm.cholesterol ?? 1}
                        onChange={(e) => setEditForm({ ...editForm, cholesterol: Number(e.target.value) })}
                        className="input mt-1"
                      >
                        <option value="1">1 - Normal</option>
                        <option value="2">2 - Above Normal</option>
                        <option value="3">3 - Well Above Normal</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium">
                      Glucose
                      <select
                        value={editForm.gluc ?? 1}
                        onChange={(e) => setEditForm({ ...editForm, gluc: Number(e.target.value) })}
                        className="input mt-1"
                      >
                        <option value="1">1 - Normal</option>
                        <option value="2">2 - Above Normal</option>
                        <option value="3">3 - Well Above Normal</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium">
                      Smoker
                      <select
                        value={editForm.smoke ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, smoke: Number(e.target.value) })}
                        className="input mt-1"
                      >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium">
                      Physically Active
                      <select
                        value={editForm.active ?? 1}
                        onChange={(e) => setEditForm({ ...editForm, active: Number(e.target.value) })}
                        className="input mt-1"
                      >
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="text-xs font-medium">
                      BMI
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.bmi ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, bmi: e.target.value })}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      HbA1c Level (%)
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.HbA1c_level ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, HbA1c_level: e.target.value })}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Blood Glucose (mg/dL)
                      <input
                        type="number"
                        value={editForm.blood_glucose_level ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, blood_glucose_level: e.target.value })}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Smoking History
                      <select
                        value={editForm.smoking_history ?? "never"}
                        onChange={(e) => setEditForm({ ...editForm, smoking_history: e.target.value })}
                        className="input mt-1"
                      >
                        <option value="never">Never</option>
                        <option value="former">Former</option>
                        <option value="current">Current</option>
                        <option value="ever">Ever</option>
                        <option value="not current">Not Current</option>
                        <option value="No Info">No Info</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium">
                      Hypertension Recorded
                      <select
                        value={editForm.hypertension ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, hypertension: Number(e.target.value) })}
                        className="input mt-1"
                      >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium">
                      Heart Disease Recorded
                      <select
                        value={editForm.heart_disease ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, heart_disease: Number(e.target.value) })}
                        className="input mt-1"
                      >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                      </select>
                    </label>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full border px-5 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
