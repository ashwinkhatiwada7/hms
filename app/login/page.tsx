import LoginForm from "@/app/login/login-form"
import LoginGate from "@/app/login/login-gate"
import { Suspense } from "react"

export default async function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-white">
      <Suspense fallback={null}>
        <LoginGate />
      </Suspense>
      <div
        className="absolute inset-0 z-0 animate-in duration-1000 ease-out fade-in motion-reduce:animate-none"
        style={{
          backgroundImage: `
      linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
      radial-gradient(circle 500px at 0% 20%, rgba(139,92,246,0.3), transparent),
      radial-gradient(circle 500px at 100% 0%, rgba(59,130,246,0.3), transparent)
    `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />
      <main className="relative flex min-h-screen items-center justify-center px-6 py-10">
        <LoginForm />
      </main>
    </div>
  )
}
