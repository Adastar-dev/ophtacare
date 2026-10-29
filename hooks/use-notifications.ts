"use client"

import { useEffect, useState, useCallback } from "react"
import { getRendezVous } from "@/lib/services"
import type { BackendRendezVous } from "@/lib/types"

export interface AppNotification {
  id: string
  text: string
  time: string
  unread: boolean
  rdv?: BackendRendezVous
  href?: string
  type: "rdv_en_attente" | "paiement_du" | "rdv_modifie" | "rdv_confirme" | "info"
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${Math.floor(hours / 24)}j`
}

/**
 * Calcule les notifications contextuelles selon le rôle.
 * - secretaire : RDV en_attente ou en_attente_paiement → à traiter
 * - patient     : RDV non_paye / acompte_verse → à payer | RDV en_attente → modifié
 * - doctor      : RDV confirme du jour → à consulter
 * - caissier    : RDV non_paye ou acompte_verse → à encaisser
 * - admin       : aucune (pas de RDV propres)
 */
export function useNotifications(role: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (role === "admin" || !role) {
      setNotifications([])
      setLoading(false)
      return
    }

    getRendezVous()
      .then((rdvs) => {
        const now = new Date()
        const todayStr = now.toLocaleDateString("fr-CA")
        const notifs: AppNotification[] = []

        if (role === "secretary" || role === "secretaire") {
          // RDV en attente de validation secrétaire
          const pending = rdvs.filter(
            (r) => r.statut_rdv === "en_attente" || r.statut_rdv === "en_attente_paiement"
          )
          pending.forEach((r) => {
            const patientName = r.patient
              ? `${r.patient.prenom} ${r.patient.nom}`
              : `Patient #${r.patient_id}`
            notifs.push({
              id: `rdv-pending-${r.id}`,
              text: `RDV à valider — ${patientName}`,
              time: relativeTime(r.created_at ?? r.date_heure_rdv),
              unread: true,
              rdv: r,
              href: "/dashboard/secretary",
              type: "rdv_en_attente",
            })
          })
        }

        if (role === "patient") {
          // Paiements dus
          rdvs
            .filter(
              (r) =>
                r.statut_paiement === "non_paye" || r.statut_paiement === "acompte_verse"
            )
            .forEach((r) => {
              notifs.push({
                id: `pay-due-${r.id}`,
                text:
                  r.statut_paiement === "non_paye"
                    ? `Acompte à payer pour votre RDV du ${new Date(r.date_heure_rdv).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                    : `Solde restant à régler pour votre RDV`,
                time: relativeTime(r.updated_at ?? r.date_heure_rdv),
                unread: true,
                rdv: r,
                href: "/dashboard/patient/appointments",
                type: "paiement_du",
              })
            })
          // RDV modifiés par secrétaire (en_attente + acompte versé)
          rdvs
            .filter(
              (r) =>
                r.statut_rdv === "en_attente" && r.statut_paiement === "acompte_verse"
            )
            .forEach((r) => {
              notifs.push({
                id: `rdv-modified-${r.id}`,
                text: `Votre RDV a été reprogrammé — validez ou reprogrammez`,
                time: relativeTime(r.updated_at ?? r.date_heure_rdv),
                unread: true,
                rdv: r,
                href: "/dashboard/patient/appointments",
                type: "rdv_modifie",
              })
            })
        }

        if (role === "doctor" || role === "medecin") {
          // RDV confirmés aujourd'hui
          const todayConfirmed = rdvs.filter(
            (r) =>
              r.statut_rdv === "confirme" &&
              new Date(r.date_heure_rdv).toLocaleDateString("fr-CA") === todayStr
          )
          todayConfirmed.forEach((r) => {
            const patientName = r.patient
              ? `${r.patient.prenom} ${r.patient.nom}`
              : `Patient #${r.patient_id}`
            const heure = new Date(r.date_heure_rdv).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
            notifs.push({
              id: `rdv-today-${r.id}`,
              text: `Consultation à ${heure} — ${patientName}`,
              time: "Aujourd'hui",
              unread: new Date(r.date_heure_rdv) > now,
              rdv: r,
              href: `/dashboard/doctor/consultations/new?rdv_id=${r.id}`,
              type: "rdv_confirme",
            })
          })
        }

        if (role === "caissier") {
          const aEncaisser = rdvs.filter(
            (r) =>
              r.statut_rdv !== "annule" &&
              (r.statut_paiement === "non_paye" || r.statut_paiement === "acompte_verse")
          )
          aEncaisser.forEach((r) => {
            const patientName = r.patient
              ? `${r.patient.prenom} ${r.patient.nom}`
              : `Patient #${r.patient_id}`
            notifs.push({
              id: `caisse-${r.id}`,
              text: `Paiement en attente — ${patientName}`,
              time: relativeTime(r.created_at ?? r.date_heure_rdv),
              unread: true,
              rdv: r,
              href: "/dashboard/caissier",
              type: "paiement_du",
            })
          })
        }

        // Déduplique (rdv_modifie peut chevaucher paiement_du)
        const seen = new Set<string>()
        const deduped = notifs.filter((n) => {
          if (seen.has(n.id)) return false
          seen.add(n.id)
          return true
        })

        // Trier par unread d'abord, puis limiter à 10
        deduped.sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0))
        setNotifications(deduped.slice(0, 10))
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [role])

  useEffect(() => {
    load()
    // Rafraîchir toutes les 2 minutes
    const interval = setInterval(load, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [load])

  return {
    notifications,
    unreadCount: notifications.filter((n) => n.unread).length,
    loading,
    refresh: load,
  }
}
