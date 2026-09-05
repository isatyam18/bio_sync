"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Shell } from "@/components/workspace-shell"
import { Atom, CheckCircle2, Stethoscope, Sliders, RefreshCw } from "lucide-react"

const labels: Record<string, string> = { cardiovascular: "Cardiovascular", diabetes: "Diabetes" }

export default function AssessmentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [role, setRole] = useState<string>()
  const [patient, setPatient] = useState<any>()
  const [formData, setFormData] = useState<any>({})
  const [showEdit, setShowEdit] = useState(false)
  const [condition, setCondition] = useState<string>("cardiovascular")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>()
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      api<any>("/auth/me"),
      api<any>(`/patients/${id}`),
    ]).then(([me, d]) => {
      setRole(me.user?.role)
      const p = d.patient || {}
      setPatient(p)
      setFormData(p)
      setCondition(p.condition || "cardiovascular")
    }).catch((e) => {
      setError(e instanceof Error ? e.message : "Could not load the assessment")
      if (String(e?.message || "").includes("Authentication")) router.push("/login")
    })
  }, [id, router])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }))
  }

  async function run(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setLoading(true)
    setError("")
    try {
      // 1. If form has modifications, update patient data first
      if (showEdit || Object.keys(formData).length > 0) {
        const payload: any = { ...formData }
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
      }

      // 2. Execute new model assessment run
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
        <Link href={`/patients/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Patient profile</Link>
        <p className="mt-6 text-sm font-semibold text-primary">{label} assessment</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Run an assessment</h1>
        <p className="mt-2 text-muted-foreground">
          {doctor
            ? `Run the available ${label.toLowerCase()} models for ${patient?.name || "this registered patient"}. You can modify biometric values to test new trajectory points.`
            : `Process your submitted ${label.toLowerCase()} health information or update your values for a new assessment run.`}
        </p>

        <section className="mt-8 rounded-2xl border bg-card p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Stethoscope className="h-5 w-5" />
            </div>
            <button
              type="button"
              onClick={() => setShowEdit(!showEdit)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Sliders className="h-3.5 w-3.5" />
              {showEdit ? "Hide biometric inputs" : "Update values for this run"}
            </button>
          </div>

          <h2 className="mt-5 text-xl font-semibold">Model-based assessment</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            BioSync will send the saved patient record through the condition-specific model set and store the resulting assessment in your trajectory history.
          </p>

          {/* Form for updating parameters before running */}
          {showEdit && (
            <div className="mt-6 rounded-xl border bg-background/60 p-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-semibold text-primary">Update Health Data for Next Run</h3>
                <span className="text-xs text-muted-foreground">Saves to patient profile</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium">
                  Age
                  <input
                    name="age"
                    type="number"
                    value={formData.age ?? ""}
                    onChange={handleInputChange}
                    className="input mt-1"
                    min="0"
                    max="120"
                    required
                  />
                </label>

                {condition === "cardiovascular" ? (
                  <>
                    <label className="text-xs font-medium">
                      Height (cm)
                      <input
                        name="height"
                        type="number"
                        value={formData.height ?? ""}
                        onChange={handleInputChange}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Weight (kg)
                      <input
                        name="weight"
                        type="number"
                        value={formData.weight ?? ""}
                        onChange={handleInputChange}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      BMI
                      <input
                        name="bmi"
                        type="number"
                        step="0.1"
                        value={formData.bmi ?? ""}
                        onChange={handleInputChange}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Systolic BP (ap_hi)
                      <input
                        name="ap_hi"
                        type="number"
                        value={formData.ap_hi ?? ""}
                        onChange={handleInputChange}
                        className="input mt-1"
                        placeholder="e.g. 120"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Diastolic BP (ap_lo)
                      <input
                        name="ap_lo"
                        type="number"
                        value={formData.ap_lo ?? ""}
                        onChange={handleInputChange}
                        className="input mt-1"
                        placeholder="e.g. 80"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Cholesterol
                      <select
                        name="cholesterol"
                        value={formData.cholesterol ?? 1}
                        onChange={handleInputChange}
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
                        name="gluc"
                        value={formData.gluc ?? 1}
                        onChange={handleInputChange}
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
                        name="smoke"
                        value={formData.smoke ?? 0}
                        onChange={handleInputChange}
                        className="input mt-1"
                      >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium">
                      Physically Active
                      <select
                        name="active"
                        value={formData.active ?? 1}
                        onChange={handleInputChange}
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
                        name="bmi"
                        type="number"
                        step="0.1"
                        value={formData.bmi ?? ""}
                        onChange={handleInputChange}
                        className="input mt-1"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      HbA1c Level (%)
                      <input
                        name="HbA1c_level"
                        type="number"
                        step="0.1"
                        value={formData.HbA1c_level ?? ""}
                        onChange={handleInputChange}
                        className="input mt-1"
                        placeholder="e.g. 5.7"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Blood Glucose (mg/dL)
                      <input
                        name="blood_glucose_level"
                        type="number"
                        value={formData.blood_glucose_level ?? ""}
                        onChange={handleInputChange}
                        className="input mt-1"
                        placeholder="e.g. 100"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Gender
                      <select
                        name="diabetesGender"
                        value={formData.diabetesGender ?? "Female"}
                        onChange={handleInputChange}
                        className="input mt-1"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium">
                      Smoking History
                      <select
                        name="smoking_history"
                        value={formData.smoking_history ?? "never"}
                        onChange={handleInputChange}
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
                        name="hypertension"
                        value={formData.hypertension ?? 0}
                        onChange={handleInputChange}
                        className="input mt-1"
                      >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium">
                      Heart Disease Recorded
                      <select
                        name="heart_disease"
                        value={formData.heart_disease ?? 0}
                        onChange={handleInputChange}
                        className="input mt-1"
                      >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                      </select>
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-background/60 p-4">
              <p className="text-xs text-muted-foreground">Condition</p>
              <p className="mt-1 font-semibold">{label}</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <p className="text-xs text-muted-foreground">Quantum component</p>
              <p className="mt-1 inline-flex items-center gap-1.5 font-semibold">
                <Atom className="h-4 w-4 text-primary" /> Included
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => run()}
              disabled={loading || !role}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running assessment…
                </>
              ) : showEdit ? (
                "Update & Run assessment"
              ) : (
                "Run assessment"
              )}
            </button>
            {!showEdit && (
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Change health data before running →
              </button>
            )}
          </div>

          {error && <p className="mt-4 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}

          {result && (
            <div className="mt-7 rounded-2xl border bg-background/60 p-6">
              {doctor ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Assessment completed (Saved to Trajectory)
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {result.results?.length || result.modelsRun || 0} model result(s) were saved. Open the patient profile to review the trajectory chart, updated comparison, and report.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Assessment completed
                  </div>
                  <p className="mt-3 text-2xl font-semibold">
                    {result.riskLevel === "high"
                      ? "Higher model-derived risk band"
                      : result.riskLevel === "moderate"
                      ? "Moderate model-derived risk band"
                      : result.riskLevel === "low"
                      ? "Lower model-derived risk band"
                      : "Assessment processed"}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.patientMessage}</p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-semibold">
                    <Stethoscope className="h-4 w-4" /> Recommended next step: discuss the result with a healthcare professional
                  </div>
                </>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    router.push(`/patients/${id}?updated=${Date.now()}`)
                    router.refresh()
                  }}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                >
                  View Trajectory & Patient Profile →
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
