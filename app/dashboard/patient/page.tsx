"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ShieldCheck, Wallet, ChevronRight, Loader2, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { getRendezVous, getMyPatient, formatMontant } from '@/lib/services'
import { MobilePaymentDialog } from '@/components/payment/mobile-payment-dialog'
import { statutRdvLabels, statutRdvBadgeClass, formatDateHeure } from '@/lib/rdv-helpers'
import type { BackendRendezVous, BackendPatient } from '@/lib/types'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [rdvs, setRdvs] = useState<BackendRendezVous[]>([])
  const [patient, setPatient] = useState<BackendPatient | null>(null)
  const [loading, setLoading] = useState(true)
  const [payRdv, setPayRdv] = useState<BackendRendezVous | null>(null)
  const [payOpen, setPayOpen] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      getRendezVous().then(setRdvs).catch(() => {}),
      getMyPatient().then(setPatient).catch(() => {}),
    ]).finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (!user) return null

  const now = new Date()
  const upcoming = rdvs
    .filter((r) => new Date(r.date_heure_rdv) >= now && r.statut_rdv !== 'annule')
    .sort((a, b) => +new Date(a.date_heure_rdv) - +new Date(b.date_heure_rdv))
  const next = upcoming[0]
  const aRegler = rdvs.filter((r) => r.statut_paiement === 'non_paye' || r.statut_paiement === 'acompte_verse')
  const hasAssurance = !!(patient?.assureur && patient?.numero_assurance)

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="p-6 sm:p-8">
      <MobilePaymentDialog rdv={payRdv} open={payOpen} onOpenChange={setPayOpen} onPaid={load} />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour, {user.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue sur votre espace patient OphtaCare
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prochain rendez-vous</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {next ? (
              <>
                <div className="text-xl font-bold">{formatDateHeure(next.date_heure_rdv).date}</div>
                <p className="text-xs text-muted-foreground">
                  {formatDateHeure(next.date_heure_rdv).heure}{next.medecin?.name ? ` · ${next.medecin.name}` : ""}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Aucun rendez-vous à venir</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paiements en attente</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aRegler.length}</div>
            <p className="text-xs text-muted-foreground">rendez-vous à régler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assurance</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasAssurance ? (
              <>
                <div className="text-lg font-bold">{patient?.assureur}</div>
                <p className="text-xs text-muted-foreground">
                  Couverture {patient?.taux_couverture ?? 100}% · RDV sans acompte
                </p>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/patient/profile">Ajouter mon assurance</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rendez-vous à venir */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Rendez-vous à venir</CardTitle>
            <CardDescription>Vos prochaines consultations</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/patient/appointments">Voir tout <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-muted-foreground">Aucun rendez-vous planifié</p>
              <Button asChild><Link href="/dashboard/patient/book">Prendre un rendez-vous</Link></Button>
            </div>
          ) : (
            upcoming.slice(0, 5).map((rdv) => {
              const { date, heure } = formatDateHeure(rdv.date_heure_rdv)
              const needsPayment = rdv.statut_paiement === 'non_paye' || rdv.statut_paiement === 'acompte_verse'
              return (
                <div key={rdv.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 gap-3 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg"><Calendar className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="font-medium">{rdv.motif || 'Consultation'}</p>
                      <p className="text-sm text-muted-foreground">{date} · {heure}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statutRdvBadgeClass(rdv.statut_rdv)}>{statutRdvLabels[rdv.statut_rdv]}</Badge>
                    {needsPayment && (
                      <Button size="sm" onClick={() => { setPayRdv(rdv); setPayOpen(true) }}>
                        <Smartphone className="mr-1 h-4 w-4" /> Payer
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
