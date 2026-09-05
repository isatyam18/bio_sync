import type { Metadata } from "next"
import { AuthForm } from "@/components/site/auth-form"

export const metadata: Metadata = {
  title: "Sign up — BioSync",
  description: "Create your BioSync account to start using model-based health risk assessments.",
}

export default function SignupPage() {
  return <AuthForm mode="signup" />
}
