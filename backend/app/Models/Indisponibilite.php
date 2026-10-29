<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Indisponibilite extends Model
{
    protected $table = 'indisponibilites';

    protected $fillable = [
        'user_id',
        'clinique_id',
        'date',
        'heure_debut',
        'heure_fin',
        'motif',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'heure_debut' => 'integer',
        'heure_fin' => 'integer',
    ];

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function clinique(): BelongsTo
    {
        return $this->belongsTo(Clinique::class);
    }
}
