<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RendezVous extends Model
{
    // Indique à Laravel que la table correspondante est au pluriel mais garde cette forme
    protected $table = 'rendez_vous';

    protected $fillable = [
        'patient_id',
        'user_id',
        'clinique_id',
        'date_heure_rdv',
        'statut_rdv',
        'statut_paiement',
        'prise_en_charge_assurance',
        'taux_prise_en_charge',
        'montant_total',
        'montant_assurance',
        'montant_patient',
        'montant_acompte',
        'document_prise_en_charge',
        'motif',
    ];

    protected $casts = [
        'date_heure_rdv' => 'datetime',
        'montant_total' => 'decimal:2',
        'montant_assurance' => 'decimal:2',
        'montant_patient' => 'decimal:2',
        'montant_acompte' => 'decimal:2',
        'prise_en_charge_assurance' => 'boolean',
        'taux_prise_en_charge' => 'integer',
    ];

    protected $appends = ['montant_paye', 'reste_a_payer'];

    /**
     * Somme des paiements réussis sur ce rendez-vous.
     */
    public function getMontantPayeAttribute(): float
    {
        if (!$this->relationLoaded('paiements')) {
            return (float) $this->paiements()->where('statut', 'reussi')->sum('montant');
        }
        return (float) $this->paiements->where('statut', 'reussi')->sum('montant');
    }

    /**
     * Reste à payer par le patient (sa part - ce qu'il a déjà réglé).
     */
    public function getResteAPayerAttribute(): float
    {
        $du = (float) ($this->montant_patient ?: $this->montant_total);
        return max(0, round($du - $this->montant_paye, 2));
    }

    // Un rendez-vous appartient à un patient
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    // Un rendez-vous est assigné à un médecin (optionnel au départ)
    public function medecin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Un rendez-vous appartient à une clinique
    public function clinique(): BelongsTo
    {
        return $this->belongsTo(Clinique::class);
    }

    // Un rendez-vous peut avoir plusieurs transactions de paiement (Acompte puis Solde)
    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    // Un rendez-vous génère une consultation médicale
    public function consultation(): HasOne
    {
        return $this->hasOne(Consultation::class);
    }
}