<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    protected $fillable = [
        'rendez_vous_id',
        'user_id',
        'montant',
        'type_paiement',
        'mode_paiement',
        'transaction_id',
        'reference_operateur',
        'statut',
        'devise',
        'metadata',
        'expire_at',
    ];

    protected $casts = [
        'montant'   => 'decimal:2',
        'metadata'  => 'array',
        'expire_at' => 'datetime',
    ];

    public function rendezVous(): BelongsTo
    {
        return $this->belongsTo(RendezVous::class);
    }

    // Le caissier qui a enregistré le paiement (si fait en liquide)
    public function caissier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}