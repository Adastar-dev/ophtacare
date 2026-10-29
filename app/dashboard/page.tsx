"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Spinner } from "@/components/ui/spinner"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case "patient":
          router.replace("/dashboard/patient")
          break
        case "doctor":
          router.replace("/dashboard/doctor")
          break
        case "secretary":
          router.replace("/dashboard/secretary")
          break
        case "admin":
          router.replace("/dashboard/admin")
          break
        case "caissier":
          router.replace("/dashboard/caissier")
          break
        default:
          router.replace("/")
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner className="h-8 w-8 mx-auto text-primary" />
        <p className="text-muted-foreground">Redirection en cours...</p>
      </div>
    </div>
  )
}
