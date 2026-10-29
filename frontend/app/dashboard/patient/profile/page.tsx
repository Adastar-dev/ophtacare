"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, User } from "lucide-react"
import { getMyPatient, updateMyPatient } from "@/lib/services"
import { ApiError } from "@/lib/api"
import type { BackendPatient } from "@/lib/types"

export default function PatientProfilePage() {
  const [patient, setPatient] = useState<BackendPatient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    telephone: "", antecedents_medicaux: "", allergies: "",
    assureur: "", numero_assurance: "", taux_couverture: "",
  })

  useEffect(() => {
    getMyPatient()
      .then((p) => {
        setPatient(p)
        setForm({
          telephone: p.telephone || "",
          antecedents_medicaux: p.antecedents_medicaux || "",
          allergies: p.allergies || "",
          assureur: p.assureur || "",
          numero_assurance: p.numero_assurance || "",
          taux_couverture: p.taux_couverture != null ? String(p.taux_couverture) : "",
        })
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(""); setMessage("")
    try {
      const res = await updateMyPatient({
        telephone: form.telephone,
        antecedents_medicaux: form.antecedents_medicaux,
        allergies: form.allergies,
        assureur: form.assureur || null,
        numero_assurance: form.numero_assurance || null,
        taux_couverture: form.taux_couverture ? Number(form.taux_couverture) : null,
      } as any)
      setPatient(res.patient)
      setMessage("Informations enregistrées.")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  const hasAssurance = !!(patient?.assureur && patient?.numero_assurance)

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mon profil & assurance</h1>
        <p className="text-muted-foreground mt-1">
          Renseignez votre assurance pour valider vos rendez-vous sans acompte.
        </p>
      </div>

      {patient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> {patient.prenom} {patient.nom}
            </CardTitle>
            <CardDescription>Code patient : {patient.code_patient}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {(message || error) && (
        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${error ? "text-destructive bg-destructive/10 border-destructive/20" : "text-green-600 bg-green-500/10 border-green-500/20"}`}>
          {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {error || message}
        </div>
      )}

      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coordonnées & santé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Antécédents médicaux</Label>
              <Textarea rows={2} value={form.antecedents_medicaux} onChange={(e) => setForm({ ...form, antecedents_medicaux: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Allergies</Label>
              <Textarea rows={2} value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" /> Prise en charge assurance
              {hasAssurance ? (
                <Badge className="bg-green-500/10 text-green-600 ml-2">Active</Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">Non renseignée</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Avec une assurance valide, vos rendez-vous sont confirmés immédiatement, sans payer l&apos;acompte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Assureur</Label>
              <Input value={form.assureur} onChange={(e) => setForm({ ...form, assureur: e.target.value })} placeholder="Ex: NSIA, IPM, ASKIA..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>N° de police</Label>
                <Input value={form.numero_assurance} onChange={(e) => setForm({ ...form, numero_assurance: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Taux de couverture (%)</Label>
                <Input type="number" min={0} max={100} value={form.taux_couverture} onChange={(e) => setForm({ ...form, taux_couverture: e.target.value })} placeholder="80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  )
}
