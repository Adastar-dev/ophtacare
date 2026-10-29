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
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            // Liaison sécurisée avec la consultation
            $table->foreignId('consultation_id')->constrained('consultations')->onDelete('cascade');
            
            // Caractéristiques des verres et traitements
            $table->string('type_verre'); // Unifocal, Progressif, Bifocal
            $table->string('type_teinte'); // Blanc, Photochromique, Solaire
            
            // Additions pour la presbytie (stockées en string ou decimal pour garder les +2.00)
            $table->string('oeil_droit_add')->default('0.00');
            $table->string('oeil_gauche_add')->default('0.00');
            
            // Notes et indications particulières
            $table->text('remarques')->nullable();

            // Token QR unique pour le lien opticien partenaire
            $table->string('qr_token')->unique()->nullable();
            $table->timestamp('qr_token_expire_at')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};