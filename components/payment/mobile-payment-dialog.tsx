"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  initierPaiementMobile, verifierStatutPaiement, formatMontant,
} from "@/lib/services"
import { ApiError } from "@/lib/api"
import type { BackendRendezVous } from "@/lib/types"
import {
  Loader2, CheckCircle2, ExternalLink, Smartphone, AlertCircle, RefreshCw,
} from "lucide-react"

type MobileMode = "wave" | "orange_money"

interface Props {
  rdv: BackendRendezVous | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaid?: () => void
}

export function MobilePaymentDialog({ rdv, open, onOpenChange, onPaid }: Props) {
  const [mode, setMode] = useState<MobileMode | null>(null)
  const [phase, setPhase] = useState<"choose" | "pending" | "done">("choose")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentUrl, setPaymentUrl] = useState("")
  const [paiementId, setPaiementId] = useState<number | null>(null)

  if (!rdv) return null

  const num = (v: unknown, fallback = 0) =>
    v == null ? fallback : typeof v === "string" ? parseFloat(v) : (v as number)

  const total = num(rdv.montant_total)
  const partPatient = num(rdv.montant_patient, total)
  // Montant minimum exigé pour valider (50% sans PEC, 100% du reste patient avec PEC)
  const acompteMin = num(rdv.montant_acompte, Math.ceil(partPatient / 2))
  // Solde restant côté patient
  const reste = num(rdv.reste_a_payer, Math.max(0, partPatient - acompteMin))
  const montantDu = rdv.statut_paiement === "acompte_verse" ? reste : acompteMin
  const isPriseEnCharge = !!rdv.prise_en_charge_assurance

  const reset = () => {
    setMode(null); setPhase("choose"); setLoading(false)
    setError(""); setPaymentUrl(""); setPaiementId(null)
  }

  const handleClose = (o: boolean) => {
    if (!o) reset()
    onOpenChange(o)
  }

  const initier = async () => {
    if (!mode) return
    setLoading(true); setError("")
    try {
      const callbackUrl = typeof window !== "undefined"
        ? `${window.location.origin}/dashboard/patient/appointments`
        : undefined
      const res = await initierPaiementMobile(rdv.id, montantDu, mode, callbackUrl)
      setPaymentUrl(res.url_paiement)
      setPaiementId(res.paiement_id)
      setPhase("pending")
      // Ouvrir automatiquement dans un nouvel onglet
      if (res.url_paiement) {
        window.open(res.url_paiement, "_blank", "noopener,noreferrer")
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'initiation du paiement.")
    } finally {
      setLoading(false)
    }
  }

  const verifier = async () => {
    if (!paiementId) return
    setLoading(true); setError("")
    try {
      const res = await verifierStatutPaiement(paiementId)
      if (res.statut_paiement === "reussi") {
        setPhase("done")
        onPaid?.()
      } else {
        setError("Le paiement n'a pas encore été confirmé par l'opérateur. En environnement de test (MOCK), le paiement doit être validé manuellement par le caissier en guichet.")
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de vérifier le statut.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {phase === "done" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" /> Paiement confirmé
              </DialogTitle>
              <DialogDescription>Votre rendez-vous est confirmé.</DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Montant réglé : <span className="font-semibold text-foreground">{formatMontant(montantDu)}</span>
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Terminer</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" /> Paiement mobile
              </DialogTitle>
              <DialogDescription>
                {rdv.statut_paiement === "acompte_verse"
                  ? "Réglez le solde de votre rendez-vous."
                  : isPriseEnCharge
                    ? `Prise en charge ${rdv.taux_prise_en_charge ?? 0}% : réglez le reste à votre charge pour valider le rendez-vous.`
                    : "Réglez l'acompte (50%) pour confirmer votre rendez-vous."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Montant à régler</span>
                <span className="text-xl font-bold text-primary">{formatMontant(montantDu)}</span>
              </div>

              {phase === "choose" && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Wave */}
                  <button
                    type="button"
                    onClick={() => setMode("wave")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${mode === "wave" ? "border-[#1bbfe8] bg-[#1bbfe8]/10 shadow-sm" : "border-border hover:border-[#1bbfe8]/50 hover:bg-[#1bbfe8]/5"}`}
                  >
                    <WaveLogo size={56} />
                    <span className="text-sm font-semibold">Wave</span>
                  </button>
                  {/* Orange Money */}
                  <button
                    type="button"
                    onClick={() => setMode("orange_money")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${mode === "orange_money" ? "border-orange-500 bg-orange-500/10 shadow-sm" : "border-border hover:border-orange-400 hover:bg-orange-500/5"}`}
                  >
                    <OrangeMoneyLogo size={56} />
                    <span className="text-sm font-semibold">Orange Money</span>
                  </button>
                </div>
              )}

              {phase === "pending" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    {mode === "wave" ? <WaveLogo size={48} /> : <OrangeMoneyLogo size={48} />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {mode === "wave" ? "Paiement Wave initié" : "Paiement Orange Money initié"}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Mode test (MOCK)</strong> — Le lien de paiement est simulé. Aucun vrai paiement ne sera débité.
                      Pour valider le RDV, le caissier peut confirmer le paiement manuellement depuis son tableau de bord.
                    </span>
                  </div>
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 ${mode === "wave" ? "bg-[#1bbfe8]" : "bg-orange-500"}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir la page de paiement (MOCK)
                  </a>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col gap-2">
              {phase === "choose" ? (
                <Button
                  onClick={initier}
                  disabled={!mode || loading}
                  className={`w-full font-semibold ${mode === "wave" ? "bg-[#1bbfe8] hover:bg-[#17aed4] text-white" : mode === "orange_money" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                >
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Initiation…</>
                    : mode === "wave" ? <><WaveLogo size={18} />Payer avec Wave</>
                    : mode === "orange_money" ? <><OrangeMoneyLogo size={18} />Payer avec Orange Money</>
                    : "Sélectionnez un mode"}
                </Button>
              ) : (
                <Button onClick={verifier} disabled={loading} variant="outline" className="w-full">
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Vérification…</>
                    : <><RefreshCw className="mr-2 h-4 w-4" />Vérifier le paiement</>}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Logos inline ──

function WaveLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="56" rx="12" fill="#1bbfe8" />
      {/* Penguin body */}
      <ellipse cx="28" cy="35" rx="10" ry="12" fill="#111" />
      {/* White belly */}
      <ellipse cx="28" cy="36" rx="6" ry="8" fill="white" />
      {/* Head */}
      <circle cx="28" cy="20" r="9" fill="#111" />
      {/* Eyes */}
      <circle cx="25" cy="19" r="1.5" fill="white" />
      <circle cx="31" cy="19" r="1.5" fill="white" />
      {/* Beak */}
      <ellipse cx="28" cy="23.5" rx="2.5" ry="1.5" fill="#f97316" />
      {/* Left wing raised */}
      <path d="M18 27 Q11 20 14 15 Q15 23 19 25Z" fill="#111" />
      {/* Right wing */}
      <path d="M38 27 Q43 24 42 31 Q40 28 37 28Z" fill="#111" />
      {/* Feet */}
      <ellipse cx="23" cy="47" rx="4" ry="2" fill="#f97316" />
      <ellipse cx="33" cy="47" rx="4" ry="2" fill="#f97316" />
      <text x="28" y="54" fontSize="5" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="sans-serif">wave</text>
    </svg>
  )
}

function OrangeMoneyLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="56" rx="12" fill="white" />
      {/* Black arrow (top-left pointing up-right) */}
      <path d="M7 24 L7 10 L21 10 L21 15 L15 15 L28 28 L24 32 L11 19 L11 24Z" fill="#111" />
      {/* Orange arrow (top-right pointing down-left) */}
      <path d="M49 10 L49 24 L45 24 L45 19 L32 32 L28 28 L41 15 L35 15 L35 10Z" fill="#f97316" />
      <text x="28" y="41" fontSize="6" fontWeight="900" fill="#111" textAnchor="middle" fontFamily="Arial,sans-serif">Orange</text>
      <text x="28" y="51" fontSize="6" fontWeight="900" fill="#111" textAnchor="middle" fontFamily="Arial,sans-serif">Money</text>
    </svg>
  )
}
