<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rappel;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RappelController extends Controller
{
    /**
     * Lister les rappels d'un patient ou de la clinique.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Rappel::with('patient')
            ->whereHas('patient', fn($q) => $q->where('clinique_id', $user->clinique_id));

        if ($user->role === 'super_admin') {
            $query = Rappel::with('patient');
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->orderBy('date_planifiee')->get(), 200);
    }

    /**
     * Programmer un rappel manuel pour un patient.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'caissier') {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'type_rappel' => 'required|string|in:controle_annuel,suivi_traitement,relance_rdv,autre',
            'message' => 'required|string|max:500',
            'date_planifiee' => 'required|date|after:now',
        ]);

        $patient = Patient::findOrFail($validated['patient_id']);

        if ($user->role !== 'super_admin' && $patient->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Patient hors de votre clinique.'], 403);
        }

        $rappel = Rappel::create(array_merge($validated, ['statut' => 'en_attente']));

        return response()->json([
            'message' => 'Rappel programmé avec succès.',
            'rappel' => $rappel->load('patient'),
        ], 201);
    }

    /**
     * Marquer un rappel comme envoyé (simulation).
     */
    public function markAsSent($id)
    {
        $rappel = Rappel::findOrFail($id);
        $rappel->update(['statut' => 'envoye']);

        return response()->json(['message' => 'Rappel marqué comme envoyé.', 'rappel' => $rappel], 200);
    }
}
