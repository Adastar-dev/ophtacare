"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, Save, FileText, Eye, Glasses, Activity, User, Calendar, AlertCircle, Loader2, CheckCircle2, ScanEye,
} from 'lucide-react'
import Link from 'next/link'
import {
  getRendezVousDetail, getConsultations, createConsultation, createPrescription, getPatient,
} from '@/lib/services'
import { ApiError } from '@/lib/api'
import type { BackendRendezVous, BackendConsultation, BackendPatient } from '@/lib/types'

export default function NewConsultationPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()

  const rdvId = searchParams.get('rdv_id')
  const patientId = searchParams.get('patient_id')

  const [rdv, setRdv] = useState<BackendRendezVous | null>(null)
  const [patient, setPatient] = useState<BackendPatient | null>(null)
  const [antecedents, setAntecedents] = useState<BackendConsultation[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [activeTab, setActiveTab] = useState('exam')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [done, setDone] = useState(false)
  const [createdConsultationId, setCreatedConsultationId] = useState<number | null>(null)

  const [examData, setExamData] = useState({
    rightEyeUncorrected: '', leftEyeUncorrected: '',
    rightEyeCorrected: '', leftEyeCorrected: '',
    rightSphere: '', rightCylinder: '', rightAxis: '',
    leftSphere: '', leftCylinder: '', leftAxis: '',
    slitLampExam: '', fundusExam: '',
    diagnosis: '', notes: '',
    withPrescription: false,
    prescriptionTypeVerre: '', prescriptionTypeTeinte: '',
    prescriptionODAdd: '', prescriptionOGAdd: '', prescriptionRemarques: '',
  })

  const set = (field: string, value: string | boolean) =>
    setExamData(prev => ({ ...prev, [field]: value }))

  const load = useCallback(async () => {
    setLoadingData(true); setLoadError('')
    try {
      let resolvedRdv: BackendRendezVous | null = null
      let resolvedPatient: BackendPatient | null = null

      if (rdvId) {
        resolvedRdv = await getRendezVousDetail(rdvId)
        resolvedPatient = resolvedRdv.patient ?? null
      }

      // Si on n'a pas encore le patient (cas : accès direct via patient_id), on le charge
      if (!resolvedPatient && patientId) {
        resolvedPatient = await getPatient(patientId)
      }

      const pid = resolvedPatient?.id ?? (patientId ? Number(patientId) : null)
      if (pid) {
        const consultations = await getConsultations({ patient_id: String(pid) })
        setAntecedents(consultations)
      }

      setRdv(resolvedRdv)
      setPatient(resolvedPatient)
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Impossible de charger les données.')
    } finally {
      setLoadingData(false)
    }
  }, [rdvId, patientId])

  useEffect(() => { load() }, [load])

  if (!user) return null

  const calcAge = (dob?: string | null) => {
    if (!dob) return null
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
  }

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      const consultationPayload: Record<string, any> = {
        rendez_vous_id: rdv?.id ?? null,
        patient_id: patient?.id ?? (patientId ? Number(patientId) : null),
        diagnostic: examData.diagnosis || null,
        observations_cliniques: examData.notes || null,
        vl_od_sans_correction: examData.rightEyeUncorrected || null,
        vl_og_sans_correction: examData.leftEyeUncorrected || null,
        ref_od_sphere: examData.rightSphere || null,
        ref_od_cylindre: examData.rightCylinder || null,
        ref_od_axe: examData.rightAxis || null,
        ref_og_sphere: examData.leftSphere || null,
        ref_og_cylindre: examData.leftCylinder || null,
        ref_og_axe: examData.leftAxis || null,
      }

      let consultationId = createdConsultationId
      if (!consultationId) {
        const result = await createConsultation(consultationPayload)
        consultationId = result.consultation.id
        setCreatedConsultationId(consultationId)
      }

      if (examData.withPrescription && examData.prescriptionTypeVerre) {
        await createPrescription({
          consultation_id: consultationId,
          type_verre: examData.prescriptionTypeVerre,
          type_teinte: examData.prescriptionTypeTeinte || null,
          oeil_droit_add: examData.prescriptionODAdd || null,
          oeil_gauche_add: examData.prescriptionOGAdd || null,
          remarques: examData.prescriptionRemarques || null,
        })
      }

      setDone(true)
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.data?.error || (err.data?.errors ? JSON.stringify(err.data.errors) : '')
        setSaveError(detail ? `${err.message} — ${detail}` : err.message)
      } else {
        setSaveError('Erreur lors de la sauvegarde.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" />{loadError}
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="p-8 max-w-md mx-auto mt-12 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-xl font-bold">Consultation enregistrée</h2>
        <p className="text-muted-foreground text-sm">
          {examData.withPrescription ? "L'ordonnance a été créée." : "Aucune ordonnance émise."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild><Link href="/dashboard/doctor">Tableau de bord</Link></Button>
          <Button asChild><Link href="/dashboard/doctor/consultations">Voir les consultations</Link></Button>
        </div>
      </div>
    )
  }

  const lastAntecedent = antecedents[0] ?? null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/doctor"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nouvelle consultation</h1>
            <p className="text-muted-foreground">
              {rdv
                ? `RDV du ${new Date(rdv.date_heure_rdv).toLocaleDateString('fr-FR')}`
                : 'Examen ophtalmologique'}
            </p>
          </div>
        </div>
        <Badge className="bg-green-500/10 text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          En consultation
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar patient */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {patient
                      ? `${patient.prenom?.[0] ?? '?'}${patient.nom?.[0] ?? ''}`
                      : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {patient
                      ? `${patient.prenom} ${patient.nom}`
                      : `Patient #${patientId ?? rdv?.patient_id}`}
                  </CardTitle>
                  {patient?.date_naissance && (
                    <CardDescription>{calcAge(patient.date_naissance)} ans</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {patient?.code_patient && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{patient.code_patient}</span>
                </div>
              )}
              {patient?.date_naissance && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Né(e) le {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
              {patient?.telephone && (
                <div className="text-muted-foreground text-xs">{patient.telephone}</div>
              )}
              {rdv?.motif && (
                <div className="text-xs text-muted-foreground border-t border-border/50 pt-2 mt-1">
                  <span className="font-medium">Motif : </span>{rdv.motif}
                </div>
              )}
            </CardContent>
          </Card>

          {patient?.allergies && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-sm text-destructive">Allergies</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs">{patient.allergies}</p>
              </CardContent>
            </Card>
          )}

          {patient?.antecedents_medicaux && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Antécédents médicaux</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{patient.antecedents_medicaux}</p>
              </CardContent>
            </Card>
          )}

          {lastAntecedent && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Glasses className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm">Dernière consultation</CardTitle>
                </div>
                {lastAntecedent.created_at && (
                  <CardDescription className="text-xs">
                    {new Date(lastAntecedent.created_at).toLocaleDateString('fr-FR')}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                {lastAntecedent.ref_od_sphere && (
                  <>
                    <div className="grid grid-cols-4 gap-1 text-center font-medium text-muted-foreground">
                      <span></span><span>Sph</span><span>Cyl</span><span>Axe</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center">
                      <span className="font-medium">OD</span>
                      <span>{lastAntecedent.ref_od_sphere}</span>
                      <span>{lastAntecedent.ref_od_cylindre ?? '—'}</span>
                      <span>{lastAntecedent.ref_od_axe ? `${lastAntecedent.ref_od_axe}°` : '—'}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center">
                      <span className="font-medium">OG</span>
                      <span>{lastAntecedent.ref_og_sphere}</span>
                      <span>{lastAntecedent.ref_og_cylindre ?? '—'}</span>
                      <span>{lastAntecedent.ref_og_axe ? `${lastAntecedent.ref_og_axe}°` : '—'}</span>
                    </div>
                  </>
                )}
                {lastAntecedent.diagnostic && (
                  <p className="text-muted-foreground mt-1 border-t border-border/50 pt-1">
                    {lastAntecedent.diagnostic}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {antecedents.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Historique ({antecedents.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {antecedents.slice(0, 4).map((c) => (
                  <div key={c.id} className="text-xs border-l-2 border-primary/30 pl-3">
                    <p className="text-muted-foreground">{c.diagnostic ?? 'Sans diagnostic'}</p>
                    <p className="text-muted-foreground/70">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : ''}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Zone principale */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="exam"><Eye className="mr-2 h-4 w-4" />Examen</TabsTrigger>
                  <TabsTrigger value="refraction"><Glasses className="mr-2 h-4 w-4" />Réfraction</TabsTrigger>
                  <TabsTrigger value="tests"><Activity className="mr-2 h-4 w-4" />Tests</TabsTrigger>
                  <TabsTrigger value="prescription"><FileText className="mr-2 h-4 w-4" />Prescription</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="exam" className="mt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Acuité visuelle</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Oeil Droit (OD)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Sans correction</Label>
                            <Input placeholder="ex: 8/10" value={examData.rightEyeUncorrected} onChange={(e) => set('rightEyeUncorrected', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Avec correction</Label>
                            <Input placeholder="ex: 10/10" value={examData.rightEyeCorrected} onChange={(e) => set('rightEyeCorrected', e.target.value)} />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Oeil Gauche (OG)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Sans correction</Label>
                            <Input placeholder="ex: 7/10" value={examData.leftEyeUncorrected} onChange={(e) => set('leftEyeUncorrected', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Avec correction</Label>
                            <Input placeholder="ex: 10/10" value={examData.leftEyeCorrected} onChange={(e) => set('leftEyeCorrected', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="refraction" className="mt-0 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Réfraction objective/subjective</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="text-sm font-medium">Oeil Droit (OD)</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2"><Label>Sphère</Label><Input placeholder="-1.25" value={examData.rightSphere} onChange={(e) => set('rightSphere', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Cylindre</Label><Input placeholder="-0.50" value={examData.rightCylinder} onChange={(e) => set('rightCylinder', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Axe (°)</Label><Input type="number" placeholder="90" value={examData.rightAxis} onChange={(e) => set('rightAxis', e.target.value)} /></div>
                        </div>
                      </div>
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="text-sm font-medium">Oeil Gauche (OG)</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2"><Label>Sphère</Label><Input placeholder="-1.00" value={examData.leftSphere} onChange={(e) => set('leftSphere', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Cylindre</Label><Input placeholder="-0.25" value={examData.leftCylinder} onChange={(e) => set('leftCylinder', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Axe (°)</Label><Input type="number" placeholder="85" value={examData.leftAxis} onChange={(e) => set('leftAxis', e.target.value)} /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tests" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Examen à la lampe à fente</Label>
                    <Textarea placeholder="Cornée claire, chambre antérieure calme..." value={examData.slitLampExam} onChange={(e) => set('slitLampExam', e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fond d&apos;œil</Label>
                    <Textarea placeholder="Papille bien limitée, rapport C/D normal..." value={examData.fundusExam} onChange={(e) => set('fundusExam', e.target.value)} rows={4} />
                  </div>
                </TabsContent>

                <TabsContent value="prescription" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Diagnostic</Label>
                    <Textarea placeholder="Myopie légère bilatérale avec astigmatisme..." value={examData.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes complémentaires</Label>
                    <Textarea placeholder="Recommandations, suivi prévu..." value={examData.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/3">
                    <Glasses className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Ordonnance optique</p>
                      <p className="text-xs text-muted-foreground">Prescription de verres correcteurs</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={examData.withPrescription ? "default" : "outline"}
                      onClick={() => set('withPrescription', !examData.withPrescription)}
                    >
                      {examData.withPrescription ? "Incluse ✓" : "Ajouter"}
                    </Button>
                  </div>

                  {examData.withPrescription && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type de verre</Label>
                          <Select value={examData.prescriptionTypeVerre} onValueChange={(v) => set('prescriptionTypeVerre', v)}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unifocal">Unifocal</SelectItem>
                              <SelectItem value="progressif">Progressif</SelectItem>
                              <SelectItem value="bifocal">Bifocal</SelectItem>
                              <SelectItem value="lentilles">Lentilles</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Teinte</Label>
                          <Select value={examData.prescriptionTypeTeinte} onValueChange={(v) => set('prescriptionTypeTeinte', v)}>
                            <SelectTrigger><SelectValue placeholder="Aucune teinte" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blanc">Blanc</SelectItem>
                              <SelectItem value="photochromique">Photochromique</SelectItem>
                              <SelectItem value="solaire">Solaire</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Addition OD</Label>
                          <Input placeholder="+1.50" value={examData.prescriptionODAdd} onChange={(e) => set('prescriptionODAdd', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Addition OG</Label>
                          <Input placeholder="+1.50" value={examData.prescriptionOGAdd} onChange={(e) => set('prescriptionOGAdd', e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Remarques</Label>
                        <Textarea placeholder="Instructions supplémentaires..." value={examData.prescriptionRemarques} onChange={(e) => set('prescriptionRemarques', e.target.value)} rows={2} />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {saveError && (
                <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />{saveError}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3 mt-6 pt-6 border-t">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/doctor">Annuler</Link>
                </Button>
                <Button
                  type="button"
                  variant={examData.withPrescription ? "default" : "outline"}
                  onClick={() => { set('withPrescription', !examData.withPrescription); setActiveTab('prescription') }}
                  className={examData.withPrescription ? "" : "border-primary/50 text-primary hover:bg-primary/5"}
                >
                  <Glasses className="mr-2 h-4 w-4" />
                  {examData.withPrescription ? "Ordonnance ✓" : "Émettre ordonnance"}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</>
                    : <><Save className="mr-2 h-4 w-4" />Terminer la consultation</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
