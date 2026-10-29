"use client"

import { Button } from "@/components/ui/button"
import { Printer, Eye } from "lucide-react"
import type { BackendPrescription } from "@/lib/types"

const typeVerreLabels: Record<string, string> = {
  unifocal: "Unifocal",
  progressif: "Progressif",
  bifocal: "Bifocal",
  lentilles: "Lentilles de contact",
}
const typeTeinteLabels: Record<string, string> = {
  blanc: "Blanc (incolore)",
  photochromique: "Photochromique",
  solaire: "Solaire / teinté",
}

function calcAge(dob?: string | null): string {
  if (!dob) return "—"
  const diff = Date.now() - new Date(dob).getTime()
  const age = Math.floor(diff / (365.25 * 24 * 3600 * 1000))
  return Number.isFinite(age) ? `${age} ans` : "—"
}

function fmt(v?: string | null): string {
  if (v === null || v === undefined || v === "") return "—"
  return v
}

export interface PrescriptionCanvasData {
  prescription: BackendPrescription
  /** Fallback patient name if consultation.patient absent (e.g. doctor list view) */
  patientName?: string
}

/**
 * Canevas visuel d'une ordonnance optique de clinique, imprimable.
 * Affiché à l'identique à l'écran et à l'impression (fenêtre dédiée).
 */
export function PrescriptionCanvas({ prescription, patientName }: PrescriptionCanvasData) {
  const c = prescription.consultation
  const patient = c?.patient ?? null
  const clinique = patient?.clinique ?? null
  const medecin = c?.medecin ?? null

  const nomPatient = patient
    ? `${patient.prenom ?? ""} ${patient.nom ?? ""}`.trim()
    : patientName ?? `Patient #${c?.patient_id ?? ""}`

  const dateStr = (prescription.created_at ?? c?.created_at)
    ? new Date(prescription.created_at ?? c!.created_at!).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : "—"

  return (
    <div
      id={`ordonnance-${prescription.id}`}
      className="prescription-canvas bg-white text-slate-900 mx-auto w-full max-w-[210mm] p-8 sm:p-10"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* En-tête clinique */}
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {clinique?.nom ?? "Clinique Ophtalmologique"}
          </h2>
          <p className="text-sm text-slate-600 mt-1">{clinique?.adresse ?? "Adresse de la clinique"}</p>
          {clinique?.telephone && <p className="text-sm text-slate-600">Tél : {clinique.telephone}</p>}
        </div>
        <div className="text-right">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full border-2 border-slate-800 text-slate-800 text-2xl">
            ⊕
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">Ophtalmologie</p>
        </div>
      </div>

      {/* Titre */}
      <h1 className="text-center text-xl font-bold uppercase tracking-[0.2em] my-6 text-slate-800">
        Ordonnance optique
      </h1>

      {/* Infos patient / praticien */}
      <div className="grid grid-cols-2 gap-6 text-sm mb-6">
        <div className="space-y-1">
          <p><span className="text-slate-500">Patient :</span> <span className="font-semibold">{nomPatient}</span></p>
          <p><span className="text-slate-500">Âge :</span> {calcAge(patient?.date_naissance)}</p>
          {patient?.code_patient && <p><span className="text-slate-500">Dossier :</span> {patient.code_patient}</p>}
        </div>
        <div className="space-y-1 text-right">
          <p><span className="text-slate-500">Date :</span> {dateStr}</p>
          {medecin && <p><span className="text-slate-500">Praticien :</span> Dr. {medecin.name}</p>}
          <p><span className="text-slate-500">N° ordonnance :</span> #{prescription.id}</p>
        </div>
      </div>

      {/* Tableau de réfraction */}
      <table className="w-full border-collapse text-sm mb-6">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-left">Œil</th>
            <th className="border border-slate-300 px-3 py-2">Sphère</th>
            <th className="border border-slate-300 px-3 py-2">Cylindre</th>
            <th className="border border-slate-300 px-3 py-2">Axe</th>
            <th className="border border-slate-300 px-3 py-2">Addition</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 px-3 py-2 font-semibold">OD (droit)</td>
            <td className="border border-slate-300 px-3 py-2 text-center">{fmt(c?.ref_od_sphere)}</td>
            <td className="border border-slate-300 px-3 py-2 text-center">{fmt(c?.ref_od_cylindre)}</td>
            <td className="border border-slate-300 px-3 py-2 text-center">{c?.ref_od_axe ? `${c.ref_od_axe}°` : "—"}</td>
            <td className="border border-slate-300 px-3 py-2 text-center">{fmt(prescription.oeil_droit_add)}</td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2 font-semibold">OG (gauche)</td>
            <td className="border border-slate-300 px-3 py-2 text-center">{fmt(c?.ref_og_sphere)}</td>
            <td className="border border-slate-300 px-3 py-2 text-center">{fmt(c?.ref_og_cylindre)}</td>
            <td className="border border-slate-300 px-3 py-2 text-center">{c?.ref_og_axe ? `${c.ref_og_axe}°` : "—"}</td>
            <td className="border border-slate-300 px-3 py-2 text-center">{fmt(prescription.oeil_gauche_add)}</td>
          </tr>
        </tbody>
      </table>

      {/* Verres */}
      <div className="grid grid-cols-2 gap-6 text-sm mb-6">
        <div>
          <p className="text-slate-500">Type de verre</p>
          <p className="font-semibold">{typeVerreLabels[prescription.type_verre] ?? prescription.type_verre ?? "—"}</p>
        </div>
        <div>
          <p className="text-slate-500">Teinte</p>
          <p className="font-semibold">{typeTeinteLabels[prescription.type_teinte] ?? prescription.type_teinte ?? "—"}</p>
        </div>
      </div>

      {prescription.remarques && (
        <div className="text-sm mb-6">
          <p className="text-slate-500">Remarques</p>
          <p className="mt-1 whitespace-pre-wrap">{prescription.remarques}</p>
        </div>
      )}

      {/* Pied de page : signature + validité */}
      <div className="flex items-end justify-between mt-12 pt-6 border-t border-slate-300 text-sm">
        <div className="text-xs text-slate-500 max-w-[60%]">
          <p>Ordonnance valable 1 an à compter de la date d'émission.</p>
          {prescription.qr_token && (
            <p className="mt-1 font-mono break-all">Réf. opticien : {prescription.qr_token.slice(0, 16)}…</p>
          )}
        </div>
        <div className="text-center">
          <div className="h-16 w-48 border-b border-slate-400" />
          <p className="text-xs text-slate-500 mt-1">Signature &amp; cachet{medecin ? ` — Dr. ${medecin.name}` : ""}</p>
        </div>
      </div>
    </div>
  )
}

function esc(v?: string | null): string {
  if (v === null || v === undefined) return ""
  return String(v).replace(/[&<>"]/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch] as string))
}

/** Construit le HTML autonome (inline styles) de l'ordonnance pour l'impression. */
function buildPrintHtml(prescription: BackendPrescription, patientName?: string): string {
  const c = prescription.consultation
  const patient = c?.patient ?? null
  const clinique = patient?.clinique ?? null
  const medecin = c?.medecin ?? null

  const nomPatient = patient
    ? `${patient.prenom ?? ""} ${patient.nom ?? ""}`.trim()
    : patientName ?? `Patient #${c?.patient_id ?? ""}`
  const dateStr = (prescription.created_at ?? c?.created_at)
    ? new Date(prescription.created_at ?? c!.created_at!).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "—"
  const td = "border:1px solid #cbd5e1;padding:8px 12px;"
  const tdc = td + "text-align:center;"
  const lbl = "color:#64748b;"

  const row = (oeil: string, sph?: string | null, cyl?: string | null, axe?: string | null, add?: string | null) =>
    `<tr><td style="${td}font-weight:bold;">${oeil}</td>` +
    `<td style="${tdc}">${esc(fmt(sph))}</td><td style="${tdc}">${esc(fmt(cyl))}</td>` +
    `<td style="${tdc}">${axe ? esc(axe) + "&deg;" : "—"}</td><td style="${tdc}">${esc(fmt(add))}</td></tr>`

  return `
  <div style="display:flex;justify-content:space-between;border-bottom:2px solid #1e293b;padding-bottom:16px;">
    <div>
      <h2 style="margin:0;font-size:22px;">${esc(clinique?.nom ?? "Clinique Ophtalmologique")}</h2>
      <p style="margin:4px 0 0;font-size:13px;color:#475569;">${esc(clinique?.adresse ?? "Adresse de la clinique")}</p>
      ${clinique?.telephone ? `<p style="margin:0;font-size:13px;color:#475569;">Tél : ${esc(clinique.telephone)}</p>` : ""}
    </div>
    <div style="text-align:right;font-size:11px;letter-spacing:2px;color:#64748b;text-transform:uppercase;">Ophtalmologie</div>
  </div>
  <h1 style="text-align:center;font-size:20px;letter-spacing:4px;text-transform:uppercase;margin:24px 0;color:#1e293b;">Ordonnance optique</h1>
  <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:24px;">
    <div>
      <p style="margin:2px 0;"><span style="${lbl}">Patient :</span> <b>${esc(nomPatient)}</b></p>
      <p style="margin:2px 0;"><span style="${lbl}">Âge :</span> ${esc(calcAge(patient?.date_naissance))}</p>
      ${patient?.code_patient ? `<p style="margin:2px 0;"><span style="${lbl}">Dossier :</span> ${esc(patient.code_patient)}</p>` : ""}
    </div>
    <div style="text-align:right;">
      <p style="margin:2px 0;"><span style="${lbl}">Date :</span> ${esc(dateStr)}</p>
      ${medecin ? `<p style="margin:2px 0;"><span style="${lbl}">Praticien :</span> Dr. ${esc(medecin.name)}</p>` : ""}
      <p style="margin:2px 0;"><span style="${lbl}">N° ordonnance :</span> #${prescription.id}</p>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
    <thead><tr style="background:#f1f5f9;">
      <th style="${td}text-align:left;">Œil</th><th style="${td}">Sphère</th><th style="${td}">Cylindre</th><th style="${td}">Axe</th><th style="${td}">Addition</th>
    </tr></thead>
    <tbody>
      ${row("OD (droit)", c?.ref_od_sphere, c?.ref_od_cylindre, c?.ref_od_axe, prescription.oeil_droit_add)}
      ${row("OG (gauche)", c?.ref_og_sphere, c?.ref_og_cylindre, c?.ref_og_axe, prescription.oeil_gauche_add)}
    </tbody>
  </table>
  <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:24px;">
    <div><p style="${lbl}margin:0;">Type de verre</p><p style="margin:2px 0;font-weight:bold;">${esc(typeVerreLabels[prescription.type_verre] ?? prescription.type_verre ?? "—")}</p></div>
    <div><p style="${lbl}margin:0;">Teinte</p><p style="margin:2px 0;font-weight:bold;">${esc(typeTeinteLabels[prescription.type_teinte] ?? prescription.type_teinte ?? "—")}</p></div>
  </div>
  ${prescription.remarques ? `<div style="font-size:14px;margin-bottom:24px;"><p style="${lbl}margin:0;">Remarques</p><p style="margin:4px 0;white-space:pre-wrap;">${esc(prescription.remarques)}</p></div>` : ""}
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:48px;padding-top:24px;border-top:1px solid #cbd5e1;font-size:13px;">
    <div style="font-size:11px;color:#64748b;max-width:60%;">
      <p style="margin:0;">Ordonnance valable 1 an à compter de la date d'émission.</p>
      ${prescription.qr_token ? `<p style="margin:4px 0 0;font-family:monospace;">Réf. opticien : ${esc(prescription.qr_token.slice(0, 16))}…</p>` : ""}
    </div>
    <div style="text-align:center;">
      <div style="height:64px;width:200px;border-bottom:1px solid #94a3b8;"></div>
      <p style="font-size:11px;color:#64748b;margin:4px 0 0;">Signature &amp; cachet${medecin ? " — Dr. " + esc(medecin.name) : ""}</p>
    </div>
  </div>`
}

/** Génère un document HTML autonome et lance l'impression dans une fenêtre dédiée. */
export function printPrescription(prescription: BackendPrescription, patientName?: string) {
  const win = window.open("", "_blank", "width=900,height=1000")
  if (!win) return
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8" />
    <title>Ordonnance #${prescription.id}${patientName ? " - " + esc(patientName) : ""}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #0f172a; }
      .wrap { width: 210mm; margin: 0 auto; padding: 18mm 16mm; }
      @page { size: A4; margin: 0; }
    </style></head><body><div class="wrap">${buildPrintHtml(prescription, patientName)}</div>
    <script>window.onload = function(){ window.focus(); window.print(); setTimeout(function(){ window.close(); }, 300); };<\/script>
    </body></html>`)
  win.document.close()
}

export { Printer, Eye }
