<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Patient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Inscription d'un patient (compte client en self-service).
     * Crée la fiche patient + le compte utilisateur de rôle "patient" lié.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|unique:patients,email',
            'password' => 'required|string|min:6',
            'telephone' => 'required|string|unique:patients,telephone',
            'date_naissance' => 'required|date|before:today',
            'genre' => 'required|in:M,F',
            'clinique_id' => 'nullable|exists:cliniques,id',
            // Informations d'assurance (optionnelles)
            'assureur' => 'nullable|string|max:255',
            'numero_assurance' => 'nullable|string|max:255',
            'taux_couverture' => 'nullable|integer|min:0|max:100',
        ]);

        $cliniqueId = $validated['clinique_id'] ?? 1; // Clinique par défaut

        $result = DB::transaction(function () use ($validated, $cliniqueId) {
            // Génération du code patient PAT-ANNEE-COMPTEUR
            $annee = date('Y');
            $dernier = Patient::where('code_patient', 'like', "PAT-{$annee}-%")->latest('id')->first();
            $numero = $dernier
                ? str_pad(((int) substr($dernier->code_patient, -4)) + 1, 4, '0', STR_PAD_LEFT)
                : '0001';

            $patient = Patient::create([
                'code_patient' => "PAT-{$annee}-{$numero}",
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'date_naissance' => $validated['date_naissance'],
                'genre' => $validated['genre'],
                'telephone' => $validated['telephone'],
                'email' => $validated['email'],
                'assureur' => $validated['assureur'] ?? null,
                'numero_assurance' => $validated['numero_assurance'] ?? null,
                'taux_couverture' => $validated['taux_couverture'] ?? null,
                'clinique_id' => $cliniqueId,
            ]);

            $user = User::create([
                'name' => $validated['prenom'] . ' ' . $validated['nom'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'patient',
                'clinique_id' => $cliniqueId,
                'patient_id' => $patient->id,
                'is_active' => true,
            ]);

            return [$user, $patient];
        });

        [$user, $patient] = $result;

        $token = $user->createToken('auth_token', ['patient'])->plainTextToken;

        return response()->json([
            'message' => 'Compte patient créé avec succès.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'clinique_id' => $user->clinique_id,
                'patient_id' => $user->patient_id,
                'patient' => $patient,
            ],
        ], 201);
    }

    // Méthode de Connexion (Login)
    public function login(Request $request)
    {
        // 1. Validation des données reçues par l'API
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. Recherche de l'utilisateur dans la table users
        $user = User::where('email', $request->email)->first();

        // 3. Vérification si l'utilisateur existe et si le mot de passe correspond
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Identifiants incorrects.'
            ], 401);
        }

        // 4. Vérification si le compte est actif
        if (! $user->is_active) {
            return response()->json([
                'message' => 'Votre compte a été désactivé par l\'administrateur.'
            ], 403);
        }

        // 5. Génération du Token de sécurité Sanctum
        $token = $user->createToken('auth_token', [$user->role])->plainTextToken;

        // 6. Réponse JSON renvoyée à React
        return response()->json([
            'message' => 'Connexion réussie',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'clinique_id' => $user->clinique_id,
                'patient_id' => $user->patient_id,
                'patient' => $user->role === 'patient' ? $user->patient : null,
            ]
        ], 200);
    }

    // Méthode de Déconnexion (Logout)
    public function logout(Request $request)
    {
        // Supprime le token qui a servi à faire la requête actuelle
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie. Token supprimé.'
        ], 200);
    }
}