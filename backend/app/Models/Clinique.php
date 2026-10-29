<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Clinique extends Model
{
    protected $fillable = ['nom', 'adresse', 'telephone', 'statut'];

    // Une clinique possède plusieurs utilisateurs (personnel)
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    // Une clinique possède plusieurs patients
    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }

    // Une clinique possède plusieurs rendez-vous
    public function rendezVous(): HasMany
    {
        return $this->hasMany(RendezVous::class);
    }
}