"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon, Clock, CheckCircle2, ShieldCheck, Smartphone, Loader2, AlertCircle, FileText,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  getMedecins, getMyPatient, createRendezVous, formatMontant, getIndisponibilites,
  type Medecin, type BackendIndisponibilite,
} from "@/lib/services"
import { ApiError } from "@/lib/api"
import { MobilePaymentDialog } from "@/components/payment/mobile-payment-dialog"
import type { BackendPatient, BackendRendezVous } from "@/lib/types"

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
]

// Types de consultation avec leur tarif (F CFA)
const appointmentTypes = [
  { id: "consultation", label: "Consultation générale", duration: 30, prix: 15000 },
  { id: "control", label: "Contrôle de vue", duration: 20, prix: 10000 },
  { id: "fond-oeil", label: "Fond d'œil", duration: 45, prix: 20000 },
  { id: "champ-visuel", label: "Champ visuel", duration: 60, prix: 25000 },
  { id: "oct", label: "OCT", duration: 30, prix: 30000 },
  { id: "urgence", label: "Urgence", duration: 45, prix: 35000 },
]

export default function PatientBookAppointmentPage() {
  const [date, setDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedDoctor, setSelectedDoctor] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [motif, setMotif] = useState<string>("")
  const [bookingStep, setBookingStep] = useState(1)

  const [patient, setPatient] = useState<BackendPatient | null>(null)
  const [medecins, setMedecins] = useState<Medecin[]>([])
  const [indispos, setIndispos] = useState<BackendIndisponibilite[]>([])
  const [useInsurance, setUseInsurance] = useState(false)
  const [taux, setTaux] = useState<string>("")
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [createdRdv, setCreatedRdv] = useState<BackendRendezVous | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    getMedecins().then(setMedecins).catch(() => {})
    getIndisponibilites().then(setIndispos).catch(() => {})
    getMyPatient().then((p) => {
      setPatient(p)
      if (p.taux_couverture != null) setTaux(String(p.taux_couverture))
    }).catch(() => {})
  }, [])

  // Créneaux indisponibles (hors service) pour la date + médecin sélectionnés.
  const dateKey = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : ''
  const isSlotHorsService = (time: string): boolean => {
    if (!dateKey) return false
    const hour = Number(time.split(':')[0])
    return indispos.some((i) =>
      i.date === dateKey &&
      hour >= i.heure_debut && hour < i.heure_fin &&
      (!selectedDoctor || String(i.user_id) === selectedDoctor),
    )
  }

  const typeInfo = appointmentTypes.find((t) => t.id === selectedType)
  const montantTotal = typeInfo?.prix ?? 0
  const tauxNum = Math.min(100, Math.max(0, parseInt(taux || "0", 10) || 0))
  const montantAssurance = useInsurance ? Math.round((montantTotal * tauxNum) / 100) : 0
  const montantPatient = montantTotal - montantAssurance
  // Montant requis pour valider : 50% du total (normal) ou 100% du reste patient (PEC)
  const acompte = useInsurance ? montantPatient : Math.ceil(montantTotal / 2)

  const resetBooking = () => {
    setDate(undefined); setSelectedTime(""); setSelectedDoctor(""); setSelectedType("")
    setMotif(""); setBookingStep(1); setUseInsurance(false); setError("")
    setTaux(patient?.taux_couverture != null ? String(patient.taux_couverture) : "")
    setDocumentFile(null); setCreatedRdv(null); setPaid(false)
  }

  const buildDateTime = (): string => {
    const [h, m] = selectedTime.split(":").map(Number)
    const d = new Date(date!)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }

  const handleConfirm = async () => {
    setError("")
    if (useInsurance) {
      if (!tauxNum) { setError("Indiquez le taux de prise en charge (%)."); return }
      if (!documentFile) { setError("Joignez le document justificatif de la prise en charge."); return }
    }
    setSubmitting(true)
    try {
      const res = await createRendezVous({
        date_heure_rdv: buildDateTime(),
        motif: motif || typeInfo?.label,
        montant_total: montantTotal,
        user_id: selectedDoctor ? Number(selectedDoctor) : null,
        prise_en_charge_assurance: useInsurance,
        taux_prise_en_charge: useInsurance ? tauxNum : null,
        document_prise_en_charge: useInsurance ? documentFile : null,
      })
      setCreatedRdv(res.rendez_vous)
      setPaymentOpen(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la création du rendez-vous.")
    } finally {
      setSubmitting(false)
    }
  }

  // Écran de confirmation final (paiement réussi)
  const isComplete = paid

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prendre rendez-vous</h1>
        <p className="text-muted-foreground mt-1">
          Réservez votre consultation, payez l&apos;acompte par mobile ou utilisez votre assurance.
        </p>
      </div>

      {isComplete ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Rendez-vous confirmé</h2>
              <p className="text-muted-foreground mt-1">Votre paiement a bien été reçu.</p>
            </div>
            {createdRdv && (
              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 text-sm max-w-sm mx-auto">
                <Row label="Type" value={typeInfo?.label || "—"} />
                <Row label="Date" value={date ? format(date, "EEEE d MMMM yyyy", { locale: fr }) : "—"} />
                <Row label="Heure" value={selectedTime} />
                <Row label="Montant total" value={formatMontant(montantTotal)} />
                {useInsurance && <Row label="Prise en charge" value={`${tauxNum}%`} />}
                <Row label="Votre part" value={formatMontant(montantPatient)} />
              </div>
            )}
            <Button onClick={resetBooking}>Nouveau rendez-vous</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Étape {bookingStep} sur 3 —{" "}
              {bookingStep === 1 ? "Type & médecin" : bookingStep === 2 ? "Date & heure" : "Validation"}
            </CardTitle>
            <CardDescription>
              {bookingStep === 3
                ? "Vérifiez les informations et choisissez votre mode de validation."
                : "Renseignez les détails de votre consultation."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {bookingStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Type de consultation</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez le type" /></SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label} — {formatMontant(type.prix)} ({type.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Médecin (optionnel)</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger><SelectValue placeholder="Sans préférence" /></SelectTrigger>
                    <SelectContent>
                      {medecins.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Motif (optionnel)</Label>
                  <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Décrivez brièvement le motif..." rows={2} />
                </div>
              </>
            )}

            {bookingStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: fr }) : "Sélectionnez une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || d.getDay() === 0 || d.getDay() === 6}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {date && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Créneaux</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((time) => {
                        const hs = isSlotHorsService(time)
                        return (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            disabled={hs}
                            onClick={() => setSelectedTime(time)}
                            className={cn("text-xs", hs && "line-through opacity-50")}
                            title={hs ? "Créneau hors service" : undefined}
                          >
                            {time}
                          </Button>
                        )
                      })}
                    </div>
                    {timeSlots.some(isSlotHorsService) && (
                      <p className="text-xs text-muted-foreground">Les créneaux barrés sont hors service.</p>
                    )}
                  </div>
                )}
              </>
            )}

            {bookingStep === 3 && (
              <>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <Row label="Type" value={typeInfo?.label || "—"} />
                  <Row label="Médecin" value={medecins.find((m) => String(m.id) === selectedDoctor)?.name || "Sans préférence"} />
                  <Row label="Date" value={date ? format(date, "EEEE d MMMM yyyy", { locale: fr }) : "—"} />
                  <Row label="Heure" value={selectedTime} />
                  <Row label="Montant total" value={formatMontant(montantTotal)} />
                  {useInsurance
                    ? <>
                        <Row label={`Part assurance (${tauxNum}%)`} value={formatMontant(montantAssurance)} />
                        <Row label="Votre part (à régler)" value={formatMontant(montantPatient)} />
                      </>
                    : <Row label="Acompte (50%)" value={formatMontant(acompte)} />}
                </div>

                {/* Choix : assurance OU acompte mobile */}
                <div className="space-y-3">
                  <Label>Mode de validation</Label>

                  <button
                    type="button"
                    onClick={() => setUseInsurance(true)}
                    className={cn(
                      "w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      useInsurance ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    <ShieldCheck className={cn("h-5 w-5 mt-0.5", useInsurance ? "text-primary" : "text-muted-foreground")} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Prise en charge assurance</p>
                      <p className="text-xs text-muted-foreground">
                        Justifiez avec taux + document — payez uniquement votre reste à charge.
                      </p>
                    </div>
                    {useInsurance && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </button>

                  {/* Champs PEC si sélectionné */}
                  {useInsurance && (
                    <div className="ml-4 space-y-3 border-l-2 border-primary/30 pl-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Taux de prise en charge (%)</Label>
                        <Input
                          type="number" min={1} max={100}
                          value={taux}
                          onChange={(e) => setTaux(e.target.value)}
                          placeholder="Ex : 80"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Document justificatif
                        </Label>
                        <Input
                          type="file" accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
                          className="h-8 text-xs"
                        />
                        {documentFile && (
                          <p className="text-xs text-muted-foreground truncate">{documentFile.name}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setUseInsurance(false)}
                    className={cn(
                      "w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      !useInsurance ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    <Smartphone className={cn("h-5 w-5 mt-0.5", !useInsurance ? "text-primary" : "text-muted-foreground")} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Paiement mobile (acompte 50%)</p>
                      <p className="text-xs text-muted-foreground">
                        Wave ou Orange Money — {formatMontant(Math.ceil(montantTotal / 2))} pour confirmer.
                      </p>
                    </div>
                    {!useInsurance && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </button>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-2 pt-2">
              {bookingStep > 1 && (
                <Button variant="outline" onClick={() => setBookingStep((s) => s - 1)} disabled={submitting}>
                  Précédent
                </Button>
              )}
              {bookingStep < 3 ? (
                <Button
                  className="ml-auto"
                  onClick={() => setBookingStep((s) => s + 1)}
                  disabled={(bookingStep === 1 && !selectedType) || (bookingStep === 2 && (!date || !selectedTime))}
                >
                  Suivant
                </Button>
              ) : (
                <Button className="ml-auto" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement...</>
                  ) : useInsurance ? (
                    "Confirmer avec l'assurance"
                  ) : (
                    "Payer l'acompte"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <MobilePaymentDialog
        rdv={createdRdv}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onPaid={() => { setPaid(true); setPaymentOpen(false) }}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}

