"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Eye, Stethoscope, FileText, Loader2, Plus, User } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { getConsultations, getPatients } from '@/lib/services'
import type { BackendConsultation, BackendPatient } from '@/lib/types'

export default function ConsultationsPage() {
  const router = useRouter()
  const [consultations, setConsultations] = useState<BackendConsultation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<BackendConsultation | null>(null)

  // Patient picker
  const [pickerOpen, setPickerOpen] = useState(false)
  const [patients, setPatients] = useState<BackendPatient[]>([])
  const [patientSearch, setPatientSearch] = useState('')
  const [loadingPatients, setLoadingPatients] = useState(false)

  useEffect(() => {
    getConsultations().then(setConsultations).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const openPicker = () => {
    setPickerOpen(true)
    setPatientSearch('')
    if (patients.length === 0) {
      setLoadingPatients(true)
      getPatients().then(setPatients).catch(() => {}).finally(() => setLoadingPatients(false))
    }
  }

  const pickPatient = (p: BackendPatient) => {
    setPickerOpen(false)
    router.push(`/dashboard/doctor/consultations/new?patient_id=${p.id}`)
  }

  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase()
    return `${p.prenom} ${p.nom}`.toLowerCase().includes(q) || p.telephone.includes(q) || p.code_patient.toLowerCase().includes(q)
  })

  const patientName = (c: BackendConsultation) =>
    c.patient ? `${c.patient.prenom} ${c.patient.nom}` : `Patient #${c.patient_id}`
  const patientInitials = (c: BackendConsultation) =>
    c.patient ? `${c.patient.prenom?.[0] ?? ''}${c.patient.nom?.[0] ?? ''}` : `P${c.patient_id}`

  const filtered = consultations.filter((c) =>
    patientName(c).toLowerCase().includes(search.toLowerCase()) ||
    (c.diagnostic ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultations</h1>
          <p className="text-muted-foreground mt-1">{consultations.length} consultations enregistrées</p>
        </div>
        <Button onClick={openPicker}><Plus className="mr-2 h-4 w-4" />Nouvelle</Button>
      </div>

      {/* Dialog sélecteur patient */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Choisir un patient</DialogTitle>
            <DialogDescription>Sélectionnez le patient pour cette nouvelle consultation.</DialogDescription>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, téléphone, code…"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="space-y-1.5 max-h-[340px] overflow-y-auto">
            {loadingPatients ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : filteredPatients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Aucun patient trouvé.</p>
            ) : (
              filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickPatient(p)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {(p.prenom?.[0] ?? '?')}{p.nom?.[0] ?? ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-muted-foreground">{p.code_patient} · {p.telephone}</p>
                  </div>
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Stethoscope className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucune consultation trouvée</p>
              </div>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  selected?.id === c.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{patientInitials(c)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{patientName(c)}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.diagnostic ?? 'Pas de diagnostic'}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </button>
            ))}
          </div>

          {/* Panneau détail */}
          <div>
            {selected ? (
              <Card className="sticky top-20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">{patientInitials(selected)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{patientName(selected)}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {selected.created_at ? new Date(selected.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selected.diagnostic && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Diagnostic</p>
                      <p className="text-sm">{selected.diagnostic}</p>
                    </div>
                  )}
                  {selected.observations_cliniques && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Observations</p>
                      <p className="text-sm">{selected.observations_cliniques}</p>
                    </div>
                  )}
                  {(selected.vl_od_sans_correction || selected.vl_og_sans_correction) && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Acuité visuelle (sc)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-secondary rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">OD</p>
                          <p className="text-lg font-bold text-primary">{selected.vl_od_sans_correction ?? '—'}</p>
                        </div>
                        <div className="bg-secondary rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">OG</p>
                          <p className="text-lg font-bold text-primary">{selected.vl_og_sans_correction ?? '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/dashboard/doctor/consultations/${selected.id}`}><Eye className="mr-1.5 h-3.5 w-3.5" />Voir</Link>
                    </Button>
                    {selected.prescription ? (
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/dashboard/doctor/prescriptions`}><FileText className="mr-1.5 h-3.5 w-3.5" />Ordonnance</Link>
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/dashboard/doctor/consultations/${selected.id}`}><FileText className="mr-1.5 h-3.5 w-3.5" />Rédiger</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-56 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl p-8">
                <Stethoscope className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm font-medium">Sélectionnez une consultation</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
