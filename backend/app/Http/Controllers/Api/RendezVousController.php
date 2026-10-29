<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RendezVous;
use App\Models\Patient;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RendezVousController extends Controller
{
    /**
     * Liste les RDV de la clinique (filtrables par date et statut).
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = RendezVous::with(['patient', 'medecin'])
            ->where('clinique_id', $user->clinique_id);

        if ($user->role === 'super_admin') {
            $query = RendezVous::with(['patient', 'medecin', 'clinique']);
        }

        // Un patient ne voit que ses propres rendez-vous
        if ($user->role === 'patient') {
            $query = RendezVous::with(['patient', 'medecin', 'paiements', 'consultation.prescription'])
                ->where('patient_id', $user->patient_id);
        }

        // Un médecin peut filtrer sur ses propres rendez-vous assignés
        if ($user->role === 'medecin' && $request->boolean('mine')) {
            $query->where('user_id', $user->id);
        }

        if ($request->boolean('with_consultation')) {
            $query->with('consultation.prescription');
        }

        if ($request->filled('date')) {
            $query->whereDate('date_heure_rdv', $request->date);
        }

        if ($request->filled('statut_rdv')) {
            $query->where('statut_rdv', $request->statut_rdv);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $rdvs = $query->orderBy('date_heure_rdv', 'asc')->get();

        return response()->json($rdvs, 200);
    }

    /**
     * Créer un nouveau rendez-vous.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (in_array($user->role, ['medecin', 'caissier'])) {
            return response()->json(['message' => 'Action non autorisée pour votre profil.'], 403);
        }

        $estPatient = $user->role === 'patient';

        $validated = $request->validate([
            // Le patient connecté réserve pour lui-même : patient_id ignoré/forcé
            'patient_id' => [$estPatient ? 'nullable' : 'required', 'exists:patients,id'],
            'user_id' => 'nullable|exists:users,id',
            'date_heure_rdv' => 'required|date|after:now',
            'motif' => 'nullable|string|max:500',
            'montant_total' => 'required|numeric|min:0',
            // Prise en charge assurance : option JUSTIFIÉE (taux + document à l'appui)
            'prise_en_charge_assurance' => 'sometimes|boolean',
            'taux_prise_en_charge' => 'required_if:prise_en_charge_assurance,1,true|nullable|integer|min:1|max:100',
            'document_prise_en_charge' => 'required_if:prise_en_charge_assurance,1,true|nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        // Détermination du patient ciblé
        $patientId = $estPatient ? $user->patient_id : $validated['patient_id'];
        if (!$patientId) {
            return response()->json(['message' => 'Aucune fiche patient associée à ce compte.'], 422);
        }

        $patient = Patient::findOrFail($patientId);

        if (!$estPatient && $user->role !== 'super_admin' && $patient->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Ce patient n\'appartient pas à votre clinique.'], 403);
        }

        // ── Règle métier de facturation ──
        // Prix initial = montant_total.
        //  · SANS prise en charge : acompte = 50% du total (le solde se règle ensuite).
        //  · AVEC prise en charge : l'assurance couvre `taux`% du total ; le reste
        //    (part patient) doit être payé EN ENTIER pour valider le rendez-vous.
        $montantTotal = round((float) $validated['montant_total'], 2);
        $priseEnCharge = (bool) ($validated['prise_en_charge_assurance'] ?? false);

        $documentPath = null;

        if ($priseEnCharge) {
            $taux = (int) $validated['taux_prise_en_charge'];
            $montantAssurance = round($montantTotal * $taux / 100, 2);
            $montantPatient = round($montantTotal - $montantAssurance, 2);
            // Le reste patient doit être réglé intégralement pour valider le RDV
            $montantAcompte = $montantPatient;

            if ($request->hasFile('document_prise_en_charge')) {
                $documentPath = $request->file('document_prise_en_charge')
                    ->store('prises_en_charge', 'public');
            }
        } else {
            $taux = null;
            $montantAssurance = 0.00;
            $montantPatient = $montantTotal;
            $montantAcompte = round($montantTotal / 2, 2); // acompte 50%
        }

        $rdv = RendezVous::create([
            'patient_id' => $patientId,
            'user_id' => $estPatient ? ($validated['user_id'] ?? null) : ($validated['user_id'] ?? null),
            'clinique_id' => $estPatient || $user->role === 'super_admin' ? $patient->clinique_id : $user->clinique_id,
            'date_heure_rdv' => $validated['date_heure_rdv'],
            'statut_rdv' => 'en_attente_paiement',
            'statut_paiement' => 'non_paye',
            'prise_en_charge_assurance' => $priseEnCharge,
            'taux_prise_en_charge' => $taux,
            'montant_total' => $montantTotal,
            'montant_assurance' => $montantAssurance,
            'montant_patient' => $montantPatient,
            'montant_acompte' => $montantAcompte,
            'document_prise_en_charge' => $documentPath,
            'motif' => $validated['motif'] ?? null,
        ]);

        ActivityLogService::log('rendez_vous.created', $rdv, [], $rdv->toArray(), $request);

        return response()->json([
            'message' => $priseEnCharge
                ? 'Rendez-vous créé. Prise en charge ' . $taux . '% : il reste ' . number_format($montantPatient, 0, ',', ' ') . ' F CFA à régler intégralement pour valider le rendez-vous.'
                : 'Rendez-vous créé. Acompte de 50% (' . number_format($montantAcompte, 0, ',', ' ') . ' F CFA) requis pour valider le rendez-vous.',
            'rendez_vous' => $rdv->load('patient'),
        ], 201);
    }

    /**
     * Détails d'un RDV avec son historique de paiements.
     */
    public function show($id)
    {
        $user = Auth::user();

        $rdv = RendezVous::with(['patient', 'medecin', 'paiements', 'consultation.prescription'])->findOrFail($id);

        if ($user->role === 'patient') {
            if ($rdv->patient_id !== $user->patient_id) {
                return response()->json(['message' => 'Accès refusé.'], 403);
            }
        } elseif ($user->role !== 'super_admin' && $rdv->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json($rdv, 200);
    }

    /**
     * Mettre à jour le statut ou le médecin assigné.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if (in_array($user->role, ['caissier'])) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $rdv = RendezVous::findOrFail($id);

        if ($user->role !== 'super_admin' && $rdv->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $anciennesValeurs = $rdv->only(['statut_rdv', 'user_id', 'date_heure_rdv']);

        $validated = $request->validate([
            'statut_rdv' => 'sometimes|in:en_attente_paiement,confirme,annule,honore,expire',
            'user_id' => 'sometimes|nullable|exists:users,id',
            'date_heure_rdv' => 'sometimes|date',
            'motif' => 'sometimes|nullable|string',
        ]);

        $rdv->update($validated);

        ActivityLogService::log('rendez_vous.updated', $rdv, $anciennesValeurs, $rdv->fresh()->toArray(), $request);

        return response()->json([
            'message' => 'Rendez-vous mis à jour.',
            'rendez_vous' => $rdv->fresh()->load('patient'),
        ], 200);
    }

    /**
     * Annuler un rendez-vous.
     */
    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role === 'caissier') {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $rdv = RendezVous::findOrFail($id);

        if ($user->role !== 'super_admin' && $rdv->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $rdv->update(['statut_rdv' => 'annule']);

        ActivityLogService::log('rendez_vous.annule', $rdv, ['statut_rdv' => $rdv->getOriginal('statut_rdv')], ['statut_rdv' => 'annule']);

        return response()->json(['message' => 'Rendez-vous annulé.'], 200);
    }
}
