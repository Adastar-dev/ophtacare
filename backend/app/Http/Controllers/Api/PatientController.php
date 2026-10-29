<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Patient;
use Illuminate\Support\Facades\Auth;

class PatientController extends Controller
{
    /**
     * Fiche du patient connecté (compte client).
     */
    public function me()
    {
        $user = Auth::user();

        if ($user->role !== 'patient' || !$user->patient_id) {
            return response()->json(['message' => 'Aucune fiche patient associée à ce compte.'], 404);
        }

        return response()->json(
            Patient::with(['rendezVous' => fn($q) => $q->orderBy('date_heure_rdv', 'desc')])
                ->findOrFail($user->patient_id),
            200
        );
    }

    /**
     * Mise à jour par le patient de ses informations personnelles et d'assurance.
     */
    public function updateMe(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient' || !$user->patient_id) {
            return response()->json(['message' => 'Aucune fiche patient associée à ce compte.'], 404);
        }

        $patient = Patient::findOrFail($user->patient_id);

        $validated = $request->validate([
            'telephone' => 'sometimes|string|unique:patients,telephone,' . $patient->id,
            'antecedents_medicaux' => 'sometimes|nullable|string',
            'allergies' => 'sometimes|nullable|string',
            'assureur' => 'sometimes|nullable|string|max:255',
            'numero_assurance' => 'sometimes|nullable|string|max:255',
            'taux_couverture' => 'sometimes|nullable|integer|min:0|max:100',
        ]);

        $patient->update($validated);

        return response()->json([
            'message' => 'Informations mises à jour.',
            'patient' => $patient->fresh(),
        ], 200);
    }

    /**
     * Afficher la liste des patients de la clinique de l'utilisateur connecté.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'patient') {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        // Le Super-Admin peut voir tous les patients, les autres ne voient que ceux de leur clinique
        if ($user->role === 'super_admin') {
            $patients = Patient::with('clinique')->get();
        } else {
            $patients = Patient::where('clinique_id', $user->clinique_id)->get();
        }

        return response()->json($patients, 200);
    }

    /**
     * Enregistrer un nouveau patient (Droits : Secrétaire, Admin ou Super-Admin).
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Sécurisation stricte : Les médecins, caissiers et patients ne créent pas de fiches administratives
        if (in_array($user->role, ['medecin', 'caissier', 'patient'])) {
            return response()->json(['message' => 'Action non autorisée pour votre profil.'], 403);
        }

        // Validation des champs
        $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'date_naissance' => 'required|date',
            'genre' => 'required|in:M,F',
            'telephone' => 'required|string|unique:patients,telephone',
            'email' => 'nullable|email|unique:patients,email',
            'antecedents_medicaux' => 'nullable|string',
            'allergies' => 'nullable|string',
            'assureur' => 'nullable|string|max:255',
            'numero_assurance' => 'nullable|string|max:255',
            'taux_couverture' => 'nullable|integer|min:0|max:100',
        ]);

        // Détermination de la clinique (si super_admin, il doit préciser la clinique dans la requête)
        $cliniqueId = $user->role === 'super_admin' ? $request->clinique_id : $user->clinique_id;

        if (!$cliniqueId) {
            return response()->json(['message' => 'La clinique est obligatoire pour cette action.'], 422);
        }

        // Génération automatique du code patient unique : PAT-ANNEE-COMPTEUR
        $annee = date('Y');
        $dernierPatient = Patient::where('code_patient', 'like', "PAT-{$annee}-%")->latest()->first();
        
        if ($dernierPatient) {
            // Extrait le numéro de fin et l'incrémente (ex: PAT-2026-0001 -> 0002)
            $dernierNumero = (int) substr($dernierPatient->code_patient, -4);
            $nouveauNumero = str_pad($dernierNumero + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $nouveauNumero = '0001';
        }
        
        $codePatient = "PAT-{$annee}-{$nouveauNumero}";

        // Création en base
        $patient = Patient::create([
            'code_patient' => $codePatient,
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'date_naissance' => $request->date_naissance,
            'genre' => $request->genre,
            'telephone' => $request->telephone,
            'email' => $request->email,
            'antecedents_medicaux' => $request->antecedents_medicaux,
            'allergies' => $request->allergies,
            'assureur' => $request->assureur,
            'numero_assurance' => $request->numero_assurance,
            'taux_couverture' => $request->taux_couverture,
            'clinique_id' => $cliniqueId,
        ]);

        return response()->json([
            'message' => 'Fiche patient créée avec succès.',
            'patient' => $patient
        ], 201);
    }

    /**
     * Afficher les détails d'un patient spécifique (avec son historique).
     */
    public function show($id)
    {
        $user = Auth::user();
        
        // On récupère le patient avec ses consultations (historique de la vue)
        $patient = Patient::with(['consultations.medecin', 'rendezVous'])->findOrFail($id);

        // Vérification de la barrière de l'entité (Multi-cliniques)
        if ($user->role !== 'super_admin' && $patient->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Accès refusé. Ce patient appartient à une autre entité.'], 403);
        }

        return response()->json($patient, 200);
    }
}