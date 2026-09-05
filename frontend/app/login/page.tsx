import type { Metadata } from "next"
import { AuthForm } from "@/components/site/auth-form"

export const metadata: Metadata = {
  title: "Log in — BioSync",
  description: "Log in to your BioSync workspace.",
}

export default function LoginPage() {
  return <AuthForm mode="login" />
}
