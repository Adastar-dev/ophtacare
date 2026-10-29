<?php

namespace App\Contracts;

interface PaymentProviderInterface
{
    /**
     * Initier un paiement et retourner l'URL de redirection + référence interne.
     */
    public function initierPaiement(array $donnees): array;

    /**
     * Vérifier le statut d'une transaction via la référence opérateur.
     */
    public function verifierStatut(string $referenceOperateur): array;

    /**
     * Traiter le payload d'un callback reçu de l'opérateur.
     */
    public function traiterCallback(array $payload): array;
}
