"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiError } from "@/lib/api"
import {
  Eye, EyeOff, Loader2, ArrowRight, Heart, Activity,
  CheckCircle2, Lock, User as UserIcon, Stethoscope, ShieldCheck,
} from "lucide-react"

const features = [
  { icon: Activity, text: "Suivi ophtalmologique complet" },
  { icon: Heart, text: "Dossiers patients sécurisés" },
  { icon: CheckCircle2, text: "Prise de rendez-vous & paiement mobile" },
  { icon: Lock, text: "Prise en charge assurance" },
]

export function AuthScreen() {
  const { login, register } = useAuth()
  const router = useRouter()

  const [space, setSpace] = useState<"patient" | "staff">("patient")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Champs communs
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Inscription patient
  const [reg, setReg] = useState({
    prenom: "", nom: "", telephone: "", date_naissance: "", genre: "M" as "M" | "F",
    assureur: "", numero_assurance: "", taux_couverture: "",
  })
  const [withInsurance, setWithInsurance] = useState(false)

  const redirect = (role: string) => router.push(`/dashboard/${role}`)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    try {
      const u = await login(email, password)
      redirect(u.role)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Identifiants incorrects")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    try {
      const u = await register({
        prenom: reg.prenom,
        nom: reg.nom,
        email,
        password,
        telephone: reg.telephone,
        date_naissance: reg.date_naissance,
        genre: reg.genre,
        ...(withInsurance && reg.assureur
          ? {
              assureur: reg.assureur,
              numero_assurance: reg.numero_assurance,
              taux_couverture: reg.taux_couverture ? Number(reg.taux_couverture) : undefined,
            }
          : {}),
      })
      redirect(u.role)
    } catch (err) {
      if (err instanceof ApiError && err.data?.errors) {
        const first = Object.values(err.data.errors)[0] as string[]
        setError(first?.[0] || err.message)
      } else {
        setError(err instanceof ApiError ? err.message : "Erreur lors de l'inscription")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
              <Eye className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">OphtaCare</span>
          </div>
          <p className="text-primary-foreground/70 text-sm">Centre Ophtalmologique</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Votre vision,<br />notre expertise
            </h2>
            <p className="text-primary-foreground/75 text-base leading-relaxed">
              Réservez vos consultations, payez par Wave ou Orange Money, ou laissez votre assurance
              prendre en charge votre rendez-vous.
            </p>
          </div>
          <div className="space-y-3">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/15 rounded-lg">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-primary-foreground/85 text-sm">{feature.text}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-primary-foreground/50 text-xs">© 2026 OphtaCare · Plateforme de gestion</p>
        </div>
      </div>

      {/* Auth */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold">OphtaCare</span>
          </div>

          {/* Sélecteur d'espace */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl mb-6">
            <button
              onClick={() => { setSpace("patient"); setError("") }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${space === "patient" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
            >
              <UserIcon className="h-4 w-4" /> Patient
            </button>
            <button
              onClick={() => { setSpace("staff"); setError("") }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${space === "staff" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
            >
              <Stethoscope className="h-4 w-4" /> Personnel
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg mb-4">
              <span className="shrink-0">⚠</span>
              {error}
            </div>
          )}

          {space === "staff" ? (
            <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in-0 duration-200">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Espace personnel</h1>
                <p className="text-muted-foreground mt-1 text-sm">Médecin, secrétaire, caissier ou administrateur</p>
              </div>
              <EmailPassword
                email={email} password={password}
                setEmail={setEmail} setPassword={setPassword}
                showPassword={showPassword} setShowPassword={setShowPassword}
              />
              <SubmitButton isSubmitting={isSubmitting} label="Se connecter" />
            </form>
          ) : (
            <Tabs defaultValue="login" className="animate-in fade-in-0 duration-200" onValueChange={() => setError("")}>
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="register">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <EmailPassword
                    email={email} password={password}
                    setEmail={setEmail} setPassword={setPassword}
                    showPassword={showPassword} setShowPassword={setShowPassword}
                  />
                  <SubmitButton isSubmitting={isSubmitting} label="Se connecter" />
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Prénom">
                      <Input value={reg.prenom} onChange={(e) => setReg({ ...reg, prenom: e.target.value })} required />
                    </Field>
                    <Field label="Nom">
                      <Input value={reg.nom} onChange={(e) => setReg({ ...reg, nom: e.target.value })} required />
                    </Field>
                  </div>
                  <Field label="Adresse email">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Téléphone">
                      <Input value={reg.telephone} onChange={(e) => setReg({ ...reg, telephone: e.target.value })} placeholder="+221..." required />
                    </Field>
                    <Field label="Mot de passe">
                      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Date de naissance">
                      <Input type="date" value={reg.date_naissance} onChange={(e) => setReg({ ...reg, date_naissance: e.target.value })} required />
                    </Field>
                    <Field label="Genre">
                      <Select value={reg.genre} onValueChange={(v) => setReg({ ...reg, genre: v as "M" | "F" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculin</SelectItem>
                          <SelectItem value="F">Féminin</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {/* Assurance optionnelle */}
                  <button
                    type="button"
                    onClick={() => setWithInsurance(!withInsurance)}
                    className={`w-full flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${withInsurance ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"}`}
                  >
                    <ShieldCheck className={`h-4 w-4 ${withInsurance ? "text-primary" : ""}`} />
                    J&apos;ai une prise en charge assurance
                    {withInsurance && <Badge variant="secondary" className="ml-auto text-xs">Activée</Badge>}
                  </button>

                  {withInsurance && (
                    <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border">
                      <Field label="Assureur">
                        <Input value={reg.assureur} onChange={(e) => setReg({ ...reg, assureur: e.target.value })} placeholder="Ex: NSIA, IPM..." />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="N° de police">
                          <Input value={reg.numero_assurance} onChange={(e) => setReg({ ...reg, numero_assurance: e.target.value })} />
                        </Field>
                        <Field label="Taux (%)">
                          <Input type="number" min={0} max={100} value={reg.taux_couverture} onChange={(e) => setReg({ ...reg, taux_couverture: e.target.value })} placeholder="80" />
                        </Field>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Avec une assurance valide, vos rendez-vous peuvent être confirmés sans acompte.
                      </p>
                    </div>
                  )}

                  <SubmitButton isSubmitting={isSubmitting} label="Créer mon compte" />
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  )
}

function EmailPassword({
  email, password, setEmail, setPassword, showPassword, setShowPassword,
}: {
  email: string; password: string
  setEmail: (v: string) => void; setPassword: (v: string) => void
  showPassword: boolean; setShowPassword: (v: boolean) => void
}) {
  return (
    <>
      <Field label="Adresse email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required className="h-11" />
      </Field>
      <Field label="Mot de passe">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
    </>
  )
}

function SubmitButton({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
  return (
    <Button type="submit" className="w-full h-11 font-medium" disabled={isSubmitting}>
      {isSubmitting ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Veuillez patienter...</>
      ) : (
        <>{label}<ArrowRight className="ml-2 h-4 w-4" /></>
      )}
    </Button>
  )
}
