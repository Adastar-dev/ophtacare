<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    protected $fillable = [
        'code_patient',
        'nom',
        'prenom',
        'date_naissance',
        'genre',
        'telephone',
        'email',
        'antecedents_medicaux',
        'allergies',
        'assureur',
        'numero_assurance',
        'taux_couverture',
        'clinique_id',
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'taux_couverture' => 'integer',
    ];

    // Indique si le patient dispose d'une prise en charge assurance valide
    public function getHasAssuranceAttribute(): bool
    {
        return !empty($this->assureur) && !empty($this->numero_assurance);
    }

    // Un patient appartient à une clinique
    public function clinique(): BelongsTo
    {
        return $this->belongsTo(Clinique::class);
    }

    // Un patient a plusieurs rendez-vous
    public function rendezVous(): HasMany
    {
        return $this->hasMany(RendezVous::class);
    }

    // Un patient a plusieurs consultations
    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    // Un patient reçoit plusieurs rappels
    public function rappels(): HasMany
    {
        return $this->hasMany(Rappel::class);
    }
}