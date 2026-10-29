"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Eye, FileText, User, Activity, Glasses, Loader2 } from 'lucide-react'
import { getMyPatient, getConsultations } from '@/lib/services'
import type { BackendPatient, BackendConsultation } from '@/lib/types'

export default function PatientMedicalRecordPage() {
  const { user } = useAuth()
  const [patient, setPatient] = useState<BackendPatient | null>(null)
  const [consultations, setConsultations] = useState<BackendConsultation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyPatient(), getConsultations()])
      .then(([p, c]) => { setPatient(p); setConsultations(c) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const lastConsultation = consultations[0] ?? null
  const lastPrescription = lastConsultation?.prescription ?? null

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Mon Dossier Médical</h1>
        <p className="text-muted-foreground mt-1">Historique complet de vos examens ophtalmologiques</p>
      </div>

      {patient && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{patient.prenom} {patient.nom}</h2>
                  <p className="text-sm text-muted-foreground">
                    Né(e) le {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">{patient.code_patient}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary">Résumé</TabsTrigger>
          <TabsTrigger value="history">Historique ({consultations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {lastConsultation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" /> Dernier examen
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {lastConsultation.created_at
                        ? new Date(lastConsultation.created_at).toLocaleDateString('fr-FR')
                        : '—'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Acuité visuelle (sans correction)</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-muted-foreground">Oeil Droit</p>
                        <p className="font-semibold">{lastConsultation.vl_od_sans_correction ?? '—'}</p>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-muted-foreground">Oeil Gauche</p>
                        <p className="font-semibold">{lastConsultation.vl_og_sans_correction ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                  {(lastConsultation.ref_od_sphere || lastConsultation.ref_og_sphere) && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Réfraction</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left pb-2"></th>
                                <th className="text-center pb-2">Sphère</th>
                                <th className="text-center pb-2">Cylindre</th>
                                <th className="text-center pb-2">Axe</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="font-medium pr-4">OD</td>
                                <td className="text-center">{lastConsultation.ref_od_sphere ?? '—'}</td>
                                <td className="text-center">{lastConsultation.ref_od_cylindre ?? '—'}</td>
                                <td className="text-center">{lastConsultation.ref_od_axe ? `${lastConsultation.ref_od_axe}°` : '—'}</td>
                              </tr>
                              <tr>
                                <td className="font-medium pr-4">OG</td>
                                <td className="text-center">{lastConsultation.ref_og_sphere ?? '—'}</td>
                                <td className="text-center">{lastConsultation.ref_og_cylindre ?? '—'}</td>
                                <td className="text-center">{lastConsultation.ref_og_axe ? `${lastConsultation.ref_og_axe}°` : '—'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Diagnostic
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-medium">{lastConsultation.diagnostic ?? 'Non renseigné'}</p>
                  {lastConsultation.observations_cliniques && (
                    <p className="text-sm text-muted-foreground">{lastConsultation.observations_cliniques}</p>
                  )}
                  {lastConsultation.medecin && (
                    <p className="text-sm text-muted-foreground">
                      Dr. {lastConsultation.medecin.name}
                    </p>
                  )}
                  {lastPrescription && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2">
                        <Glasses className="h-4 w-4 text-accent" />
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
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Aucune consultation enregistrée pour le moment.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {consultations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Aucune consultation dans l&apos;historique.</p>
              </CardContent>
            </Card>
          ) : (
            consultations.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="text-center p-3 bg-secondary rounded-lg min-w-[80px]">
                      <p className="text-lg font-bold">
                        {c.created_at ? new Date(c.created_at).getDate() : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                          : ''}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Consultation'}
                        </h3>
                        {c.medecin && (
                          <Badge variant="outline">Dr. {c.medecin.name}</Badge>
                        )}
                        {c.prescription && (
                          <Badge className="bg-blue-500/10 text-blue-600">Ordonnance émise</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {c.diagnostic ?? 'Aucun diagnostic renseigné'}
                      </p>
                    </div>
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
