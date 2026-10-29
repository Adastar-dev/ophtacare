<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('consultations', function (Blueprint $table) {
        $table->id();
        $table->foreignId('rendez_vous_id')->constrained('rendez_vous')->onDelete('cascade');
        $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Le médecin qui consulte
        
        // --- SPÉCIFICITÉS OPHTALMOLOGIQUES (OD / OG séparés) --- 
        
        // Acuité Visuelle de Loin (VL) [cite: 21]
        $table->string('vl_od_sans_correction')->nullable(); // [cite: 21]
        $table->string('vl_od_avec_correction')->nullable(); // [cite: 21]
        $table->string('vl_og_sans_correction')->nullable(); // [cite: 20, 21]
        $table->string('vl_og_avec_correction')->nullable(); // [cite: 20, 21]
        
        // Acuité Visuelle de Près (VP) [cite: 22]
        $table->string('vp_od_sans_correction')->nullable(); // [cite: 22]
        $table->string('vp_od_avec_correction')->nullable(); // [cite: 22]
        $table->string('vp_og_sans_correction')->nullable(); // [cite: 20, 22]
        $table->string('vp_og_avec_correction')->nullable(); // [cite: 20, 22]
        
        // Réfraction Automatique (Sphère, Cylindre, Axe) [cite: 23]
        // Œil Droit (OD)
        $table->decimal('ref_od_sphere', 5, 2)->nullable(); // [cite: 23]
        $table->decimal('ref_od_cylindre', 5, 2)->nullable(); // [cite: 23]
        $table->integer('ref_od_axe')->nullable(); // [cite: 23]
        // Œil Gauche (OG)
        $table->decimal('ref_og_sphere', 5, 2)->nullable(); // [cite: 20, 23]
        $table->decimal('ref_og_cylindre', 5, 2)->nullable(); // [cite: 20, 23]
        $table->integer('ref_og_axe')->nullable(); // [cite: 20, 23]
        
        // Tonus Oculaire (Pression Intraoculaire en mmHg) [cite: 23]
        $table->integer('tonus_od')->nullable(); // [cite: 23]
        $table->integer('tonus_og')->nullable(); // [cite: 20, 23]
        
        // Chiffrement AES-256 via Laravel pour les observations cliniques sensibles [cite: 40]
        $table->text('observations_cliniques')->nullable(); 
        $table->text('diagnostic')->nullable();
        
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
