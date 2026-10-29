"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, User, BanIcon } from 'lucide-react'
import { getPatient, createRendezVous, getIndisponibilites, type BackendIndisponibilite } from '@/lib/services'
import { ApiError } from '@/lib/api'
import type { BackendPatient } from '@/lib/types'

export default function SecretaryPatientRdvPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = Number(params.id)

  const [patient, setPatient] = useState<BackendPatient | null>(null)
  const [loadingPatient, setLoadingPatient] = useState(true)
  const [indispos, setIndispos] = useState<BackendIndisponibilite[]>([])

  const today = new Date()
  const [date, setDate] = useState(today.toLocaleDateString('fr-CA'))
  const [heure, setHeure] = useState('08:00')
  const [motif, setMotif] = useState('')
  const [montant, setMontant] = useState('15000')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getPatient(patientId)
      .then(setPatient)
      .catch(() => setPatient(null))
      .finally(() => setLoadingPatient(false))
    getIndisponibilites().then(setIndispos).catch(() => {})
  }, [patientId])

  // Conflit hors service pour la date + heure choisies (tous médecins de la clinique).
  const horsServiceConflit = indispos.find((i) => {
    if (i.date !== date) return false
    const hour = Number(heure.split(':')[0])
    return hour >= i.heure_debut && hour < i.heure_fin
  })

  const handleSubmit = async () => {
    if (!date || !heure) return
    if (horsServiceConflit) {
      setError('Ce créneau est marqué hors service. Choisissez un autre horaire.')
      return
    }
    setSaving(true); setError('')
    try {
      await createRendezVous({
        patient_id: patientId,
        date_heure_rdv: `${date}T${heure}:00`,
        motif: motif || undefined,
        montant_total: Number(montant) || 0,
      })
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/secretary'), 1500)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur lors de la création du rendez-vous')
    } finally {
      setSaving(false)
    }
  }

  if (loadingPatient) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nouveau rendez-vous</h1>
          <p className="text-sm text-muted-foreground">Créer un RDV pour le patient sélectionné</p>
        </div>
      </div>

      {patient && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{patient.prenom} {patient.nom}</p>
                <p className="text-sm text-muted-foreground">{patient.telephone}</p>
              </div>
              <Badge variant="outline" className="ml-auto">{patient.code_patient}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détails du rendez-vous</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} min={today.toLocaleDateString('fr-CA')} />
            </div>
            <div className="space-y-1.5">
              <Label>Heure *</Label>
              <Input type="time" value={heure} onChange={e => setHeure(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Motif</Label>
            <Textarea placeholder="Ex: Consultation de suivi…" value={motif} onChange={e => setMotif(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Montant (F CFA)</Label>
            <Input type="number" value={montant} onChange={e => setMontant(e.target.value)} />
          </div>

          {horsServiceConflit && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
              <BanIcon className="h-4 w-4 shrink-0" />
              Créneau hors service{horsServiceConflit.medecin ? ` (${horsServiceConflit.medecin.name})` : ''}{horsServiceConflit.motif ? ` — ${horsServiceConflit.motif}` : ''}.
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4 shrink-0" />Rendez-vous créé avec succès !
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>Annuler</Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={saving || !date || success || !!horsServiceConflit}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création…</> : 'Créer le rendez-vous'}
        </Button>
      </div>
    </div>
  )
}
