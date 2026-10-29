"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Calendar, Clock, User, Plus, X, Check, Phone, ChevronLeft, ChevronRight,
  Loader2, Bell, AlertCircle, RefreshCw, Search,
} from 'lucide-react'
import {
  getRendezVous, getMedecins, getPatients, createRendezVous, updateRendezVous, cancelRendezVous,
  formatMontant,
} from '@/lib/services'
import { ApiError } from '@/lib/api'
import type { BackendRendezVous, BackendPatient } from '@/lib/types'
import type { Medecin } from '@/lib/services'
import { statutRdvLabels, statutRdvBadgeClass, statutPaiementLabels, formatDateHeure } from '@/lib/rdv-helpers'

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function getWeekDates(pivot: Date): Date[] {
  const day = pivot.getDay()
  const monday = new Date(pivot)
  monday.setDate(pivot.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
}

export default function SecretaryDashboard() {
  const { user } = useAuth()
  const today = new Date()

  const [rdvList, setRdvList] = useState<BackendRendezVous[]>([])
  const [medecins, setMedecins] = useState<Medecin[]>([])
  const [patients, setPatients] = useState<BackendPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [weekPivot, setWeekPivot] = useState(new Date(today))
  const [selectedMedecin, setSelectedMedecin] = useState<number | 'all'>('all')
  const [selectedDate, setSelectedDate] = useState(today.toLocaleDateString('fr-CA'))

  // Nouveau RDV dialog
  const [rdvOpen, setRdvOpen] = useState(false)
  const [rdvPatientSearch, setRdvPatientSearch] = useState('')
  const [rdvPatientId, setRdvPatientId] = useState<number | null>(null)
  const [rdvDate, setRdvDate] = useState(today.toLocaleDateString('fr-CA'))
  const [rdvHeure, setRdvHeure] = useState('08:00')
  const [rdvMotif, setRdvMotif] = useState('')
  const [rdvMontant, setRdvMontant] = useState('15000')
  const [rdvSaving, setRdvSaving] = useState(false)
  const [rdvError, setRdvError] = useState('')

  // Reporter dialog
  const [reporterRdv, setReporterRdv] = useState<BackendRendezVous | null>(null)
  const [reporterDate, setReporterDate] = useState('')
  const [reporterHeure, setReporterHeure] = useState('')
  const [reporterSaving, setReporterSaving] = useState(false)
  const [reporterError, setReporterError] = useState('')

  const load = () => {
    Promise.all([getRendezVous(), getMedecins(), getPatients()])
      .then(([rdvs, meds, pts]) => {
        setRdvList(rdvs)
        setMedecins(meds)
        setPatients(pts)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const patientMap = useMemo(() => {
    const m: Record<number, BackendPatient> = {}
    patients.forEach(p => { m[p.id] = p })
    return m
  }, [patients])

  const getPatientName = (rdv: BackendRendezVous) => {
    if (rdv.patient) return `${rdv.patient.prenom} ${rdv.patient.nom}`
    const p = patientMap[rdv.patient_id]
    return p ? `${p.prenom} ${p.nom}` : `Patient #${rdv.patient_id}`
  }

  const getPatientPhone = (rdv: BackendRendezVous) => {
    if (rdv.patient) return rdv.patient.telephone
    const p = patientMap[rdv.patient_id]
    return p ? p.telephone : ''
  }

  const filteredRdv = useMemo(() =>
    rdvList.filter(r => selectedMedecin === 'all' || r.user_id === selectedMedecin),
    [rdvList, selectedMedecin]
  )

  const weekDates = useMemo(() => getWeekDates(weekPivot), [weekPivot])

  const rdvByDate = useMemo(() => {
    const map: Record<string, BackendRendezVous[]> = {}
    filteredRdv.forEach(r => {
      const dk = new Date(r.date_heure_rdv).toLocaleDateString('fr-CA')
      map[dk] = [...(map[dk] ?? []), r]
    })
    return map
  }, [filteredRdv])

  const todayKey = today.toLocaleDateString('fr-CA')
  const todayRdv = rdvByDate[todayKey] ?? []
  const selectedRdv = rdvByDate[selectedDate] ?? []
  const pendingRdv = filteredRdv.filter(r => r.statut_rdv === 'en_attente' || r.statut_rdv === 'en_attente_paiement')
  // notifCount uses rdvList (unfiltered) so the badge reflects the global pending count
  const notifCount = rdvList.filter(r => r.statut_rdv === 'en_attente' || r.statut_rdv === 'en_attente_paiement').length

  const handleConfirm = async (rdv: BackendRendezVous) => {
    try {
      await updateRendezVous(rdv.id, { statut_rdv: 'confirme' })
      load()
    } catch { /* noop */ }
  }

  const handleCancel = async (rdv: BackendRendezVous) => {
    try {
      await cancelRendezVous(rdv.id)
      load()
    } catch { /* noop */ }
  }

  const openReporter = (rdv: BackendRendezVous) => {
    setReporterRdv(rdv)
    const d = new Date(rdv.date_heure_rdv)
    setReporterDate(d.toLocaleDateString('fr-CA'))
    setReporterHeure(d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    setReporterError('')
  }

  const submitReporter = async () => {
    if (!reporterRdv) return
    setReporterSaving(true); setReporterError('')
    try {
      await updateRendezVous(reporterRdv.id, {
        date_heure_rdv: `${reporterDate}T${reporterHeure}:00`,
        statut_rdv: 'en_attente',
      })
      setReporterRdv(null)
      load()
    } catch (e) {
      setReporterError(e instanceof ApiError ? e.message : 'Erreur lors du report')
    } finally {
      setReporterSaving(false)
    }
  }

  const filteredPatientsForSearch = patients.filter(p => {
    const q = rdvPatientSearch.toLowerCase()
    return `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
      p.telephone.includes(q) ||
      p.code_patient.toLowerCase().includes(q)
  }).slice(0, 8)

  const submitRdv = async () => {
    if (!rdvDate || !rdvHeure || !rdvPatientId) return
    setRdvSaving(true); setRdvError('')
    try {
      await createRendezVous({
        patient_id: rdvPatientId,
        date_heure_rdv: `${rdvDate}T${rdvHeure}:00`,
        motif: rdvMotif || undefined,
        montant_total: Number(rdvMontant) || 0,
      })
      setRdvOpen(false)
      setRdvPatientId(null); setRdvPatientSearch(''); setRdvMotif('')
      load()
    } catch (e) {
      setRdvError(e instanceof ApiError ? e.message : 'Erreur lors de la création')
    } finally {
      setRdvSaving(false)
    }
  }

  if (!user) return null

  const nextRdv = todayRdv
    .filter(r => new Date(r.date_heure_rdv) >= today)
    .sort((a, b) => a.date_heure_rdv.localeCompare(b.date_heure_rdv))[0]

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Rendez-vous</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? '…' : `${rdvList.length} rendez-vous au total`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {notifCount > 0 && (
            <div className="relative">
              <Button variant="outline" size="icon" onClick={() => {}}>
                <Bell className="h-4 w-4" />
              </Button>
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                {notifCount}
              </span>
            </div>
          )}
          <Select value={String(selectedMedecin)} onValueChange={(v) => setSelectedMedecin(v === 'all' ? 'all' : Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les médecins" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les médecins</SelectItem>
              {medecins.map(m => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setRdvDate(today.toLocaleDateString('fr-CA')); setRdvOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Aujourd'hui", value: todayRdv.length, icon: <Calendar className="h-4 w-4" />, color: 'text-primary' },
          { label: 'Confirmés', value: filteredRdv.filter(r => r.statut_rdv === 'confirme').length, icon: <Check className="h-4 w-4" />, color: 'text-green-600' },
          { label: 'En attente', value: notifCount, icon: <Bell className="h-4 w-4" />, color: 'text-amber-600' },
          {
            label: 'Prochain',
            value: nextRdv ? new Date(nextRdv.date_heure_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—',
            icon: <Clock className="h-4 w-4" />,
            color: 'text-foreground',
          },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">{s.icon}</span>
              </div>
              {loading
                ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                : <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>}
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="day" className="space-y-6">
        <TabsList>
          <TabsTrigger value="day">Jour</TabsTrigger>
          <TabsTrigger value="week">Semaine</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            En attente
            {notifCount > 0 && (
              <span className="ml-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                {notifCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Vue Jour ── */}
        <TabsContent value="day" className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <p className="text-sm text-muted-foreground">
              {selectedRdv.length} rendez-vous ce jour
            </p>
          </div>
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : selectedRdv.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun rendez-vous pour cette date</p>
              ) : (
                <div className="space-y-3">
                  {selectedRdv
                    .sort((a, b) => a.date_heure_rdv.localeCompare(b.date_heure_rdv))
                    .map(rdv => (
                      <RdvRow
                        key={rdv.id}
                        rdv={rdv}
                        name={getPatientName(rdv)}
                        phone={getPatientPhone(rdv)}
                        onConfirm={() => handleConfirm(rdv)}
                        onCancel={() => handleCancel(rdv)}
                        onReporter={() => openReporter(rdv)}
                      />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Vue Semaine multi-médecins ── */}
        <TabsContent value="week">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Semaine du {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => setWeekPivot(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd })}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs"
                    onClick={() => setWeekPivot(new Date())}>
                    Auj.
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => setWeekPivot(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd })}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 min-w-[700px]">
                {weekDates.map((date) => {
                  const dk = date.toLocaleDateString('fr-CA')
                  const dayRdv = rdvByDate[dk] ?? []
                  const isToday = dk === todayKey
                  return (
                    <div key={dk} className="space-y-1.5">
                      <div
                        className={`text-center p-2 rounded-lg cursor-pointer transition-colors ${isToday ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                        onClick={() => { setSelectedDate(dk) }}
                      >
                        <p className="text-xs font-medium">{DAYS_SHORT[date.getDay()]}</p>
                        <p className={`text-sm font-bold`}>{date.getDate()}</p>
                        {dayRdv.length > 0 && (
                          <span className={`text-[10px] ${isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {dayRdv.length} RDV
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayRdv.slice(0, 4).map(rdv => (
                          <div key={rdv.id} className={`p-1.5 text-[10px] rounded border ${statutRdvBadgeClass(rdv.statut_rdv)} border-current/20`}>
                            <p className="font-semibold truncate">
                              {new Date(rdv.date_heure_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="truncate opacity-80">{getPatientName(rdv)}</p>
                          </div>
                        ))}
                        {dayRdv.length > 4 && (
                          <p className="text-[10px] text-center text-muted-foreground">+{dayRdv.length - 4} autres</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── En attente ── */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                Rendez-vous en attente ({pendingRdv.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : pendingRdv.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun rendez-vous en attente</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date / Heure</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRdv
                      .sort((a, b) => a.date_heure_rdv.localeCompare(b.date_heure_rdv))
                      .map(rdv => {
                        const { date, heure } = formatDateHeure(rdv.date_heure_rdv)
                        return (
                          <TableRow key={rdv.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{getPatientName(rdv)}</p>
                                {getPatientPhone(rdv) && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />{getPatientPhone(rdv)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <p>{date}</p>
                              <p className="text-muted-foreground">{heure}</p>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {rdv.motif || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {statutPaiementLabels[rdv.statut_paiement]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${statutRdvBadgeClass(rdv.statut_rdv)}`}>
                                {statutRdvLabels[rdv.statut_rdv]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5 flex-wrap">
                                <Button size="sm" variant="outline"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => handleConfirm(rdv)}>
                                  <Check className="mr-1 h-3 w-3" />Confirmer
                                </Button>
                                <Button size="sm" variant="outline"
                                  onClick={() => openReporter(rdv)}>
                                  <RefreshCw className="mr-1 h-3 w-3" />Reporter
                                </Button>
                                <Button size="sm" variant="outline"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => handleCancel(rdv)}>
                                  <X className="mr-1 h-3 w-3" />Annuler
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nouveau RDV */}
      <Dialog open={rdvOpen} onOpenChange={o => { if (!rdvSaving) setRdvOpen(o) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription>Créez un rendez-vous pour un patient.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, téléphone, code…"
                  value={rdvPatientSearch}
                  onChange={e => { setRdvPatientSearch(e.target.value); setRdvPatientId(null) }}
                  className="pl-9"
                />
              </div>
              {rdvPatientSearch && !rdvPatientId && (
                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {filteredPatientsForSearch.length === 0
                    ? <p className="p-2 text-sm text-muted-foreground text-center">Aucun patient trouvé</p>
                    : filteredPatientsForSearch.map(p => (
                      <button
                        key={p.id}
                        className="w-full text-left p-2.5 text-sm hover:bg-secondary transition-colors"
                        onClick={() => { setRdvPatientId(p.id); setRdvPatientSearch(`${p.prenom} ${p.nom}`) }}
                      >
                        <p className="font-medium">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-muted-foreground">{p.telephone} · {p.code_patient}</p>
                      </button>
                    ))}
                </div>
              )}
              {rdvPatientId && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />Patient sélectionné
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={rdvDate} onChange={e => setRdvDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Heure *</Label>
                <Input type="time" value={rdvHeure} onChange={e => setRdvHeure(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Motif</Label>
              <Textarea placeholder="Ex: Consultation de suivi…" value={rdvMotif} onChange={e => setRdvMotif(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Montant (F CFA)</Label>
              <Input type="number" value={rdvMontant} onChange={e => setRdvMontant(e.target.value)} />
            </div>
            {rdvError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />{rdvError}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRdvOpen(false)}>Annuler</Button>
            <Button onClick={submitRdv} disabled={rdvSaving || !rdvPatientId || !rdvDate}>
              {rdvSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création…</> : 'Créer le RDV'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Reporter */}
      <Dialog open={!!reporterRdv} onOpenChange={o => { if (!o && !reporterSaving) setReporterRdv(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reporter le rendez-vous</DialogTitle>
            <DialogDescription>Choisissez une nouvelle date et heure.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nouvelle date</Label>
              <Input type="date" value={reporterDate} onChange={e => setReporterDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nouvelle heure</Label>
              <Input type="time" value={reporterHeure} onChange={e => setReporterHeure(e.target.value)} />
            </div>
            {reporterError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />{reporterError}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReporterRdv(null)}>Annuler</Button>
            <Button onClick={submitReporter} disabled={reporterSaving || !reporterDate}>
              {reporterSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RdvRow({
  rdv, name, phone, onConfirm, onCancel, onReporter,
}: {
  rdv: BackendRendezVous
  name: string
  phone: string
  onConfirm: () => void
  onCancel: () => void
  onReporter: () => void
}) {
  const time = new Date(rdv.date_heure_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const isPending = rdv.statut_rdv === 'en_attente' || rdv.statut_rdv === 'en_attente_paiement'

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors flex-wrap gap-3">
      <div className="flex items-center gap-4">
        <div className="text-center min-w-[60px]">
          <p className="text-lg font-bold">{time}</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                {name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
              </AvatarFallback>
            </Avatar>
            <p className="font-medium">{name}</p>
            <Badge className={`text-xs ${statutRdvBadgeClass(rdv.statut_rdv)}`}>
              {statutRdvLabels[rdv.statut_rdv]}
            </Badge>
          </div>
          {rdv.motif && <p className="text-sm text-muted-foreground mt-0.5">{rdv.motif}</p>}
          {phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Phone className="h-3 w-3" />{phone}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPending && (
          <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={onConfirm}>
            <Check className="mr-1 h-3.5 w-3.5" />Confirmer
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onReporter}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />Reporter
        </Button>
        {rdv.statut_rdv !== 'annule' && rdv.statut_rdv !== 'honore' && (
          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={onCancel}>
            <X className="mr-1 h-3.5 w-3.5" />Annuler
          </Button>
        )}
      </div>
    </div>
  )
}
