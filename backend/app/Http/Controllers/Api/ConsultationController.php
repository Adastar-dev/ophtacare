<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Consultation;
use App\Models\RendezVous;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ConsultationController extends Controller
{
    /**
     * Lister les consultations accessibles selon le rôle de l'utilisateur.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Consultation::with(['patient', 'medecin', 'prescription'])->latest();

        if ($user->role === 'super_admin') {
            // Aucun filtre
        } elseif ($user->role === 'patient') {
            if (! $user->patient_id) {
                return response()->json([], 200);
            }
            $query->where('patient_id', $user->patient_id);
        } elseif (in_array($user->role, ['medecin', 'admin_entite', 'secretaire', 'caissier'])) {
            // Dossier médical partagé : toutes les consultations des patients de la clinique
            $query->whereHas('patient', function ($q) use ($user) {
                $q->where('clinique_id', $user->clinique_id);
            });
        } else {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }
        if ($request->filled('user_id') && $user->role !== 'patient') {
            $query->where('user_id', $request->user_id);
        }

        return response()->json($query->get(), 200);
    }

    /**
     * Enregistrer un nouvel examen ophtalmologique (Droit réservé aux Médecins).
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Sécurisation : Seul un médecin a le droit de mener une consultation médicale
        if ($user->role !== 'medecin') {
            return response()->json(['message' => 'Accès refusé. Seuls les médecins peuvent enregistrer une consultation.'], 403);
        }

        // Validation alignée sur le payload plat envoyé par le frontend.
        // Le rendez-vous est optionnel : une consultation peut être créée
        // directement à partir d'un patient (patient_id).
        $validator = Validator::make($request->all(), [
            'rendez_vous_id' => 'nullable|exists:rendez_vous,id',
            'patient_id'     => 'required_without:rendez_vous_id|nullable|exists:patients,id',

            'diagnostic'              => 'nullable|string',
            'observations_cliniques'  => 'nullable|string',

            'vl_od_sans_correction'   => 'nullable|string|max:50',
            'vl_og_sans_correction'   => 'nullable|string|max:50',
            'ref_od_sphere'           => 'nullable|string|max:50',
            'ref_od_cylindre'         => 'nullable|string|max:50',
            'ref_od_axe'              => 'nullable|string|max:50',
            'ref_og_sphere'           => 'nullable|string|max:50',
            'ref_og_cylindre'         => 'nullable|string|max:50',
            'ref_og_axe'              => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation des données cliniques.',
                'errors' => $validator->errors()
            ], 422);
        }

        // Résolution du patient et de la clinique : via le RDV s'il existe, sinon via patient_id
        $rdv = null;
        if ($request->filled('rendez_vous_id')) {
            $rdv = RendezVous::findOrFail($request->rendez_vous_id);
            if ($user->role !== 'super_admin' && $rdv->clinique_id !== $user->clinique_id) {
                return response()->json(['message' => 'Ce rendez-vous n\'appartient pas à votre établissement.'], 403);
            }
            $patientId = $rdv->patient_id;
        } else {
            $patient = \App\Models\Patient::findOrFail($request->patient_id);
            if ($user->role !== 'super_admin' && $patient->clinique_id !== $user->clinique_id) {
                return response()->json(['message' => 'Ce patient n\'appartient pas à votre établissement.'], 403);
            }
            $patientId = $patient->id;
        }

        try {
            $consultation = Consultation::create([
                'rendez_vous_id'         => $rdv?->id,
                'patient_id'             => $patientId,
                'user_id'                => $user->id,

                'vl_od_sans_correction'  => $request->vl_od_sans_correction,
                'vl_og_sans_correction'  => $request->vl_og_sans_correction,
                'ref_od_sphere'          => $request->ref_od_sphere ?? '0.00',
                'ref_od_cylindre'        => $request->ref_od_cylindre ?? '0.00',
                'ref_od_axe'             => $request->ref_od_axe ?? '0',
                'ref_og_sphere'          => $request->ref_og_sphere ?? '0.00',
                'ref_og_cylindre'        => $request->ref_og_cylindre ?? '0.00',
                'ref_og_axe'             => $request->ref_og_axe ?? '0',

                'tonus_od'               => null,
                'tonus_og'               => null,

                'observations_cliniques' => $request->observations_cliniques,
                'diagnostic'             => $request->diagnostic,
            ]);

            // Mise à jour automatique du statut du Rendez-vous -> "honoré"
            if ($rdv) {
                $rdv->update(['statut_rdv' => 'honore']);
            }

            return response()->json([
                'message' => 'Consultation ophtalmologique enregistrée avec succès. Données cliniques sécurisées.',
                'consultation' => $consultation
            ], 201);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Consultation store failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Une erreur interne est survenue lors de l\'enregistrement de l\'examen.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Voir les détails d'une consultation (Déchiffrement transparent automatique).
     */
    public function show($id)
    {
        $user = Auth::user();
        
        // Seuls le médecin et l'admin local peuvent auditer/voir un dossier clinique complet
        if (in_array($user->role, ['secretaire', 'caissier'])) {
            return response()->json(['message' => 'Accès refusé aux dossiers médicaux.'], 403);
        }

        // On inclut les relations nécessaires pour remonter jusqu'au patient
        $consultation = Consultation::with(['patient', 'medecin', 'prescription'])->findOrFail($id);

        // Barrière multi-entité
        if ($user->role !== 'super_admin' && $consultation->patient->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Accès interdit. Ce patient n\'est pas enregistré dans votre clinique.'], 403);
        }

        // Pour assurer la compatibilité ascendante avec ton module de prescription React, 
        // on génère à la volée les objets attendus s'ils ne sont pas castés en JSON en base de données.
        $consultation->oeil_droit = [
            'acuite'   => $consultation->vl_od_sans_correction,
            'sphere'   => $consultation->ref_od_sphere ?? '0.00',
            'cylindre' => $consultation->ref_od_cylindre ?? '0.00',
            'axe'      => $consultation->ref_od_axe ?? '0'
        ];

        $consultation->oeil_gauche = [
            'acuite'   => $consultation->vl_og_sans_correction,
            'sphere'   => $consultation->ref_og_sphere ?? '0.00',
            'cylindre' => $consultation->ref_og_cylindre ?? '0.00',
            'axe'      => $consultation->ref_og_axe ?? '0'
        ];

        return response()->json($consultation, 200);
    }
}