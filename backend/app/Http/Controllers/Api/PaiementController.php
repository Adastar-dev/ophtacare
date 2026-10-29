<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Paiement;
use App\Models\RendezVous;
use Illuminate\Support\Facades\Auth;

class PaiementController extends Controller
{
    /**
     * Enregistrer un encaissement (Droit réservé aux Caissiers, Admins, Super-Admins).
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Sécurisation : Un médecin ou une secrétaire ne touche pas à la caisse
        if (in_array($user->role, ['medecin', 'secretaire'])) {
            return response()->json(['message' => 'Accès refusé. Seuls les caissiers peuvent valider des paiements.'], 403);
        }

        // Validation de la transaction financière
        $request->validate([
            'rendez_vous_id' => 'required|exists:rendez_vous,id',
            'montant' => 'required|numeric|min:0',
            'mode_paiement' => 'required|in:liquide,wave,orange_money',
            'transaction_id' => 'nullable|string|unique:paiements,transaction_id', // Reçu par l'API Wave/OM
        ]);

        // Récupération du rendez-vous associé
        $rdv = RendezVous::findOrFail($request->rendez_vous_id);

        // Barrière multi-clinique
        if ($user->role !== 'super_admin' && $rdv->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Ce rendez-vous dépend d\'une autre entité clinique.'], 403);
        }

        // ── Seuils de la règle métier ──
        // Part due par le patient (total sans PEC, sinon reste après assurance)
        $montantPatientDu = (float) ($rdv->montant_patient ?: $rdv->montant_total);
        // Montant minimum exigé pour valider le RDV (50% sans PEC, 100% du reste avec PEC)
        $acompteMin = (float) ($rdv->montant_acompte ?: ($montantPatientDu / 2));
        $dejaPaye = (float) $rdv->montant_paye;

        // Détermination du type de paiement en fonction du montant versé
        if ($rdv->statut_paiement === 'non_paye') {
            if ($request->montant < $acompteMin) {
                $libelle = $rdv->prise_en_charge_assurance
                    ? "le reste à charge du patient (" . number_format($acompteMin, 0, ',', ' ') . " F CFA) doit être réglé intégralement"
                    : "un acompte d'au moins 50% (" . number_format($acompteMin, 0, ',', ' ') . " F CFA) est obligatoire";
                return response()->json([
                    'message' => "Le montant versé (" . number_format($request->montant, 0, ',', ' ') . " F CFA) est insuffisant : " . $libelle . " pour valider le rendez-vous."
                ], 422);
            }

            $typePaiement = ($dejaPaye + $request->montant >= $montantPatientDu) ? 'total' : 'acompte';
        } else if ($rdv->statut_paiement === 'acompte_verse') {
            $reste = max(0, round($montantPatientDu - $dejaPaye, 2));
            if ($request->montant < $reste) {
                return response()->json([
                    'message' => "Solde restant : " . number_format($reste, 0, ',', ' ') . " F CFA. Le montant versé est insuffisant."
                ], 422);
            }
            $typePaiement = 'solde';
        } else {
            return response()->json(['message' => 'Ce rendez-vous a déjà été soldé en totalité.'], 422);
        }

        // Enregistrement de la transaction en base de données
        $paiement = Paiement::create([
            'rendez_vous_id' => $rdv->id,
            'user_id' => $user->id, // Le caissier connecté
            'montant' => $request->montant,
            'type_paiement' => $typePaiement,
            'mode_paiement' => $request->mode_paiement,
            'transaction_id' => $request->transaction_id,
            'statut' => 'reussi', // Simulé réussi par défaut pour le guichet physique
        ]);

        // Mise à jour de l'état du rendez-vous selon le flux financier.
        // Dès qu'un acompte valide (ou la part patient) est encaissé, le RDV est confirmé.
        if ($typePaiement === 'acompte') {
            $rdv->update(['statut_paiement' => 'acompte_verse', 'statut_rdv' => 'confirme']);
        } else {
            $rdv->update(['statut_paiement' => 'solde', 'statut_rdv' => $rdv->statut_rdv === 'en_attente_paiement' ? 'confirme' : $rdv->statut_rdv]);
        }

        return response()->json([
            'message' => 'Paiement enregistré avec succès. Le parcours patient est mis à jour.',
            'paiement' => $paiement,
            'statut_actuel_rdv_paiement' => $rdv->statut_paiement
        ], 201);
    }

    /**
     * Obtenir l'historique de caisse ou les détails d'un ticket.
     */
    public function show($id)
    {
        $user = Auth::user();
        $paiement = Paiement::with('rendezVous.patient')->findOrFail($id);

        if ($user->role !== 'super_admin' && $paiement->rendezVous->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json($paiement, 200);
    }
}