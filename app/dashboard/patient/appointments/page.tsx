"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Clock, Plus, X, Loader2, ShieldCheck, Smartphone, CheckCircle2, RefreshCw, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { getRendezVous, cancelRendezVous, updateRendezVous, formatMontant } from '@/lib/services'
import { ApiError } from '@/lib/api'
import { MobilePaymentDialog } from '@/components/payment/mobile-payment-dialog'
import { statutRdvLabels, statutRdvBadgeClass, statutPaiementLabels, formatDateHeure } from '@/lib/rdv-helpers'
import type { BackendRendezVous } from '@/lib/types'

export default function PatientAppointmentsPage() {
  const [rdvs, setRdvs] = useState<BackendRendezVous[]>([])
  const [loading, setLoading] = useState(true)
  const [payRdv, setPayRdv] = useState<BackendRendezVous | null>(null)
  const [payOpen, setPayOpen] = useState(false)

  // Reprogrammation
  const [rescheduleRdv, setRescheduleRdv] = useState<BackendRendezVous | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleHeure, setRescheduleHeure] = useState('')
  const [rescheduleSaving, setRescheduleSaving] = useState(false)
  const [rescheduleError, setRescheduleError] = useState('')

  const load = () => {
    setLoading(true)
    getRendezVous()
      .then(setRdvs)
      .catch(() => setRdvs([]))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const now = new Date()
  const upcoming = rdvs.filter((r) => new Date(r.date_heure_rdv) >= now && r.statut_rdv !== 'annule' && r.statut_rdv !== 'honore' && r.statut_rdv !== 'expire')
  const past = rdvs.filter((r) => new Date(r.date_heure_rdv) < now || r.statut_rdv === 'annule' || r.statut_rdv === 'honore' || r.statut_rdv === 'expire')

  const handleCancel = async (id: number) => {
    await cancelRendezVous(id).catch(() => {})
    load()
  }

  const handleValidateDate = async (rdv: BackendRendezVous) => {
    try {
      await updateRendezVous(rdv.id, { statut_rdv: 'confirme' })
      load()
    } catch { /* silently handled */ }
  }

  const openReschedule = (rdv: BackendRendezVous) => {
    setRescheduleRdv(rdv)
    setRescheduleDate(new Date(rdv.date_heure_rdv).toLocaleDateString('fr-CA'))
    setRescheduleHeure(new Date(rdv.date_heure_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    setRescheduleError('')
  }

  const submitReschedule = async () => {
    if (!rescheduleRdv || !rescheduleDate || !rescheduleHeure) return
    setRescheduleSaving(true); setRescheduleError('')
    try {
      await updateRendezVous(rescheduleRdv.id, {
        date_heure_rdv: `${rescheduleDate}T${rescheduleHeure}:00`,
        statut_rdv: 'en_attente',
      })
      setRescheduleRdv(null)
      load()
    } catch (e) {
      setRescheduleError(e instanceof ApiError ? e.message : 'Impossible de modifier la date.')
    } finally {
      setRescheduleSaving(false)
    }
  }

  const openPay = (rdv: BackendRendezVous) => { setPayRdv(rdv); setPayOpen(true) }

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes Rendez-vous</h1>
          <p className="text-muted-foreground mt-1">Gérez vos rendez-vous ophtalmologiques</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/patient/book"><Plus className="mr-2 h-4 w-4" /> Prendre rendez-vous</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">À venir ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Historique ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <Card><CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Aucun rendez-vous à venir</p>
              <Button className="mt-4" asChild><Link href="/dashboard/patient/book">Prendre rendez-vous</Link></Button>
            </CardContent></Card>
          ) : (
            upcoming.map((rdv) => (
              <RdvCard
                key={rdv.id}
                rdv={rdv}
                onCancel={handleCancel}
                onPay={openPay}
                onValidateDate={handleValidateDate}
                onReschedule={openReschedule}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {past.length === 0 ? (
            <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">Aucun historique</p></CardContent></Card>
          ) : (
            past.map((rdv) => <RdvCard key={rdv.id} rdv={rdv} past />)
          )}
        </TabsContent>
      </Tabs>

      <MobilePaymentDialog rdv={payRdv} open={payOpen} onOpenChange={setPayOpen} onPaid={load} />

      {/* Dialog reprogrammation */}
      <Dialog open={!!rescheduleRdv} onOpenChange={(o) => { if (!o && !rescheduleSaving) setRescheduleRdv(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reprogrammer le rendez-vous</DialogTitle>
            <DialogDescription>Choisissez une nouvelle date et heure. La demande sera soumise à validation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nouvelle date</Label>
              <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} min={new Date().toLocaleDateString('fr-CA')} />
            </div>
            <div className="space-y-1.5">
              <Label>Nouvelle heure</Label>
              <Input type="time" value={rescheduleHeure} onChange={(e) => setRescheduleHeure(e.target.value)} />
            </div>
            {rescheduleError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />{rescheduleError}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRescheduleRdv(null)}>Annuler</Button>
            <Button onClick={submitReschedule} disabled={rescheduleSaving || !rescheduleDate}>
              {rescheduleSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi…</> : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RdvCard({
  rdv, onCancel, onPay, onValidateDate, onReschedule, past,
}: {
  rdv: BackendRendezVous
  onCancel?: (id: number) => void
  onPay?: (rdv: BackendRendezVous) => void
  onValidateDate?: (rdv: BackendRendezVous) => void
  onReschedule?: (rdv: BackendRendezVous) => void
  past?: boolean
}) {
  const { date, heure } = formatDateHeure(rdv.date_heure_rdv)
  const d = new Date(rdv.date_heure_rdv)
  const needsPayment = rdv.statut_paiement === 'non_paye' || rdv.statut_paiement === 'acompte_verse'
  const isInsurance = rdv.statut_paiement === 'pris_en_charge'
  const hasDeposit = rdv.statut_paiement === 'acompte_verse'
  // RDV modifié par secrétaire = statut en_attente + acompte versé (ou note secrétaire)
  const isSecrModified = rdv.statut_rdv === 'en_attente' && hasDeposit

  return (
    <Card className={past ? 'opacity-80' : ''}>
      <CardContent className="pt-6">
        {isSecrModified && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700">Rendez-vous modifié par la secrétaire</p>
              <p className="text-amber-600 text-xs mt-0.5">Vous pouvez valider la nouvelle date ou en proposer une autre.</p>
            </div>
          </div>
        )}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex gap-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg min-w-[90px]">
              <p className="text-2xl font-bold text-primary">{d.getDate()}</p>
              <p className="text-sm text-muted-foreground">{d.toLocaleDateString('fr-FR', { month: 'short' })}</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="font-semibold text-lg">{rdv.motif || 'Consultation'}</h3>
                <Badge className={statutRdvBadgeClass(rdv.statut_rdv)}>{statutRdvLabels[rdv.statut_rdv]}</Badge>
                {isInsurance && (
                  <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                    <ShieldCheck className="h-3 w-3" /> Assurance
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {heure}</span>
                <span>{date}</span>
                {rdv.medecin?.name && <span>{rdv.medecin.name}</span>}
              </div>
              <div className="text-sm mt-1">
                <span className="text-muted-foreground">Total : </span>
                <span className="font-medium">{formatMontant(rdv.montant_total)}</span>
                <span className="text-muted-foreground"> · {statutPaiementLabels[rdv.statut_paiement]}</span>
              </div>
            </div>
          </div>
          {!past && (
            <div className="flex flex-wrap gap-2">
              {isSecrModified && onValidateDate && (
                <Button size="sm" variant="default" onClick={() => onValidateDate(rdv)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Valider la date
                </Button>
              )}
              {(isSecrModified || hasDeposit) && onReschedule && (
                <Button size="sm" variant="outline" onClick={() => onReschedule(rdv)}>
                  <RefreshCw className="mr-1 h-4 w-4" /> Reprogrammer
                </Button>
              )}
              {needsPayment && !isSecrModified && onPay && (
                <Button size="sm" onClick={() => onPay(rdv)}>
                  <Smartphone className="mr-1 h-4 w-4" />
                  {rdv.statut_paiement === 'non_paye' ? "Payer l'acompte" : 'Payer le solde'}
                </Button>
              )}
              {onCancel && rdv.statut_rdv !== 'annule' && !isSecrModified && (
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => onCancel(rdv.id)}>
                  <X className="mr-1 h-4 w-4" /> Annuler
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

