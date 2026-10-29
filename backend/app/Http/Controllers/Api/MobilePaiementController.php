<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Contracts\PaymentProviderInterface;
use App\Models\Paiement;
use App\Models\RendezVous;
use App\Models\TransactionLog;
use App\Services\Payment\WaveProviderMock;
use App\Services\Payment\OrangeMoneyProviderMock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class MobilePaiementController extends Controller
{
    /**
     * Résoudre le bon provider selon le mode de paiement.
     */
    private function getProvider(string $mode): PaymentProviderInterface
    {
        return match ($mode) {
            'wave' => new WaveProviderMock(),
            'orange_money' => new OrangeMoneyProviderMock(),
            default => throw new \InvalidArgumentException("Opérateur '{$mode}' non supporté."),
        };
    }

    /**
     * Initier un paiement mobile (Wave ou Orange Money).
     */
    public function initier(Request $request)
    {
        $user = Auth::user();

        if (in_array($user->role, ['medecin', 'secretaire'])) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $validated = $request->validate([
            'rendez_vous_id' => 'required|exists:rendez_vous,id',
            'montant' => 'required|numeric|min:500',
            'mode_paiement' => 'required|in:wave,orange_money',
        ]);

        $rdv = RendezVous::with('patient')->findOrFail($validated['rendez_vous_id']);

        // Un patient ne peut payer que ses propres rendez-vous
        if ($user->role === 'patient') {
            if ((int) $rdv->patient_id !== (int) $user->patient_id) {
                return response()->json(['message' => 'Accès interdit.'], 403);
            }
        } elseif ($user->role !== 'super_admin' && (int) $rdv->clinique_id !== (int) $user->clinique_id) {
            return response()->json(['message' => 'Accès interdit.'], 403);
        }

        if ($rdv->statut_paiement === 'solde') {
            return response()->json(['message' => 'Ce rendez-vous a déjà été intégralement payé.'], 422);
        }

        // Part due par le patient et seuil minimum pour valider le RDV
        $montantPatientDu = (float) ($rdv->montant_patient ?: $rdv->montant_total);
        $acompteMin = (float) ($rdv->montant_acompte ?: ($montantPatientDu / 2));
        $dejaPaye = (float) $rdv->montant_paye;

        if ($rdv->statut_paiement === 'non_paye' && $validated['montant'] < $acompteMin) {
            $libelle = $rdv->prise_en_charge_assurance
                ? "Reste à charge à régler intégralement : "
                : "Acompte minimum requis (50%) : ";
            return response()->json([
                'message' => $libelle . number_format($acompteMin, 0, ',', ' ') . " F CFA.",
            ], 422);
        }

        if ($rdv->statut_paiement === 'acompte_verse') {
            $reste = max(0, round($montantPatientDu - $dejaPaye, 2));
            if ($validated['montant'] < $reste) {
                return response()->json([
                    'message' => "Solde restant à régler : " . number_format($reste, 0, ',', ' ') . " F CFA.",
                ], 422);
            }
        }

        try {
            $provider = $this->getProvider($validated['mode_paiement']);
            $patientNom = $rdv->patient
                ? trim($rdv->patient->nom . ' ' . $rdv->patient->prenom)
                : 'Patient #' . $rdv->patient_id;

            $resultat = $provider->initierPaiement([
                'montant' => $validated['montant'],
                'rendez_vous_id' => $rdv->id,
                'patient_nom' => $patientNom,
            ]);

            $typePaiement = $rdv->statut_paiement === 'non_paye'
                ? (($dejaPaye + $validated['montant']) >= $montantPatientDu ? 'total' : 'acompte')
                : 'solde';

            $paiement = Paiement::create([
                'rendez_vous_id' => $rdv->id,
                'user_id' => $user->id,
                'montant' => $validated['montant'],
                'type_paiement' => $typePaiement,
                'mode_paiement' => $validated['mode_paiement'],
                'reference_operateur' => $resultat['reference_operateur'],
                'statut' => 'en_attente',
                'devise' => 'XOF',
                'expire_at' => $resultat['expire_at'],
            ]);

            TransactionLog::create([
                'paiement_id' => $paiement->id,
                'rendez_vous_id' => $rdv->id,
                'user_id' => $user->id,
                'reference' => 'REF-' . date('Ymd') . '-' . strtoupper(Str::random(5)),
                'type_evenement' => 'initiation_paiement',
                'operateur' => $validated['mode_paiement'],
                'montant' => $validated['montant'],
                'payload_reponse' => $resultat,
                'message' => $resultat['message'],
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'message' => $resultat['message'],
                'url_paiement' => $resultat['url_paiement'],
                'reference_operateur' => $resultat['reference_operateur'],
                'paiement_id' => $paiement->id,
                'expire_at' => $resultat['expire_at'],
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'initiation du paiement.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Callback webhook reçu de l'opérateur (Wave ou Orange Money).
     * Route publique — sécurisée par signature ou secret header.
     */
    public function callback(Request $request, string $operateur)
    {
        // Le webhook est public : sans signature valide, n'importe qui pourrait
        // marquer un paiement comme réussi.
        $secret = (string) config('services.paiement.webhook_secret');
        if ($secret === '') {
            return response()->json(['message' => 'Webhook de paiement non configuré.'], 503);
        }
        $attendue = hash_hmac('sha256', $request->getContent(), $secret);
        if (! hash_equals($attendue, (string) $request->header('X-Ophtacare-Signature'))) {
            return response()->json(['message' => 'Signature invalide.'], 401);
        }

        $payload = $request->all();

        try {
            $provider = $this->getProvider($operateur);
            $resultat = $provider->traiterCallback($payload);

            $paiement = Paiement::where('reference_operateur', $resultat['reference_operateur'])->first();

            if (!$paiement) {
                return response()->json(['message' => 'Référence inconnue.'], 404);
            }

            $ancienStatut = $paiement->statut;
            $paiement->update([
                'statut' => $resultat['statut'],
                'transaction_id' => $resultat['transaction_id'],
                'metadata' => $payload,
            ]);

            TransactionLog::create([
                'paiement_id' => $paiement->id,
                'rendez_vous_id' => $paiement->rendez_vous_id,
                'reference' => 'REF-' . date('Ymd') . '-' . strtoupper(Str::random(5)),
                'type_evenement' => $resultat['statut'] === 'reussi' ? 'paiement_valide' : 'paiement_echoue',
                'operateur' => $operateur,
                'montant' => $paiement->montant,
                'payload_requete' => $payload,
                'message' => $resultat['message'],
                'ip' => $request->ip(),
            ]);

            if ($resultat['statut'] === 'reussi') {
                $rdv = $paiement->rendezVous;
                $nouveauStatutPaiement = $paiement->type_paiement === 'acompte'
                    ? 'acompte_verse'
                    : 'solde';
                $rdv->update([
                    'statut_paiement' => $nouveauStatutPaiement,
                    'statut_rdv' => $nouveauStatutPaiement === 'acompte_verse' ? 'confirme' : $rdv->statut_rdv,
                ]);
            }

            return response()->json(['message' => 'Callback traité.', 'statut' => $resultat['statut']], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur traitement callback.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Vérifier manuellement le statut d'un paiement mobile (polling).
     */
    public function verifierStatut($paiementId)
    {
        $user = Auth::user();
        $paiement = Paiement::with('rendezVous')->findOrFail($paiementId);

        if ($user->role === 'patient') {
            if ($paiement->rendezVous->patient_id !== $user->patient_id) {
                return response()->json(['message' => 'Accès refusé.'], 403);
            }
        } elseif ($user->role !== 'super_admin' && $paiement->rendezVous->clinique_id !== $user->clinique_id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if (!$paiement->reference_operateur) {
            return response()->json(['message' => 'Pas de référence opérateur pour ce paiement.'], 422);
        }

        $provider = $this->getProvider($paiement->mode_paiement);
        $resultat = $provider->verifierStatut($paiement->reference_operateur);

        if ($resultat['statut'] === 'reussi' && $paiement->statut !== 'reussi') {
            $paiement->update([
                'statut' => 'reussi',
                'transaction_id' => $resultat['transaction_id'],
            ]);

            $rdv = $paiement->rendezVous;
            $rdv->update([
                'statut_paiement' => $paiement->type_paiement === 'acompte' ? 'acompte_verse' : 'solde',
                'statut_rdv' => 'confirme',
            ]);
        }

        return response()->json([
            'statut_paiement' => $paiement->fresh()->statut,
            'transaction_id' => $paiement->fresh()->transaction_id,
            'message' => $resultat['message'],
        ], 200);
    }
}
