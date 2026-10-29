"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft, Eye, Glasses, Activity, User, Calendar, AlertCircle, Loader2, FileText, Stethoscope,
} from 'lucide-react'
import Link from 'next/link'
import { getConsultation } from '@/lib/services'
import { ApiError } from '@/lib/api'
import type { BackendConsultation } from '@/lib/types'

export default function ConsultationDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [consultation, setConsultation] = useState<BackendConsultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const c = await getConsultation(id)
      setConsultation(c)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger la consultation.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { if (id) load() }, [id, load])

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !consultation) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" />{error || 'Consultation introuvable.'}
        </div>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/doctor/consultations"><ArrowLeft className="mr-2 h-4 w-4" />Retour</Link>
        </Button>
      </div>
    )
  }

  const c = consultation
  const patient = c.patient ?? null
  const prescription = c.prescription ?? null

  const calcAge = (dob?: string | null) => {
    if (!dob) return null
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/doctor/consultations"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {c.created_at
              ? new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Consultation'}
          </h1>
          <p className="text-muted-foreground">
            {c.created_at
              ? new Date(c.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : ''}
          </p>
        </div>
        {prescription && (
          <Badge className="ml-auto bg-blue-500/10 text-blue-600">
            <Glasses className="mr-1 h-3 w-3" />Ordonnance émise
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar patient */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {patient ? `${patient.prenom?.[0] ?? '?'}${patient.nom?.[0] ?? ''}` : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {patient ? `${patient.prenom} ${patient.nom}` : `Patient #${c.patient_id}`}
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
                  <User className="h-4 w-4" /><span>{patient.code_patient}</span>
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
              {c.medecin && (
                <div className="flex items-center gap-2 text-muted-foreground border-t border-border/50 pt-2 mt-1">
                  <Stethoscope className="h-4 w-4" /><span>Dr. {c.medecin.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {patient && (
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/dashboard/doctor/patients/${c.patient_id}`}>
                <FileText className="mr-2 h-4 w-4" />Dossier complet
              </Link>
            </Button>
          )}
        </div>

        {/* Zone principale */}
        <div className="lg:col-span-3 space-y-6">
          {/* Acuité visuelle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-primary" />Acuité visuelle (sans correction)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Oeil Droit (OD)</p>
                  <p className="text-2xl font-bold text-primary">{c.vl_od_sans_correction ?? '—'}</p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Oeil Gauche (OG)</p>
                  <p className="text-2xl font-bold text-primary">{c.vl_og_sans_correction ?? '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Réfraction */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Glasses className="h-4 w-4 text-primary" />Réfraction
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    <td className="font-medium pr-4 py-1">OD</td>
                    <td className="text-center">{c.ref_od_sphere ?? '—'}</td>
                    <td className="text-center">{c.ref_od_cylindre ?? '—'}</td>
                    <td className="text-center">{c.ref_od_axe ? `${c.ref_od_axe}°` : '—'}</td>
                  </tr>
                  <tr>
                    <td className="font-medium pr-4 py-1">OG</td>
                    <td className="text-center">{c.ref_og_sphere ?? '—'}</td>
                    <td className="text-center">{c.ref_og_cylindre ?? '—'}</td>
                    <td className="text-center">{c.ref_og_axe ? `${c.ref_og_axe}°` : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Diagnostic */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />Diagnostic & observations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Diagnostic</p>
                <p className="font-medium">{c.diagnostic ?? 'Non renseigné'}</p>
              </div>
              {c.observations_cliniques && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Observations cliniques</p>
                  <p className="text-sm text-muted-foreground">{c.observations_cliniques}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ordonnance */}
          {prescription && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Glasses className="h-4 w-4 text-primary" />Ordonnance optique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Type de verre</p>
                    <p className="font-medium capitalize">{prescription.type_verre ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Teinte</p>
                    <p className="font-medium capitalize">{prescription.type_teinte ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Addition OD</p>
                    <p className="font-medium">{prescription.oeil_droit_add ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Addition OG</p>
                    <p className="font-medium">{prescription.oeil_gauche_add ?? '—'}</p>
                  </div>
                </div>
                {prescription.remarques && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Remarques</p>
                      <p className="text-sm">{prescription.remarques}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
