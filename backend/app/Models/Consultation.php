<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Consultation extends Model
{
    protected $fillable = [
        'rendez_vous_id',
        'patient_id',
        'user_id',
        'vl_od_sans_correction', 'vl_od_avec_correction',
        'vl_og_sans_correction', 'vl_og_avec_correction',
        'vp_od_sans_correction', 'vp_od_avec_correction',
        'vp_og_sans_correction', 'vp_og_avec_correction',
        'ref_od_sphere', 'ref_od_cylindre', 'ref_od_axe',
        'ref_og_sphere', 'ref_og_cylindre', 'ref_og_axe',
        'tonus_od', 'tonus_og',
        'observations_cliniques',
        'diagnostic'
    ];

    // Sécurité : Chiffrement automatique en base de données (AES-256)
    protected $casts = [
        'observations_cliniques' => 'encrypted',
        'diagnostic' => 'encrypted',
        'ref_od_sphere' => 'decimal:2',
        'ref_od_cylindre' => 'decimal:2',
        'ref_og_sphere' => 'decimal:2',
        'ref_og_cylindre' => 'decimal:2',
    ];

    public function rendezVous(): BelongsTo
    {
        return $this->belongsTo(RendezVous::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function medecin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Une consultation débouche sur une ordonnance/prescription
    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class);
    }
}