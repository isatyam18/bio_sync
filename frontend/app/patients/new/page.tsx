"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Shell } from "@/components/workspace-shell"

const cardioFields:[string,string,string][]=[['patientId','Patient ID','text'],['name','Full name','text'],['age','Age','number'],['height','Height (cm)','number'],['weight','Weight (kg)','number'],['ap_hi','Systolic BP','number'],['ap_lo','Diastolic BP','number'],['bmi','BMI','number']]
const diabetesFields:[string,string,string][]=[['patientId','Patient ID','text'],['name','Full name','text'],['age','Age','number'],['bmi','BMI','number'],['HbA1c_level','HbA1c level','number'],['blood_glucose_level','Blood glucose','number']]

export default function NewPatient(){
  const [condition,setCondition]=useState<"cardiovascular"|"diabetes">("cardiovascular")
  const [role,setRole]=useState<string>()
  const [loading,setLoading]=useState(false),[error,setError]=useState(''); const r=useRouter()
  useEffect(()=>{api<any>("/auth/me").then(x=>setRole(x.user?.role)).catch(()=>{})},[])
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError('');setLoading(true);const o:any=Object.fromEntries(new FormData(e.currentTarget));o.condition=condition
    if(condition==='cardiovascular'){['age','height','weight','ap_hi','ap_lo','bmi','gender','cholesterol','gluc','smoke','alco','active'].forEach(k=>o[k]=Number(o[k]))}
    else {['age','bmi','HbA1c_level','blood_glucose_level','hypertension','heart_disease'].forEach(k=>o[k]=Number(o[k]));}
    try{const p=await api<any>('/patients',{method:'POST',body:JSON.stringify(o)});r.push('/patients/'+p._id)}catch(e){setError(e instanceof Error?e.message:'Could not save patient')}finally{setLoading(false)}}
  const fields=condition==='cardiovascular'?cardioFields:diabetesFields
  return <main className="min-h-screen bg-background"><Shell/><div className="mx-auto max-w-3xl px-5 py-10"><Link href="/patients" className="text-sm text-muted-foreground">← Patients</Link><h1 className="mt-5 font-serif text-4xl font-semibold">{role === "patient" ? "Start an assessment" : "Add patient"}</h1><p className="mt-2 text-muted-foreground">Enter the fields required by the selected assessment model. The same validated record is then used by the assessment service.</p>
    <form onSubmit={submit} className="mt-8 rounded-2xl border bg-card p-6 shadow-sm"><label className="text-sm font-medium">Assessment type<select value={condition} onChange={e=>setCondition(e.target.value as any)} className="input mt-1.5"><option value="cardiovascular">Cardiovascular</option><option value="diabetes">Diabetes</option></select></label>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{fields.map(([n,l,t])=><label key={n} className="text-sm font-medium">{l}<input name={n} required={!['patientId','name'].includes(n) || role !== 'patient'} className="input mt-1.5" type={t} step={t==='number'?'any':undefined} placeholder={n==='patientId' && role==='patient' ? 'Optional — generated if blank' : undefined}/></label>)}
      {condition==='cardiovascular'?<><label className="text-sm font-medium">Gender<select name="gender" className="input mt-1.5" defaultValue="1"><option value="1">Male</option><option value="2">Female</option></select></label><CategorySelect name="cholesterol" label="Cholesterol" options={[[1,"Normal"],[2,"Above normal"],[3,"Well above normal"]]}/><CategorySelect name="gluc" label="Glucose" options={[[1,"Normal"],[2,"Above normal"],[3,"Well above normal"]]}/><BinarySelect name="smoke" label="Smoker"/><BinarySelect name="alco" label="Alcohol"/><BinarySelect name="active" label="Physically active"/></>:<><label className="text-sm font-medium">Gender<select name="diabetesGender" className="input mt-1.5" defaultValue=""><option value="" disabled>Select gender</option><option>Female</option><option>Male</option><option>Other</option></select></label><label className="text-sm font-medium">Smoking history<select name="smoking_history" className="input mt-1.5" defaultValue=""><option value="" disabled>Select smoking history</option><option value="never">Never</option><option value="current">Current</option><option value="former">Former</option><option value="ever">Ever</option><option value="not current">Not current</option><option value="No Info">No Info</option></select></label><BinarySelect name="hypertension" label="Hypertension recorded"/><BinarySelect name="heart_disease" label="Heart disease recorded"/></>}</div>
      {error&&<p className="mt-4 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}<button disabled={loading} className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{loading?'Saving…':role==='patient'?'Create assessment profile':'Save patient'}</button></form></div></main>
}
function CategorySelect({name,label,options}:{name:string;label:string;options:[number,string][]}){return <label className="text-sm font-medium">{label}<select name={name} className="input mt-1.5" defaultValue="1">{options.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label>}
function BinarySelect({name,label}:{name:string;label:string}){return <label className="text-sm font-medium">{label}<select name={name} className="input mt-1.5" defaultValue="0"><option value="0">No</option><option value="1">Yes</option></select></label>}
