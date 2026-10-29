<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\TransactionLog;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\Paiement;
use App\Models\User;
use App\Models\Clinique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    /**
     * Liste publique des cliniques actives (utilisée par le formulaire
     * d'inscription patient pour choisir son centre).
     */
    public function cliniquesPubliques()
    {
        return response()->json(
            Clinique::where('statut', 'actif')->get(['id', 'nom', 'adresse', 'telephone']),
            200
        );
    }

    /**
     * Liste des médecins (pour l'assignation et la prise de RDV).
     * Accessible à tout utilisateur authentifié, filtré par clinique.
     */
    public function medecins()
    {
        $user = Auth::user();

        $query = User::where('role', 'medecin')->where('is_active', true);

        if ($user->role !== 'super_admin' && $user->clinique_id) {
            $query->where('clinique_id', $user->clinique_id);
        }

        return response()->json($query->get(['id', 'name', 'email', 'clinique_id']), 200);
    }

    /**
     * Tableau de bord : statistiques globales de la clinique.
     */
    public function dashboard()
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'admin_entite'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs.'], 403);
        }
        $cliniqueId = $user->clinique_id;

        $patientsQuery = Patient::query();
        $rdvQuery = RendezVous::query();
        $paiementsQuery = Paiement::query();

        if ($user->role !== 'super_admin') {
            $patientsQuery->where('clinique_id', $cliniqueId);
            $rdvQuery->where('clinique_id', $cliniqueId);
            $paiementsQuery->whereHas('rendezVous', fn($q) => $q->where('clinique_id', $cliniqueId));
        }

        $totalPatients = $patientsQuery->count();
        $rdvAujourdhui = (clone $rdvQuery)->whereDate('date_heure_rdv', today())->count();
        $rdvConfirmes = (clone $rdvQuery)->where('statut_rdv', 'confirme')->count();
        $recetteMois = (clone $paiementsQuery)->where('statut', 'reussi')
            ->whereMonth('created_at', now()->month)->sum('montant');

        $rdvParStatut = (clone $rdvQuery)->selectRaw('statut_rdv, count(*) as total')
            ->groupBy('statut_rdv')->pluck('total', 'statut_rdv');

        $recetteSemaine = (clone $paiementsQuery)->where('statut', 'reussi')
            ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->selectRaw('DATE(created_at) as date, SUM(montant) as total')
            ->groupBy('date')->orderBy('date')->get();

        return response()->json([
            'stats' => [
                'total_patients' => $totalPatients,
                'rdv_aujourd_hui' => $rdvAujourdhui,
                'rdv_confirmes' => $rdvConfirmes,
                'recette_mois' => $recetteMois,
            ],
            'rdv_par_statut' => $rdvParStatut,
            'recette_semaine' => $recetteSemaine,
        ], 200);
    }

    /**
     * Logs d'activité médicale.
     */
    public function activityLogs(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['super_admin', 'admin_entite'])) {
            return response()->json(['message' => 'Accès réservé aux administrateurs.'], 403);
        }

        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc');

        if ($user->role !== 'super_admin') {
            $query->where('clinique_id', $user->clinique_id);
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }

        return response()->json($query->paginate(50), 200);
    }

    /**
     * Logs de transactions financières.
     */
    public function transactionLogs(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['super_admin', 'admin_entite', 'caissier'])) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $query = TransactionLog::with(['paiement', 'user'])
            ->orderBy('created_at', 'desc');

        if ($user->role !== 'super_admin') {
            $query->whereHas('rendezVous', fn($q) => $q->where('clinique_id', $user->clinique_id));
        }

        return response()->json($query->paginate(50), 200);
    }

    /**
     * Liste des utilisateurs de la clinique (admin local).
     */
    public function users()
    {
        $user = Auth::user();

        if (!in_array($user->role, ['super_admin', 'admin_entite'])) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $query = $user->role === 'super_admin'
            ? User::with('clinique')->get()
            : User::where('clinique_id', $user->clinique_id)->get();

        return response()->json($query, 200);
    }

    /**
     * Créer un nouvel utilisateur du personnel (médecin, secrétaire, caissier, admin_entite).
     */
    public function storeUser(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['super_admin', 'admin_entite'])) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $rolesAutorises = $user->role === 'super_admin'
            ? ['admin_entite', 'medecin', 'secretaire', 'caissier']
            : ['medecin', 'secretaire', 'caissier'];

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:' . implode(',', $rolesAutorises),
            'clinique_id' => 'nullable|exists:cliniques,id',
        ]);

        $cliniqueId = $user->role === 'super_admin'
            ? ($validated['clinique_id'] ?? null)
            : $user->clinique_id;

        $nouvel = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => $validated['role'],
            'clinique_id' => $cliniqueId,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Utilisateur créé avec succès.',
            'user' => $nouvel,
        ], 201);
    }

    /**
     * Mettre à jour un utilisateur (rôle, activation).
     */
    public function updateUser(Request $request, $id)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['super_admin', 'admin_entite'])) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $cible = User::findOrFail($id);

        if ($user->role !== 'super_admin' && $cible->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:admin_entite,medecin,secretaire,caissier',
            'is_active' => 'sometimes|boolean',
            'password' => 'sometimes|nullable|string|min:8',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        $cible->update($validated);

        return response()->json([
            'message' => 'Utilisateur mis à jour.',
            'user' => $cible->fresh(),
        ], 200);
    }
}
