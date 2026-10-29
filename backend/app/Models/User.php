<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'clinique_id',
        'patient_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // Un utilisateur appartient à une clinique (sauf le super_admin qui peut être hors clinique)
    public function clinique(): BelongsTo
    {
        return $this->belongsTo(Clinique::class);
    }

    // Un utilisateur de rôle "patient" est relié à sa fiche patient
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    // Un médecin gère plusieurs consultations
    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    // Un caissier ou utilisateur peut enregistrer plusieurs paiements
    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    // Un médecin ou secrétaire gère plusieurs rendez-vous
    public function rendezVous(): HasMany
    {
        return $this->hasMany(RendezVous::class);
    }

    // Logs d'activité liés à cet utilisateur
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}