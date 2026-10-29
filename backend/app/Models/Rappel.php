<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rappel extends Model
{
    protected $fillable = [
        'patient_id',
        'type_rappel',
        'message',
        'date_planifiee',
        'statut',
    ];

    protected $casts = [
        'date_planifiee' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
