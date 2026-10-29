"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Loader2, Wallet, CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  ArrowDownCircle, ReceiptText, DollarSign, Plus,
} from "lucide-react"
import {
  getRendezVous, enregistrerPaiementGuichet, formatMontant,
} from "@/lib/services"
import { ApiError } from "@/lib/api"
import { statutPaiementLabels, statutRdvBadgeClass, statutRdvLabels, formatDateHeure } from "@/lib/rdv-helpers"
import type { BackendRendezVous, ModePaiement } from "@/lib/types"

interface SortieArgent {
  id: number
  motif: string
  montant: number
  categorie: string
  date: string
}

const SORTIES_KEY = "caisse_sorties"

function loadSorties(): SortieArgent[] {
  try {
    return JSON.parse(localStorage.getItem(SORTIES_KEY) ?? "[]")
  } catch { return [] }
}
function saveSorties(s: SortieArgent[]) {
  localStorage.setItem(SORTIES_KEY, JSON.stringify(s))
}

export default function CaissierDashboard() {
  const [rdvs, setRdvs] = useState<BackendRendezVous[]>([])
  const [loading, setLoading] = useState(true)

  // Encaissement
  const [selected, setSelected] = useState<BackendRendezVous | null>(null)
  const [montant, setMontant] = useState("")
  const [mode, setMode] = useState<ModePaiement>("liquide")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  // Sorties d'argent
  const [sorties, setSorties] = useState<SortieArgent[]>([])
  const [sortieOpen, setSortieOpen] = useState(false)
  const [sortieMontant, setSortieMontant] = useState("")
  const [sortieMotif, setSortieMotif] = useState("")
  const [sortieCategorie, setSortieCategorie] = useState("materiel")

  const load = () => {
    setLoading(true)
    getRendezVous().then(setRdvs).catch(() => setRdvs([])).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    setSorties(loadSorties())
  }, [])

  const aRegler = rdvs.filter((r) => r.statut_paiement === "non_paye" || r.statut_paiement === "acompte_verse")

  // Calcul stats du jour
  const today = new Date().toLocaleDateString("fr-CA")
  const encaissementsJour = rdvs.filter((r) => {
    if (r.statut_paiement !== "solde" && r.statut_paiement !== "acompte_verse") return false
    const rdvDate = new Date(r.date_heure_rdv).toLocaleDateString("fr-CA")
    return rdvDate === today
  })
  const totalEncaisseJour = encaissementsJour.reduce((sum, r) => sum + Number(r.montant_paye ?? r.montant_total), 0)
  const totalSortiesJour = sorties
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.montant, 0)
  const soldeJour = totalEncaisseJour - totalSortiesJour
  const totalSoldeComplet = rdvs.filter(r => r.statut_paiement === "solde").reduce((sum, r) => sum + Number(r.montant_total), 0)

  const openPay = (rdv: BackendRendezVous) => {
    setSelected(rdv); setError(""); setDone(false)
    const total = Number(rdv.montant_total)
    const acompte = rdv.montant_acompte != null ? Number(rdv.montant_acompte) : Math.ceil(total / 2)
    const resteBackend = rdv.reste_a_payer != null ? Number(rdv.reste_a_payer) : total - acompte
    setMontant(String(rdv.statut_paiement === "acompte_verse" ? resteBackend : acompte))
    setMode("liquide")
  }

  const submit = async () => {
    if (!selected) return
    setSaving(true); setError("")
    try {
      await enregistrerPaiementGuichet({
        rendez_vous_id: selected.id,
        montant: Number(montant),
        mode_paiement: mode,
      })
      setDone(true)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'encaissement")
    } finally {
      setSaving(false)
    }
  }

  const addSortie = () => {
    const m = Number(sortieMontant)
    if (!m || m <= 0 || !sortieMotif.trim()) return
    const nouvelle: SortieArgent = {
      id: Date.now(),
      motif: sortieMotif.trim(),
      montant: m,
      categorie: sortieCategorie,
      date: today,
    }
    const updated = [nouvelle, ...sorties]
    setSorties(updated)
    saveSorties(updated)
    setSortieOpen(false)
    setSortieMontant(""); setSortieMotif(""); setSortieCategorie("materiel")
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord — Caisse</h1>
        <p className="text-muted-foreground mt-1">Encaissements, sorties et état de la caisse</p>
      </div>

      {/* Stats caisse */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <p className="text-xl font-bold text-green-600">{formatMontant(totalEncaisseJour)}</p>}
                <p className="text-xs text-muted-foreground">Encaissés aujourd&apos;hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg"><TrendingDown className="h-5 w-5 text-red-500" /></div>
              <div>
                <p className="text-xl font-bold text-red-500">{formatMontant(totalSortiesJour)}</p>
                <p className="text-xs text-muted-foreground">Sorties aujourd&apos;hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${soldeJour >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                <DollarSign className={`h-5 w-5 ${soldeJour >= 0 ? "text-primary" : "text-destructive"}`} />
              </div>
              <div>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <p className={`text-xl font-bold ${soldeJour >= 0 ? "text-primary" : "text-destructive"}`}>{formatMontant(Math.abs(soldeJour))}</p>}
                <p className="text-xs text-muted-foreground">Solde net du jour</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Wallet className="h-5 w-5 text-amber-600" /></div>
              <div>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <p className="text-xl font-bold text-amber-600">{aRegler.length}</p>}
                <p className="text-xs text-muted-foreground">En attente de paiement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Encaissements en attente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" /> Rendez-vous à régler ({aRegler.length})
            </CardTitle>
            <CardDescription>Les rendez-vous pris en charge par assurance n&apos;apparaissent pas ici.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : aRegler.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Aucun paiement en attente.</p>
            ) : (
              aRegler.map((rdv) => {
                const { date, heure } = formatDateHeure(rdv.date_heure_rdv)
                return (
                  <div key={rdv.id} className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {rdv.patient ? `${rdv.patient.prenom} ${rdv.patient.nom}` : `RDV #${rdv.id}`}
                        </span>
                        <Badge className={statutRdvBadgeClass(rdv.statut_rdv)}>{statutRdvLabels[rdv.statut_rdv]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{date} à {heure}</p>
                      <p className="text-sm">
                        <span className="font-medium">{formatMontant(rdv.montant_total)}</span>
                        <span className="text-muted-foreground"> · {statutPaiementLabels[rdv.statut_paiement]}</span>
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openPay(rdv)}>Encaisser</Button>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Sorties d'argent */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowDownCircle className="h-4 w-4 text-red-500" /> Sorties d&apos;argent
                </CardTitle>
                <CardDescription>Matériel, charges, divers</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSortieOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Déclarer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[420px] overflow-y-auto">
            {sorties.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Aucune sortie déclarée.</p>
            ) : (
              sorties.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.motif}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{s.categorie}</Badge>
                      <span className="text-xs text-muted-foreground">{s.date}</span>
                    </div>
                  </div>
                  <span className="font-semibold text-red-500 shrink-0">{formatMontant(s.montant)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Récap complet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="h-4 w-4 text-primary" /> Récapitulatif financier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Total soldé (global)</p>
              <p className="text-lg font-bold text-green-600">{loading ? "…" : formatMontant(totalSoldeComplet)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Total sorties (global)</p>
              <p className="text-lg font-bold text-red-500">{formatMontant(sorties.reduce((s, x) => s + x.montant, 0))}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Dettes (non payé)</p>
              <p className="text-lg font-bold text-amber-600">{loading ? "…" : formatMontant(rdvs.filter(r => r.statut_paiement === "non_paye").reduce((s, r) => s + Number(r.montant_total), 0))}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Gain net estimé</p>
              <p className="text-lg font-bold text-primary">
                {loading ? "…" : formatMontant(totalSoldeComplet - sorties.reduce((s, x) => s + x.montant, 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog encaissement — SANS bouton Annuler */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o && !saving) setSelected(null) }}>
        <DialogContent className="max-w-md">
          {done ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" /> Paiement enregistré
                </DialogTitle>
                <DialogDescription>Le statut du rendez-vous a été mis à jour.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setSelected(null)}>Fermer</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Encaisser un paiement</DialogTitle>
                <DialogDescription>
                  {selected?.patient ? `${selected.patient.prenom} ${selected.patient.nom}` : ""} — Total {selected && formatMontant(selected.montant_total)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {selected && (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">{formatMontant(selected.montant_total)}</span>
                    </div>
                    {selected.montant_acompte != null && Number(selected.montant_acompte) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acompte versé</span>
                        <span className="text-green-600">{formatMontant(selected.montant_acompte)}</span>
                      </div>
                    )}
                    {selected.reste_a_payer != null && (
                      <>
                        <Separator className="my-1" />
                        <div className="flex justify-between font-semibold">
                          <span>Reste à payer</span>
                          <span>{formatMontant(selected.reste_a_payer)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Montant à encaisser (F CFA)</Label>
                  <Input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Mode de paiement</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as ModePaiement)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="liquide">Espèces</SelectItem>
                      <SelectItem value="wave">Wave</SelectItem>
                      <SelectItem value="orange_money">Orange Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={submit} disabled={saving} className="w-full">
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement...</> : "Valider l'encaissement"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog sortie d'argent */}
      <Dialog open={sortieOpen} onOpenChange={setSortieOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Déclarer une sortie d&apos;argent</DialogTitle>
            <DialogDescription>Matériel, charges, frais divers, etc.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={sortieCategorie} onValueChange={setSortieCategorie}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="materiel">Matériel médical</SelectItem>
                  <SelectItem value="fournitures">Fournitures de bureau</SelectItem>
                  <SelectItem value="entretien">Entretien / maintenance</SelectItem>
                  <SelectItem value="salaire">Avance sur salaire</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Motif / description</Label>
              <Textarea
                placeholder="Ex : Achat de gouttes ophtalmiques, réparation lampe à fente…"
                value={sortieMotif}
                onChange={(e) => setSortieMotif(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Montant (F CFA)</Label>
              <Input type="number" placeholder="15000" value={sortieMontant} onChange={(e) => setSortieMontant(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSortieOpen(false)}>Annuler</Button>
            <Button onClick={addSortie} disabled={!sortieMontant || !sortieMotif.trim()}>
              Enregistrer la sortie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
