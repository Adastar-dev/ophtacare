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
    Schema::create('rappels', function (Blueprint $table) {
        $table->id();
        $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
        $table->string('type_rappel'); // Ex: 'Suivi Glaucome', 'Contrôle Semestriel' 
        $table->text('message');
        $table->date('date_planifiee'); // [cite: 45]
        $table->enum('statut', ['en_attente', 'envoye', 'echoue'])->default('en_attente'); // [cite: 33, 45]
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rappels');
    }
};
