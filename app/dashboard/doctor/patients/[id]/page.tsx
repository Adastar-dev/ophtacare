"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft, User, Calendar, Phone, Mail, Eye, Glasses, Activity,
  FileText, Shield, Loader2, AlertCircle, Plus,
} from 'lucide-react'
import Link from 'next/link'
import { getPatient, getConsultations } from '@/lib/services'
import { ApiError } from '@/lib/api'
import type { BackendPatient, BackendConsultation } from '@/lib/types'

export default function DoctorPatientRecordPage() {
  const params = useParams()
  const id = params?.id as string

  const [patient, setPatient] = useState<BackendPatient | null>(null)
  const [consultations, setConsultations] = useState<BackendConsultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      getPatient(id),
      getConsultations({ patient_id: id }),
    ])
      .then(([p, c]) => { setPatient(p); setConsultations(c) })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Impossible de charger le dossier.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error || 'Patient introuvable.'}
        </div>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/doctor/patients"><ArrowLeft className="mr-2 h-4 w-4" />Retour</Link>
        </Button>
      </div>
    )
  }

  const calcAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
  }

  const lastConsultation = consultations[0] ?? null
  const lastPrescription = lastConsultation?.prescription ?? null

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/doctor/patients"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dossier médical</h1>
          <p className="text-muted-foreground">Vue complète du patient</p>
        </div>
        <div className="ml-auto">
          <Button asChild>
            <Link href={`/dashboard/doctor/consultations/new?patient_id=${patient.id}`}>
              <Plus className="mr-2 h-4 w-4" />Nouvelle consultation
            </Link>
          </Button>
        </div>
      </div>

      {/* Carte identité patient */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {(patient.prenom?.[0] ?? '?')}{patient.nom?.[0] ?? ''}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h2 className="text-xl font-bold">{patient.prenom} {patient.nom}</h2>
                <Badge variant="outline">{patient.code_patient}</Badge>
                {patient.assureur && (
                  <Badge className="bg-blue-500/10 text-blue-600">
                    <Shield className="mr-1 h-3 w-3" />{patient.assureur}
                    {patient.taux_couverture != null ? ` — ${patient.taux_couverture}%` : ''}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {patient.date_naissance && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{calcAge(patient.date_naissance)} ans — {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{patient.telephone}</span>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {(patient.allergies || patient.antecedents_medicaux) && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {patient.allergies && (
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="font-semibold text-destructive mb-1 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> Allergies
                    </p>
                    <p className="text-sm">{patient.allergies}</p>
                  </div>
                )}
                {patient.antecedents_medicaux && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="font-semibold mb-1">Antécédents médicaux</p>
                    <p className="text-sm text-muted-foreground">{patient.antecedents_medicaux}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs consultations */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Résumé</TabsTrigger>
          <TabsTrigger value="history">Historique ({consultations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {lastConsultation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="h-4 w-4 text-primary" /> Dernier examen
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {lastConsultation.created_at ? new Date(lastConsultation.created_at).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Acuité visuelle sans correction</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-secondary rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">OD</p>
                        <p className="text-lg font-bold text-primary">{lastConsultation.vl_od_sans_correction ?? '—'}</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">OG</p>
                        <p className="text-lg font-bold text-primary">{lastConsultation.vl_og_sans_correction ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                  {(lastConsultation.ref_od_sphere || lastConsultation.ref_og_sphere) && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Réfraction</p>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-muted-foreground text-xs">
                              <th className="text-left pb-1"></th>
                              <th className="text-center pb-1">Sph</th>
                              <th className="text-center pb-1">Cyl</th>
                              <th className="text-center pb-1">Axe</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="font-medium pr-3 text-xs">OD</td>
                              <td className="text-center text-xs">{lastConsultation.ref_od_sphere ?? '—'}</td>
                              <td className="text-center text-xs">{lastConsultation.ref_od_cylindre ?? '—'}</td>
                              <td className="text-center text-xs">{lastConsultation.ref_od_axe ? `${lastConsultation.ref_od_axe}°` : '—'}</td>
                            </tr>
                            <tr>
                              <td className="font-medium pr-3 text-xs">OG</td>
                              <td className="text-center text-xs">{lastConsultation.ref_og_sphere ?? '—'}</td>
                              <td className="text-center text-xs">{lastConsultation.ref_og_cylindre ?? '—'}</td>
                              <td className="text-center text-xs">{lastConsultation.ref_og_axe ? `${lastConsultation.ref_og_axe}°` : '—'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-primary" /> Diagnostic
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-medium">{lastConsultation.diagnostic ?? 'Non renseigné'}</p>
                  {lastConsultation.observations_cliniques && (
                    <p className="text-sm text-muted-foreground">{lastConsultation.observations_cliniques}</p>
                  )}
                  {lastConsultation.medecin && (
                    <p className="text-sm text-muted-foreground">Dr. {lastConsultation.medecin.name}</p>
                  )}
                  {lastPrescription && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2">
                        <Glasses className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          Ordonnance : {lastPrescription.type_verre}
                          {lastPrescription.type_teinte ? ` — ${lastPrescription.type_teinte}` : ''}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Aucune consultation enregistrée pour ce patient.</p>
                <Button className="mt-4" asChild>
                  <Link href={`/dashboard/doctor/consultations/new?patient_id=${patient.id}`}>
                    <Plus className="mr-2 h-4 w-4" />Créer la première consultation
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {consultations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>Aucune consultation dans l&apos;historique.</p>
              </CardContent>
            </Card>
          ) : (
            consultations.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center p-3 bg-secondary rounded-lg min-w-[72px]">
                      <p className="text-xl font-bold">
                        {c.created_at ? new Date(c.created_at).getDate() : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-medium text-sm">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Consultation'}
                        </span>
                        {c.medecin && <Badge variant="outline" className="text-xs">Dr. {c.medecin.name}</Badge>}
                        {c.prescription && <Badge className="bg-blue-500/10 text-blue-600 text-xs">Ordonnance</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {c.diagnostic ?? 'Aucun diagnostic renseigné'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/doctor/consultations/${c.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
