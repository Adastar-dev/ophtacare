<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionLog extends Model
{
    protected $fillable = [
        'paiement_id',
        'rendez_vous_id',
        'user_id',
        'reference',
        'type_evenement',
        'operateur',
        'montant',
        'payload_requete',
        'payload_reponse',
        'http_status',
        'message',
        'ip',
    ];

    protected $casts = [
        'payload_requete' => 'array',
        'payload_reponse' => 'array',
        'montant' => 'decimal:2',
    ];

    public function paiement(): BelongsTo
    {
        return $this->belongsTo(Paiement::class);
    }

    public function rendezVous(): BelongsTo
    {
        return $this->belongsTo(RendezVous::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
