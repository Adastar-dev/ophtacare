<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Indisponibilite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IndisponibiliteController extends Controller
{
    /**
     * Lister les indisponibilités de la clinique.
     * Accessible à tous les rôles authentifiés (pour griser les créneaux
     * dans le calendrier patient / secrétaire / médecin).
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Indisponibilite::with('medecin:id,name');

        if ($user->role !== 'super_admin') {
            $query->where('clinique_id', $user->clinique_id);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        return response()->json(
            $query->orderBy('date')->orderBy('heure_debut')->get(),
            200
        );
    }

    /**
     * Créer une plage d'indisponibilité (médecin ou admin uniquement).
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (! in_array($user->role, ['medecin', 'admin_entite', 'super_admin'])) {
            return response()->json(['message' => 'Action non autorisée pour votre profil.'], 403);
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'heure_debut' => 'required|integer|min:0|max:23',
            'heure_fin' => 'required|integer|min:1|max:24|gt:heure_debut',
            'motif' => 'nullable|string|max:255',
            'user_id' => 'nullable|exists:users,id',
        ]);

        // Le médecin se met lui-même hors service ; un admin peut cibler un médecin.
        $targetUserId = $user->role === 'medecin'
            ? $user->id
            : ($validated['user_id'] ?? $user->id);

        $indispo = Indisponibilite::create([
            'user_id' => $targetUserId,
            'clinique_id' => $user->clinique_id,
            'date' => $validated['date'],
            'heure_debut' => $validated['heure_debut'],
            'heure_fin' => $validated['heure_fin'],
            'motif' => $validated['motif'] ?? null,
        ]);

        return response()->json([
            'message' => 'Indisponibilité enregistrée.',
            'indisponibilite' => $indispo->load('medecin:id,name'),
        ], 201);
    }

    /**
     * Supprimer une indisponibilité.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $indispo = Indisponibilite::findOrFail($id);

        if ($user->role !== 'super_admin' && $indispo->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        // Un médecin ne peut retirer que ses propres indisponibilités.
        if ($user->role === 'medecin' && $indispo->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $indispo->delete();

        return response()->json(['message' => 'Indisponibilité supprimée.'], 200);
    }
}
