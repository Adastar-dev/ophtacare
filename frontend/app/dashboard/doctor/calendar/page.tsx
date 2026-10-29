"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Clock, Plus, Loader2, BanIcon, AlertCircle, CheckCircle2, X, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import {
  getRendezVous, getPatients, createRendezVous, updateRendezVous,
  getIndisponibilites, createIndisponibilite, deleteIndisponibilite,
  type BackendIndisponibilite,
} from '@/lib/services'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { BackendRendezVous, BackendPatient } from '@/lib/types'
import { statutRdvBadgeClass, statutRdvLabels } from '@/lib/rdv-helpers'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const WORK_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOfMonth(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }

export default function CalendarPage() {
  const { user } = useAuth()
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [view, setView] = useState<'month' | 'day'>('month')
  const [rdvList, setRdvList] = useState<BackendRendezVous[]>([])
  const [patientMap, setPatientMap] = useState<Record<number, BackendPatient>>({})
  const [loading, setLoading] = useState(true)
  const [indispos, setIndispos] = useState<BackendIndisponibilite[]>([])

  // Dialogs
  const [rdvDialogOpen, setRdvDialogOpen] = useState(false)
  const [rdvDate, setRdvDate] = useState('')
  const [rdvHeure, setRdvHeure] = useState('08:00')
  const [rdvMotif, setRdvMotif] = useState('')
  const [rdvMontant, setRdvMontant] = useState('15000')
  const [rdvSaving, setRdvSaving] = useState(false)
  const [rdvError, setRdvError] = useState('')

  const [actionRdv, setActionRdv] = useState<BackendRendezVous | null>(null)
  const [actionSaving, setActionSaving] = useState(false)

  const [horsServiceDialogOpen, setHorsServiceDialogOpen] = useState(false)
  const [horsServiceDate, setHorsServiceDate] = useState('')
  const [horsServiceHeureDebut, setHorsServiceHeureDebut] = useState('12')
  const [horsServiceHeureFin, setHorsServiceHeureFin] = useState('14')
  const [horsServiceMotif, setHorsServiceMotif] = useState('')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const refreshIndispos = () => getIndisponibilites().then(setIndispos).catch(() => {})

  useEffect(() => {
    Promise.all([getRendezVous(), getPatients(), getIndisponibilites()])
      .then(([rdvs, pts, indispo]) => {
        setRdvList(rdvs)
        setIndispos(indispo)
        const map: Record<number, BackendPatient> = {}
        pts.forEach(p => { map[p.id] = p })
        setPatientMap(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getPatientName = (rdv: BackendRendezVous) => {
    if (rdv.patient) return `${rdv.patient.prenom} ${rdv.patient.nom}`
    const p = patientMap[rdv.patient_id]
    return p ? `${p.prenom} ${p.nom}` : `Patient #${rdv.patient_id}`
  }

  const getPatientInitials = (rdv: BackendRendezVous) => {
    if (rdv.patient) return `${rdv.patient.prenom?.[0] ?? ''}${rdv.patient.nom?.[0] ?? ''}`
    const p = patientMap[rdv.patient_id]
    return p ? `${p.prenom?.[0] ?? ''}${p.nom?.[0] ?? ''}` : `P`
  }

  const rdvByDate = useMemo(() => {
    const map: Record<string, BackendRendezVous[]> = {}
    rdvList.forEach((r) => {
      const d = new Date(r.date_heure_rdv).toLocaleDateString('fr-CA')
      map[d] = [...(map[d] || []), r]
    })
    return map
  }, [rdvList])

  const selectedDateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
  const selectedRdv = rdvByDate[selectedDateKey] ?? []

  const rdvByHour = useMemo(() => {
    const map: Record<number, BackendRendezVous[]> = {}
    selectedRdv.forEach((r) => {
      const h = new Date(r.date_heure_rdv).getHours()
      map[h] = [...(map[h] || []), r]
    })
    return map
  }, [selectedRdv])

  const indispoForHour = (dateKey: string, hour: number) =>
    indispos.find((i) => i.date === dateKey && hour >= i.heure_debut && hour < i.heure_fin)

  const isHorsService = (hour: number) => !!indispoForHour(selectedDateKey, hour)

  const toggleHorsService = async (dateKey: string, hour: number) => {
    const existing = indispoForHour(dateKey, hour)
    try {
      if (existing) {
        await deleteIndisponibilite(existing.id)
      } else {
        await createIndisponibilite({ date: dateKey, heure_debut: hour, heure_fin: hour + 1 })
      }
      await refreshIndispos()
    } catch { /* noop */ }
  }

  const openRdvDialog = () => {
    setRdvDate(selectedDateKey)
    setRdvHeure('08:00')
    setRdvMotif('')
    setRdvError('')
    setRdvDialogOpen(true)
  }

  const markRdv = async (rdv: BackendRendezVous, statut: 'honore' | 'annule') => {
    setActionSaving(true)
    try {
      await updateRendezVous(rdv.id, { statut_rdv: statut })
      const rdvs = await getRendezVous()
      setRdvList(rdvs)
      setActionRdv(null)
    } catch { /* noop */ } finally {
      setActionSaving(false)
    }
  }

  const submitRdv = async () => {
    if (!rdvDate || !rdvHeure) return
    setRdvSaving(true); setRdvError('')
    try {
      const dt = `${rdvDate}T${rdvHeure}:00`
      await createRendezVous({
        date_heure_rdv: dt,
        motif: rdvMotif || 'Hors service / Indisponibilité',
        montant_total: Number(rdvMontant) || 0,
        user_id: user?.id ? Number(user.id) : null,
      })
      const rdvs = await getRendezVous()
      setRdvList(rdvs)
      setRdvDialogOpen(false)
    } catch (e) {
      setRdvError(e instanceof ApiError ? e.message : 'Erreur lors de la création')
    } finally {
      setRdvSaving(false)
    }
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const calendarCells: (number | null)[] = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  const todayKey = today.toLocaleDateString('fr-CA')
  const todayCount = (rdvByDate[todayKey] ?? []).length

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendrier</h1>
          <p className="text-muted-foreground mt-1">{MONTHS[month]} {year} — {loading ? '…' : `${rdvList.length} rendez-vous`}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['month', 'day'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-sm font-medium transition-colors ${view === v ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                {v === 'month' ? 'Mois' : 'Jour'}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={() => { setHorsServiceDate(selectedDateKey); setHorsServiceDialogOpen(true) }}>
            <BanIcon className="mr-2 h-4 w-4" />Hors service
          </Button>
          <Button onClick={openRdvDialog}><Plus className="mr-2 h-4 w-4" />Nouveau RDV</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Aujourd'hui", value: todayCount, color: 'text-primary' },
          { label: 'Ce mois', value: rdvList.filter(r => { const d = new Date(r.date_heure_rdv); return d.getMonth() === month && d.getFullYear() === year }).length, color: 'text-emerald-500' },
          { label: 'Total', value: rdvList.length, color: 'text-muted-foreground' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>}
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grille mois */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{MONTHS[month]} {year}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  const newDate = new Date(year, month - 1, 1)
                  setCurrentDate(newDate)
                  setSelectedDay((d) => Math.min(d, getDaysInMonth(newDate.getFullYear(), newDate.getMonth())))
                }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  const newDate = new Date(year, month + 1, 1)
                  setCurrentDate(newDate)
                  setSelectedDay((d) => Math.min(d, getDaysInMonth(newDate.getFullYear(), newDate.getMonth())))
                }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, i) => {
                const dk = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
                const count = dk ? (rdvByDate[dk] ?? []).length : 0
                return (
                  <button
                    key={i}
                    onClick={() => { if (day) { setSelectedDay(day); setView('day') } }}
                    disabled={!day}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all ${!day ? 'invisible' : ''} ${day === selectedDay ? 'bg-primary text-primary-foreground font-bold shadow-md' : ''} ${day && isToday(day) && day !== selectedDay ? 'ring-2 ring-primary ring-offset-1 font-semibold' : ''} ${day && day !== selectedDay ? 'hover:bg-secondary' : ''}`}
                  >
                    {day}
                    {count > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                        {count > 1 && <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Agenda jour */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{selectedDay} {MONTHS[month]}</span>
              <Badge variant="secondary" className="text-xs">{selectedRdv.length} RDV</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[520px]">
              {WORK_HOURS.map(hour => {
                const appts = rdvByHour[hour] ?? []
                const hs = isHorsService(hour)
                return (
                  <div key={hour} className={`flex border-t border-border/50 min-h-[56px] ${hs ? 'bg-muted/60 opacity-70' : ''}`}>
                    <div className="w-14 shrink-0 flex items-start pt-2 px-3">
                      <span className="text-xs text-muted-foreground font-medium">{hour}:00</span>
                    </div>
                    <div className="flex-1 p-1.5 space-y-1">
                      {hs && (
                        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground">
                          <BanIcon className="h-3 w-3" /> Hors service
                          <button
                            className="ml-auto text-[10px] underline hover:text-foreground"
                            onClick={() => toggleHorsService(selectedDateKey, hour)}
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                      {!hs && appts.length === 0 && (
                        <button
                          className="w-full text-left text-[11px] text-muted-foreground/40 p-1 hover:text-muted-foreground/70 hover:bg-muted/50 rounded transition-colors"
                          onClick={() => toggleHorsService(selectedDateKey, hour)}
                        >
                          + Marquer hors service
                        </button>
                      )}
                      {appts.map((rdv) => {
                        const time = new Date(rdv.date_heure_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        const name = getPatientName(rdv)
                        const initials = getPatientInitials(rdv)
                        const canAct = rdv.statut_rdv === 'confirme' || rdv.statut_rdv === 'en_attente_paiement'
                        return (
                          <div
                            key={rdv.id}
                            onClick={() => canAct && setActionRdv(rdv)}
                            className={`flex items-center gap-2 p-2 rounded-lg border border-primary/20 bg-primary/5 text-xs transition-opacity ${canAct ? 'cursor-pointer hover:opacity-80' : 'opacity-60'}`}
                          >
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{initials || 'P'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" />
                                <span>{time}</span>
                              </div>
                              {rdv.motif && <p className="text-[10px] opacity-70 truncate mt-0.5">{rdv.motif}</p>}
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statutRdvBadgeClass(rdv.statut_rdv)}`}>
                              {statutRdvLabels[rdv.statut_rdv]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nouveau RDV */}
      <Dialog open={rdvDialogOpen} onOpenChange={(o) => { if (!rdvSaving) setRdvDialogOpen(o) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription>Créez un rendez-vous pour un patient ou une indisponibilité.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={rdvDate} onChange={(e) => setRdvDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Heure</Label>
                <Input type="time" value={rdvHeure} onChange={(e) => setRdvHeure(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Motif</Label>
              <Textarea placeholder="Ex: Consultation de suivi, indisponibilité…" value={rdvMotif} onChange={(e) => setRdvMotif(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Montant (F CFA)</Label>
              <Input type="number" value={rdvMontant} onChange={(e) => setRdvMontant(e.target.value)} />
            </div>
            {rdvError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />{rdvError}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRdvDialogOpen(false)}>Annuler</Button>
            <Button onClick={submitRdv} disabled={rdvSaving || !rdvDate}>
              {rdvSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création…</> : 'Créer le RDV'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Action RDV — Marquer honoré / annulé */}
      <Dialog open={!!actionRdv} onOpenChange={(o) => { if (!o && !actionSaving) setActionRdv(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mettre à jour le rendez-vous</DialogTitle>
            <DialogDescription>
              {actionRdv && `${getPatientName(actionRdv)} — ${new Date(actionRdv.date_heure_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Statut actuel : <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${actionRdv ? statutRdvBadgeClass(actionRdv.statut_rdv) : ''}`}>
                {actionRdv ? statutRdvLabels[actionRdv.statut_rdv] : ''}
              </span>
            </p>
            <p className="text-sm">Que voulez-vous faire ?</p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              disabled={actionSaving}
              onClick={() => actionRdv && markRdv(actionRdv, 'annule')}
            >
              {actionSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Annuler le RDV
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={actionSaving}
              onClick={() => actionRdv && markRdv(actionRdv, 'honore')}
            >
              {actionSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Honoré
            </Button>
            {actionRdv?.statut_rdv === 'confirme' && (
              <Button className="flex-1" asChild>
                <Link href={`/dashboard/doctor/consultations/new?rdv_id=${actionRdv.id}`}>
                  <Stethoscope className="mr-2 h-4 w-4" />Commencer
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Hors service (plage) */}
      <Dialog open={horsServiceDialogOpen} onOpenChange={setHorsServiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer hors service</DialogTitle>
            <DialogDescription>Ces créneaux apparaîtront grisés pour les patients.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={horsServiceDate} onChange={(e) => setHorsServiceDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Heure début</Label>
                <Input type="number" min="8" max="18" value={horsServiceHeureDebut} onChange={(e) => setHorsServiceHeureDebut(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Heure fin</Label>
                <Input type="number" min="8" max="18" value={horsServiceHeureFin} onChange={(e) => setHorsServiceHeureFin(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Motif (optionnel)</Label>
              <Input placeholder="Ex: Congé, formation, réunion…" value={horsServiceMotif} onChange={(e) => setHorsServiceMotif(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setHorsServiceDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={async () => {
                if (!horsServiceDate) return
                const debut = Number(horsServiceHeureDebut)
                const fin = Number(horsServiceHeureFin)
                if (fin <= debut) return
                try {
                  await createIndisponibilite({
                    date: horsServiceDate,
                    heure_debut: debut,
                    heure_fin: fin,
                    motif: horsServiceMotif || null,
                  })
                  await refreshIndispos()
                } catch { /* noop */ }
                setHorsServiceDialogOpen(false)
              }}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
