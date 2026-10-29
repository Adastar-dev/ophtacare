// Rôle "front" utilisé pour le routage des dashboards
export type UserRole = 'patient' | 'doctor' | 'secretary' | 'admin' | 'caissier'

// Rôles réels renvoyés par le backend Laravel
export type BackendRole =
  | 'patient'
  | 'medecin'
  | 'secretaire'
  | 'admin_entite'
  | 'super_admin'
  | 'caissier'

// Mapping backend -> segment de route front
export function normalizeRole(role: string): UserRole {
  switch (role) {
    case 'patient':
      return 'patient'
    case 'medecin':
      return 'doctor'
    case 'secretaire':
      return 'secretary'
    case 'admin_entite':
    case 'super_admin':
      return 'admin'
    case 'caissier':
      return 'caissier'
    default:
      return 'patient'
  }
}

export interface User {
  id: number | string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  // Rôle normalisé (front) utilisé pour le routage
  role: UserRole
  // Rôle d'origine renvoyé par le backend
  backendRole?: BackendRole
  clinique_id?: number | null
  patient_id?: number | null
  patient?: BackendPatient | null
  phone?: string
  dateOfBirth?: string
  address?: string
  createdAt?: string
}

// ── Types alignés sur le backend Laravel ──

export interface BackendPatient {
  id: number
  code_patient: string
  nom: string
  prenom: string
  date_naissance: string
  genre: 'M' | 'F'
  telephone: string
  email?: string | null
  antecedents_medicaux?: string | null
  allergies?: string | null
  assureur?: string | null
  numero_assurance?: string | null
  taux_couverture?: number | null
  clinique_id: number
  rendez_vous?: BackendRendezVous[]
}

export type StatutRdv = 'en_attente' | 'en_attente_paiement' | 'confirme' | 'annule' | 'honore' | 'expire'
export type StatutPaiement = 'non_paye' | 'acompte_verse' | 'solde' | 'pris_en_charge'
export type ModePaiement = 'liquide' | 'wave' | 'orange_money'

export interface BackendRendezVous {
  id: number
  patient_id: number
  user_id?: number | null
  clinique_id: number
  date_heure_rdv: string
  statut_rdv: StatutRdv
  statut_paiement: StatutPaiement
  prise_en_charge_assurance: boolean
  taux_prise_en_charge?: number | null
  montant_total: string | number
  montant_assurance?: string | number
  montant_patient?: string | number
  montant_acompte?: string | number
  montant_paye?: number
  reste_a_payer?: number
  document_prise_en_charge?: string | null
  motif?: string | null
  patient?: BackendPatient
  medecin?: { id: number; name: string } | null
  paiements?: BackendPaiement[]
  consultation?: BackendConsultation | null
  created_at?: string
  updated_at?: string
}

export interface BackendConsultation {
  id: number
  rendez_vous_id: number
  patient_id: number
  user_id: number
  diagnostic?: string | null
  observations_cliniques?: string | null
  ref_od_sphere?: string | null
  ref_od_cylindre?: string | null
  ref_od_axe?: string | null
  ref_og_sphere?: string | null
  ref_og_cylindre?: string | null
  ref_og_axe?: string | null
  vl_od_sans_correction?: string | null
  vl_og_sans_correction?: string | null
  created_at?: string
  medecin?: { id: number; name: string } | null
  patient?: BackendPatient | null
  prescription?: BackendPrescription | null
}

export interface BackendPrescription {
  id: number
  consultation_id: number
  type_verre: string
  type_teinte: string
  oeil_droit_add?: string | null
  oeil_gauche_add?: string | null
  remarques?: string | null
  qr_token?: string
  created_at?: string
  consultation?: {
    id: number
    patient_id: number
    ref_od_sphere?: string | null
    ref_od_cylindre?: string | null
    ref_od_axe?: string | null
    ref_og_sphere?: string | null
    ref_og_cylindre?: string | null
    ref_og_axe?: string | null
    diagnostic?: string | null
    created_at?: string
    patient?: (BackendPatient & { clinique?: { id: number; nom: string; adresse?: string; telephone?: string } | null }) | null
    medecin?: { id: number; name: string } | null
  } | null
}

export interface BackendUser {
  id: number
  name: string
  email: string
  role: BackendRole
  clinique_id?: number | null
  is_active?: boolean
  created_at?: string
  clinique?: { id: number; nom: string } | null
}

export interface BackendPaiement {
  id: number
  rendez_vous_id: number
  montant: string | number
  type_paiement: 'acompte' | 'solde' | 'total'
  mode_paiement: ModePaiement
  transaction_id?: string | null
  statut: 'en_attente' | 'reussi' | 'echoue' | 'rembourse'
  created_at?: string
}

export interface Patient extends User {
  role: 'patient'
  medicalRecordNumber: string
  insuranceNumber?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

export interface Doctor extends User {
  role: 'doctor'
  specialization: string
  licenseNumber: string
  consultationDuration: number // in minutes
}

export interface Secretary extends User {
  role: 'secretary'
}

export interface Admin extends User {
  role: 'admin'
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  date: string
  time: string
  duration: number
  type: 'consultation' | 'follow-up' | 'emergency' | 'exam'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  reason?: string
  notes?: string
}

export interface MedicalRecord {
  id: string
  patientId: string
  doctorId: string
  date: string
  type: 'consultation' | 'exam' | 'prescription'
  diagnosis?: string
  notes?: string
  visualAcuity?: {
    rightEye: string
    leftEye: string
    withCorrection?: {
      rightEye: string
      leftEye: string
    }
  }
  intraocularPressure?: {
    rightEye: number
    leftEye: number
  }
  fundusExam?: string
  slitLampExam?: string
  prescriptions?: Prescription[]
}

export interface Prescription {
  id: string
  medicalRecordId: string
  patientId: string
  doctorId: string
  date: string
  medications?: Medication[]
  glasses?: GlassesPrescription
  instructions?: string
  validUntil: string
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface GlassesPrescription {
  rightEye: {
    sphere: number
    cylinder?: number
    axis?: number
    add?: number
  }
  leftEye: {
    sphere: number
    cylinder?: number
    axis?: number
    add?: number
  }
  pupillaryDistance?: number
  notes?: string
}
