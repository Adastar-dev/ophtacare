"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Search, Eye, Loader2, Printer } from "lucide-react"
import { getPrescriptions } from "@/lib/services"
import type { BackendPrescription } from "@/lib/types"
import { PrescriptionCanvas, printPrescription } from "@/components/prescription/prescription-canvas"

function patientNameOf(p: BackendPrescription): string {
  const pat = p.consultation?.patient
  return pat ? `${pat.prenom ?? ""} ${pat.nom ?? ""}`.trim() : `Patient #${p.consultation?.patient_id ?? "?"}`
}

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<BackendPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<BackendPrescription | null>(null)

  useEffect(() => {
    getPrescriptions().then(setPrescriptions).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = prescriptions.filter((p) =>
    String(p.id).includes(search) ||
    (p.type_verre ?? "").toLowerCase().includes(search.toLowerCase()) ||
    patientNameOf(p).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ordonnances</h1>
        <p className="text-muted-foreground mt-1">{prescriptions.length} prescriptions émises</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ordonnance #{selected.id}</DialogTitle>
              <DialogDescription>Aperçu de l'ordonnance — prête à imprimer</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => printPrescription(selected, patientNameOf(selected))}>
                <Printer className="mr-2 h-4 w-4" />Imprimer
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              <PrescriptionCanvas prescription={selected} patientName={patientNameOf(selected)} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Liste des ordonnances</CardTitle>
          <CardDescription>Historique des prescriptions optiques</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type de verre</TableHead>
                  <TableHead>Teinte</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">#{p.id}</TableCell>
                    <TableCell className="text-sm">{patientNameOf(p)}</TableCell>
                    <TableCell><Badge variant="secondary">{p.type_verre}</Badge></TableCell>
                    <TableCell className="text-sm">{p.type_teinte}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(p)} title="Aperçu / Imprimer">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(p); setTimeout(() => printPrescription(p, patientNameOf(p)), 50) }} title="Imprimer">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">Aucune ordonnance trouvée.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
