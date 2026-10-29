"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, EyeOff, User, Stethoscope, ClipboardList, Shield, 
  Loader2, ArrowLeft, ArrowRight, Heart, Activity, 
  CheckCircle2, Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'

const roles: { value: UserRole; label: string; icon: React.ElementType; description: string; demoEmail: string; color: string; bgColor: string }[] = [
  { 
    value: 'patient', 
    label: 'Patient', 
    icon: User,
    description: 'Rendez-vous & dossier médical',
    demoEmail: 'patient@demo.com',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  { 
    value: 'doctor', 
    label: 'Médecin', 
    icon: Stethoscope,
    description: 'Consultations & patients',
    demoEmail: 'doctor@demo.com',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
  },
  { 
    value: 'secretary', 
    label: 'Secrétaire', 
    icon: ClipboardList,
    description: 'Planning & accueil',
    demoEmail: 'secretary@demo.com',
    color: 'text-violet-600',
    bgColor: 'bg-violet-500/10 border-violet-500/20',
  },
  { 
    value: 'admin', 
    label: 'Administrateur', 
    icon: Shield,
    description: 'Administration système',
    demoEmail: 'admin@demo.com',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
  },
]

const features = [
  { icon: Activity, text: 'Suivi ophtalmologique complet' },
  { icon: Heart, text: 'Dossiers patients sécurisés' },
  { icon: CheckCircle2, text: 'Gestion des rendez-vous en temps réel' },
  { icon: Lock, text: 'Données chiffrées et conformes HDS' },
]

export function LoginForm() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    const roleData = roles.find(r => r.value === role)
    if (roleData) {
      setEmail(roleData.demoEmail)
      setPassword('demo123')
    }
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) {
      setError('Veuillez sélectionner un rôle')
      return
    }
    
    setIsSubmitting(true)
    setError('')

    try {
      const success = await login(email, password, selectedRole)
      if (success) {
        router.push(`/dashboard/${selectedRole}`)
      } else {
        setError('Identifiants incorrects')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedRoleData = roles.find(r => r.value === selectedRole)

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-90" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/3" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
              <Eye className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">OphtaCare</span>
          </div>
          <p className="text-primary-foreground/70 text-sm">Cabinet Ophtalmologique</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Votre vision,<br />notre expertise
            </h2>
            <p className="text-primary-foreground/75 text-base leading-relaxed">
              Plateforme de gestion médicale conçue pour les cabinets d&apos;ophtalmologie modernes.
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
          <p className="text-primary-foreground/50 text-xs">
            © 2026 OphtaCare · Données fictives — Application de démonstration
          </p>
        </div>
      </div>

      {/* Right Panel — Auth */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold">OphtaCare</span>
          </div>

          {!selectedRole ? (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Connexion</h1>
                <p className="text-muted-foreground mt-1">Choisissez votre profil pour continuer</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon
                  return (
                    <button
                      key={role.value}
                      onClick={() => handleRoleSelect(role.value)}
                      className={cn(
                        'group flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200',
                        'hover:shadow-md hover:scale-[1.02] text-left',
                        role.bgColor
                      )}
                    >
                      <div className={cn('p-2 rounded-lg bg-white/60 dark:bg-black/20', role.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{role.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{role.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Mode démo — cliquez sur un profil pour pré-remplir les identifiants
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedRole(null); setError('') }}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2.5">
                  {selectedRoleData && (
                    <div className={cn('p-2 rounded-lg', selectedRoleData.bgColor)}>
                      {(() => { const Icon = selectedRoleData.icon; return <Icon className={cn('h-4 w-4', selectedRoleData.color)} /> })()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      Connexion {selectedRoleData?.label}
                    </h1>
                    <p className="text-xs text-muted-foreground">{selectedRoleData?.description}</p>
                  </div>
                </div>
              </div>

              {/* Demo badge */}
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/15 rounded-lg">
                <Badge variant="secondary" className="text-xs shrink-0">DÉMO</Badge>
                <p className="text-xs text-muted-foreground">
                  Identifiants pré-remplis · Utilisez n&apos;importe quel mot de passe
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
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
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                    <span className="shrink-0">⚠</span>
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
