<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultation_id',
        'contenu_ordonnance',
        'qr_token',
        'qr_token_expire_at',
    ];

    protected $casts = [
        'qr_token_expire_at' => 'datetime',
        'contenu_ordonnance' => 'array',
    ];

    // Expose les détails de l'ordonnance (stockés en JSON dans contenu_ordonnance)
    // au niveau racine pour rester compatible avec le frontend.
    protected $appends = [
        'type_verre', 'type_teinte', 'oeil_droit_add', 'oeil_gauche_add', 'remarques',
    ];

    public function getTypeVerreAttribute()
    {
        return $this->contenu_ordonnance['type_verre'] ?? null;
    }

    public function getTypeTeinteAttribute()
    {
        return $this->contenu_ordonnance['type_teinte'] ?? null;
    }

    public function getOeilDroitAddAttribute()
    {
        return $this->contenu_ordonnance['oeil_droit_add'] ?? null;
    }

    public function getOeilGaucheAddAttribute()
    {
        return $this->contenu_ordonnance['oeil_gauche_add'] ?? null;
    }

    public function getRemarquesAttribute()
    {
        return $this->contenu_ordonnance['remarques'] ?? null;
    }

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }
}