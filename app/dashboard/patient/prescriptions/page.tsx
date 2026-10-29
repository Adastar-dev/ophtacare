"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { FileText, Glasses, Loader2, Eye, Printer } from 'lucide-react'
import { getPrescriptions } from '@/lib/services'
import type { BackendPrescription } from '@/lib/types'
import { PrescriptionCanvas, printPrescription } from '@/components/prescription/prescription-canvas'

export default function PatientPrescriptionsPage() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState<BackendPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<BackendPrescription | null>(null)

  useEffect(() => {
    getPrescriptions()
      .then(setPrescriptions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Mes Ordonnances</h1>
        <p className="text-muted-foreground mt-1">
          Consultez vos prescriptions optiques ({prescriptions.length})
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : prescriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Aucune ordonnance enregistrée pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Glasses className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Ordonnance #{p.id}</CardTitle>
                      <CardDescription>
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString('fr-FR')
                          : '—'}
                        {' · '}Consultation #{p.consultation_id}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{p.type_verre}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Type de verre</p>
                    <p className="font-medium">{p.type_verre}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Teinte</p>
                    <p className="font-medium">{p.type_teinte || '—'}</p>
                  </div>
                  {p.qr_token && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Token QR</p>
                      <p className="font-mono text-xs truncate">{p.qr_token}</p>
                    </div>
                  )}
                </div>
                {(p.oeil_droit_add || p.oeil_gauche_add) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">Addition OD</p>
                        <p className="font-medium">{p.oeil_droit_add ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">Addition OG</p>
                        <p className="font-medium">{p.oeil_gauche_add ?? '—'}</p>
                      </div>
                    </div>
                  </>
                )}
                {p.remarques && (
                  <>
                    <Separator />
                    <p className="text-sm text-muted-foreground">{p.remarques}</p>
                  </>
                )}
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelected(p)}>
                    <Eye className="mr-2 h-4 w-4" />Voir l'ordonnance
                  </Button>
                  <Button size="sm" onClick={() => { setSelected(p); setTimeout(() => printPrescription(p), 50) }}>
                    <Printer className="mr-2 h-4 w-4" />Imprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ordonnance #{selected.id}</DialogTitle>
              <DialogDescription>Aperçu — prête à imprimer ou à présenter chez l'opticien</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => printPrescription(selected)}>
                <Printer className="mr-2 h-4 w-4" />Imprimer
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              <PrescriptionCanvas prescription={selected} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
