"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, Users, FileText, ChevronRight, Stethoscope, Loader2, CheckCircle2, X } from 'lucide-react'
import Link from 'next/link'
import { getRendezVous, getConsultations, updateRendezVous } from '@/lib/services'
import type { BackendRendezVous, BackendConsultation } from '@/lib/types'
import { statutRdvLabels, statutRdvBadgeClass } from '@/lib/rdv-helpers'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [todayRdv, setTodayRdv] = useState<BackendRendezVous[]>([])
  const [recentConsultations, setRecentConsultations] = useState<BackendConsultation[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      getRendezVous({ date: today }),
      getConsultations(),
    ]).then(([rdvs, consultations]) => {
      setTodayRdv(rdvs)
      setRecentConsultations(consultations.slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const markStatus = async (id: number, statut: 'honore' | 'annule') => {
    setActingId(id)
    try {
      await updateRendezVous(id, { statut_rdv: statut })
      const today = new Date().toISOString().split('T')[0]
      const rdvs = await getRendezVous({ date: today })
      setTodayRdv(rdvs)
    } catch { /* noop */ } finally {
      setActingId(null)
    }
  }

  if (!user) return null

  const confirmedToday = todayRdv.filter((r) => r.statut_rdv === 'confirme').length
  const waitingCount = todayRdv.filter((r) => r.statut_rdv === 'en_attente_paiement').length

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bonjour, {user.name ?? user.firstName}</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">RDV du jour</CardTitle>
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayRdv.length}</div>
                <p className="text-xs text-muted-foreground">{confirmedToday} confirmés</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{waitingCount}</div>
                <p className="text-xs text-muted-foreground">patients confirmés</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Consultations récentes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentConsultations.length}</div>
                <p className="text-xs text-muted-foreground">dans l&apos;historique</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Prescriptions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentConsultations.filter((c) => c.prescription).length}
                </div>
                <p className="text-xs text-muted-foreground">avec ordonnance</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* RDV du jour */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>RDV du jour</CardTitle>
                  <CardDescription>{todayRdv.length} rendez-vous planifiés</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/doctor/calendar">Calendrier <ChevronRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayRdv.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun RDV aujourd&apos;hui.</p>
                )}
                {todayRdv.map((rdv) => {
                  const heure = new Date(rdv.date_heure_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  const nomPatient = rdv.patient
                    ? `${rdv.patient.prenom} ${rdv.patient.nom}`
                    : `Patient #${rdv.patient_id}`
                  return (
                    <div key={rdv.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold min-w-[48px]">{heure}</p>
                        <div className="h-8 w-px bg-border" />
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {nomPatient.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{nomPatient}</p>
                          <p className="text-xs text-muted-foreground">{rdv.motif ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Badge className={statutRdvBadgeClass(rdv.statut_rdv)}>{statutRdvLabels[rdv.statut_rdv]}</Badge>
                        {rdv.statut_rdv === 'confirme' && (
                          <>
                            <Button size="sm" asChild>
                              <Link href={`/dashboard/doctor/consultations/new?rdv_id=${rdv.id}`}>
                                <Stethoscope className="mr-1 h-3.5 w-3.5" />Commencer
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={actingId === rdv.id}
                              onClick={() => markStatus(rdv.id, 'honore')}
                            >
                              {actingId === rdv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Honoré</>}
                            </Button>
                          </>
                        )}
                        {(rdv.statut_rdv === 'confirme' || rdv.statut_rdv === 'en_attente_paiement') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            disabled={actingId === rdv.id}
                            onClick={() => markStatus(rdv.id, 'annule')}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Right column */}
            <div className="space-y-6">
              {/* Consultations récentes */}
              <Card>
                <CardHeader>
                  <CardTitle>Consultations récentes</CardTitle>
                  <CardDescription>Derniers patients consultés</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentConsultations.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucune consultation.</p>
                  )}
                  {recentConsultations.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-accent/10 text-accent">P{c.patient_id}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">Patient #{c.patient_id}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.diagnostic ?? 'Pas de diagnostic'}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full text-xs" asChild>
                    <Link href="/dashboard/doctor/consultations">Voir toutes</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card>
                <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/doctor/consultations/new"><Stethoscope className="mr-2 h-4 w-4" />Nouvelle consultation</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/doctor/prescriptions"><FileText className="mr-2 h-4 w-4" />Ordonnances</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/doctor/calendar"><Calendar className="mr-2 h-4 w-4" />Calendrier</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
