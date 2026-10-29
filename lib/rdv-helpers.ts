import type { StatutRdv, StatutPaiement } from "@/lib/types"

export const statutRdvLabels: Record<StatutRdv, string> = {
  en_attente: "En attente",
  en_attente_paiement: "En attente de paiement",
  confirme: "Confirmé",
  annule: "Annulé",
  honore: "Honoré",
  expire: "Expiré",
}

export const statutPaiementLabels: Record<StatutPaiement, string> = {
  non_paye: "Non payé",
  acompte_verse: "Acompte versé",
  solde: "Soldé",
  pris_en_charge: "Pris en charge (assurance)",
}

// Couleur de badge (classe tailwind) selon le statut du RDV
export function statutRdvBadgeClass(statut: StatutRdv): string {
  switch (statut) {
    case "confirme":
      return "bg-green-500/10 text-green-600"
    case "en_attente_paiement":
      return "bg-amber-500/10 text-amber-600"
    case "honore":
      return "bg-blue-500/10 text-blue-600"
    case "annule":
    case "expire":
      return "bg-destructive/10 text-destructive"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function formatDateHeure(iso: string): { date: string; heure: string } {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    heure: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  }
}
