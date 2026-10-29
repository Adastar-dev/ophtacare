// Couche service : appels typés vers l'API Laravel.
import { api, API_BASE_URL } from "@/lib/api"
import type {
  BackendPatient,
  BackendRendezVous,
  BackendPaiement,
  BackendUser,
  BackendRole,
  BackendConsultation,
  BackendPrescription,
  ModePaiement,
} from "@/lib/types"

// URL absolue d'un fichier stocké côté Laravel (storage/app/public).
export function storageUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith("http")) return path
  const origin = API_BASE_URL.replace(/\/api\/?$/, "")
  return `${origin}/storage/${path.replace(/^\/?storage\//, "")}`
}

// ── Cliniques (public) ──
export interface Clinique {
  id: number
  nom: string
  adresse?: string
  telephone?: string
}
export const getCliniques = () => api.get<Clinique[]>("/cliniques", false)

// ── Médecins ──
export interface Medecin {
  id: number
  name: string
  email?: string
  clinique_id?: number
}
export const getMedecins = () => api.get<Medecin[]>("/medecins")

// ── Profil patient connecté ──
export const getMyPatient = () => api.get<BackendPatient>("/me/patient")
export const updateMyPatient = (data: Partial<BackendPatient>) =>
  api.put<{ message: string; patient: BackendPatient }>("/me/patient", data)

// ── Patients (staff) ──
export const getPatients = () => api.get<BackendPatient[]>("/patients")
export const getPatient = (id: number | string) => api.get<BackendPatient>(`/patients/${id}`)
export const createPatient = (data: Partial<BackendPatient>) =>
  api.post<{ message: string; patient: BackendPatient }>("/patients", data)

// ── Rendez-vous ──
export interface CreateRdvPayload {
  patient_id?: number
  user_id?: number | null
  date_heure_rdv: string
  motif?: string
  montant_total: number
  prise_en_charge_assurance?: boolean
  taux_prise_en_charge?: number | null
  document_prise_en_charge?: File | null
}

export const getRendezVous = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : ""
  return api.get<BackendRendezVous[]>(`/rendez-vous${qs}`)
}
export const getRendezVousDetail = (id: number | string) =>
  api.get<BackendRendezVous>(`/rendez-vous/${id}`)

export const createRendezVous = (data: CreateRdvPayload) => {
  // Prise en charge avec document -> multipart/form-data
  if (data.prise_en_charge_assurance && data.document_prise_en_charge) {
    const fd = new FormData()
    if (data.patient_id != null) fd.append("patient_id", String(data.patient_id))
    if (data.user_id != null) fd.append("user_id", String(data.user_id))
    fd.append("date_heure_rdv", data.date_heure_rdv)
    if (data.motif) fd.append("motif", data.motif)
    fd.append("montant_total", String(data.montant_total))
    fd.append("prise_en_charge_assurance", "1")
    if (data.taux_prise_en_charge != null) fd.append("taux_prise_en_charge", String(data.taux_prise_en_charge))
    fd.append("document_prise_en_charge", data.document_prise_en_charge)
    return api.postForm<{ message: string; rendez_vous: BackendRendezVous }>("/rendez-vous", fd)
  }
  const { document_prise_en_charge, ...payload } = data
  return api.post<{ message: string; rendez_vous: BackendRendezVous }>("/rendez-vous", payload)
}
export const updateRendezVous = (id: number | string, data: Record<string, any>) =>
  api.put<{ message: string; rendez_vous: BackendRendezVous }>(`/rendez-vous/${id}`, data)
export const cancelRendezVous = (id: number | string) =>
  api.delete<{ message: string }>(`/rendez-vous/${id}`)

// ── Indisponibilités (hors service, partagées entre interfaces) ──
export interface BackendIndisponibilite {
  id: number
  user_id: number
  clinique_id: number
  date: string // Y-m-d
  heure_debut: number
  heure_fin: number
  motif?: string | null
  medecin?: { id: number; name: string } | null
}
export const getIndisponibilites = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : ""
  return api.get<BackendIndisponibilite[]>(`/indisponibilites${qs}`)
}
export const createIndisponibilite = (data: {
  date: string
  heure_debut: number
  heure_fin: number
  motif?: string | null
  user_id?: number | null
}) => api.post<{ message: string; indisponibilite: BackendIndisponibilite }>("/indisponibilites", data)
export const deleteIndisponibilite = (id: number | string) =>
  api.delete<{ message: string }>(`/indisponibilites/${id}`)

// ── Paiements mobiles (Wave / Orange Money) ──
export interface InitPaiementResponse {
  message: string
  url_paiement: string
  reference_operateur: string
  paiement_id: number
  expire_at: string
}
export const initierPaiementMobile = (
  rendez_vous_id: number,
  montant: number,
  mode_paiement: Extract<ModePaiement, "wave" | "orange_money">,
  callback_url?: string,
) =>
  api.post<InitPaiementResponse>("/paiement/mobile/initier", {
    rendez_vous_id,
    montant,
    mode_paiement,
    ...(callback_url ? { callback_url } : {}),
  })

export interface StatutPaiementResponse {
  statut_paiement: string
  transaction_id: string | null
  message: string
}
export const verifierStatutPaiement = (paiementId: number) =>
  api.get<StatutPaiementResponse>(`/paiement/mobile/${paiementId}/statut`)

// ── Paiement guichet (caissier) ──
export const enregistrerPaiementGuichet = (data: {
  rendez_vous_id: number
  montant: number
  mode_paiement: ModePaiement
  transaction_id?: string
}) => api.post<{ message: string; paiement: BackendPaiement }>("/paiements", data)

// ── Administration ──
export interface AdminDashboard {
  stats: {
    total_patients: number
    rdv_aujourd_hui: number
    rdv_confirmes: number
    recette_mois: number
  }
  rdv_par_statut: Record<string, number>
  recette_semaine: { date: string; total: string }[]
}
export const getAdminDashboard = () => api.get<AdminDashboard>("/admin/dashboard")
export const getAdminUsers = () => api.get<BackendUser[]>("/admin/users")
export const getActivityLogs = () => api.get<any>("/admin/activity-logs")
export const getTransactionLogs = () => api.get<any>("/admin/transaction-logs")

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: Exclude<BackendRole, "patient" | "super_admin">
  clinique_id?: number | null
}
export const createUser = (data: CreateUserPayload) =>
  api.post<{ message: string; user: BackendUser }>("/admin/users", data)
export const updateUser = (id: number, data: Partial<{ name: string; role: string; is_active: boolean; password: string }>) =>
  api.patch<{ message: string; user: BackendUser }>(`/admin/users/${id}`, data)

// ── Consultations ──
export const getConsultations = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : ""
  return api.get<BackendConsultation[]>(`/consultations${qs}`)
}
export const getConsultation = (id: number | string) =>
  api.get<BackendConsultation>(`/consultations/${id}`)
export const createConsultation = (data: Record<string, any>) =>
  api.post<{ message: string; consultation: BackendConsultation }>("/consultations", data)
export const updateConsultation = (id: number | string, data: Record<string, any>) =>
  api.put<{ message: string; consultation: BackendConsultation }>(`/consultations/${id}`, data)

// ── Prescriptions ──
export const getPrescriptions = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : ""
  return api.get<BackendPrescription[]>(`/prescriptions${qs}`)
}
export const getPrescription = (id: number | string) =>
  api.get<BackendPrescription>(`/prescriptions/${id}`)
export const createPrescription = (data: Record<string, any>) =>
  api.post<{ message: string; prescription: BackendPrescription }>("/prescriptions", data)

// ── Helpers ──
export function formatMontant(montant: number | string): string {
  const n = typeof montant === "string" ? parseFloat(montant) : montant
  return new Intl.NumberFormat("fr-FR").format(Math.round(n || 0)) + " F CFA"
}
