<?php

namespace App\Services\Payment;

use App\Contracts\PaymentProviderInterface;
use Illuminate\Support\Str;

class WaveProviderMock implements PaymentProviderInterface
{
    public function initierPaiement(array $donnees): array
    {
        $referenceOperateur = 'WAVE-' . strtoupper(Str::random(10));

        return [
            'success' => true,
            'operateur' => 'wave',
            'reference_operateur' => $referenceOperateur,
            'transaction_id' => null,
            'url_paiement' => "https://mock.wave.com/pay/{$referenceOperateur}",
            'montant' => $donnees['montant'],
            'devise' => 'XOF',
            'expire_at' => now()->addMinutes(15)->toIso8601String(),
            'message' => 'Lien de paiement Wave généré (MOCK). Valide 15 minutes.',
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
            'message' => 'Paiement en attente de confirmation Wave (MOCK — aucun callback reçu).',
        ];
    }

    public function traiterCallback(array $payload): array
    {
        $statut = $payload['status'] ?? 'failed';

        return [
            'reference_operateur' => $payload['checkout_id'] ?? null,
            'transaction_id' => $payload['transaction_id'] ?? null,
            'statut' => $statut === 'succeeded' ? 'reussi' : 'echoue',
            'montant' => $payload['amount'] ?? null,
            'message' => "Callback Wave traité (MOCK). Statut: {$statut}",
        ];
    }
}
