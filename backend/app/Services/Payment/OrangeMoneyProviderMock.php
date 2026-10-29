<?php

namespace App\Services\Payment;

use App\Contracts\PaymentProviderInterface;
use Illuminate\Support\Str;

class OrangeMoneyProviderMock implements PaymentProviderInterface
{
    public function initierPaiement(array $donnees): array
    {
        $referenceOperateur = 'OM-' . strtoupper(Str::random(12));

        return [
            'success' => true,
            'operateur' => 'orange_money',
            'reference_operateur' => $referenceOperateur,
            'transaction_id' => null,
            'url_paiement' => "https://mock.orangemoney.sn/pay/{$referenceOperateur}",
            'montant' => $donnees['montant'],
            'devise' => 'XOF',
            'expire_at' => now()->addMinutes(10)->toIso8601String(),
            'message' => 'Lien de paiement Orange Money généré (MOCK). Valide 10 minutes.',
        ];
    }

    public function verifierStatut(string $referenceOperateur): array
    {
        // En mode MOCK, on ne peut pas confirmer sans vrai callback opérateur.
        // Le statut reste en_attente jusqu'à réception d'un callback réel.
        return [
            'reference_operateur' => $referenceOperateur,
            'statut' => 'en_attente',
            'transaction_id' => null,
            'message' => 'Paiement en attente de confirmation Orange Money (MOCK — aucun callback reçu).',
        ];
    }

    public function traiterCallback(array $payload): array
    {
        $statut = $payload['status'] ?? 'FAILED';

        return [
            'reference_operateur' => $payload['pay_token'] ?? null,
            'transaction_id' => $payload['txnid'] ?? null,
            'statut' => $statut === 'SUCCESS' ? 'reussi' : 'echoue',
            'montant' => $payload['amount'] ?? null,
            'message' => "Callback Orange Money traité (MOCK). Statut: {$statut}",
        ];
    }
}
