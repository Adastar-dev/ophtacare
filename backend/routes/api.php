<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\RendezVousController;
use App\Http\Controllers\Api\IndisponibiliteController;
use App\Http\Controllers\Api\RappelController;
use App\Http\Controllers\Api\MobilePaiementController;
use App\Http\Controllers\Api\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes — Plateforme Gestion Iris
|--------------------------------------------------------------------------
*/

// ==========================================
// ROUTES PUBLIQUES
// ==========================================

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']); // Inscription patient (client)
Route::get('/cliniques', [AdminController::class, 'cliniquesPubliques']); // Liste des cliniques (formulaire d'inscription)

// Route d'interopérabilité pour l'opticien externe (Scan du QR Code)
Route::get('/partenaire/prescription/{token}', [PrescriptionController::class, 'getByToken']);

// Callbacks paiement mobile (webhooks publics sécurisés par signature opérateur)
Route::post('/paiement/callback/{operateur}', [MobilePaiementController::class, 'callback']);


// ==========================================
// ROUTES PROTÉGÉES (SANCTUM)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // Session & Utilisateur connecté
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn(Request $request) => $request->user());

    // ---- Profil patient connecté (self-service) ----
    Route::get('/me/patient', [PatientController::class, 'me']);
    Route::put('/me/patient', [PatientController::class, 'updateMe']);

    // ---- Médecins (pour la prise de RDV) ----
    Route::get('/medecins', [AdminController::class, 'medecins']);

    // ---- Patients ----
    Route::apiResource('patients', PatientController::class);

    // ---- Rendez-vous ----
    Route::apiResource('rendez-vous', RendezVousController::class);

    // ---- Indisponibilités (hors service) ----
    Route::get('/indisponibilites', [IndisponibiliteController::class, 'index']);
    Route::post('/indisponibilites', [IndisponibiliteController::class, 'store']);
    Route::delete('/indisponibilites/{id}', [IndisponibiliteController::class, 'destroy']);

    // ---- Consultations ----
    Route::apiResource('consultations', ConsultationController::class)->only(['index', 'store', 'show']);

    // ---- Paiements guichet physique ----
    Route::apiResource('paiements', PaiementController::class)->only(['store', 'show']);

    // ---- Paiements mobiles (Wave / Orange Money) ----
    Route::post('/paiement/mobile/initier', [MobilePaiementController::class, 'initier']);
    Route::get('/paiement/mobile/{id}/statut', [MobilePaiementController::class, 'verifierStatut']);

    // ---- Prescriptions / Ordonnances ----
    Route::get('/prescriptions', [PrescriptionController::class, 'index']);
    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
    Route::get('/prescriptions/{id}', [PrescriptionController::class, 'show']);
    Route::get('/prescriptions/{id}/pdf', [PrescriptionController::class, 'downloadPdf']);

    // ---- Rappels ----
    Route::get('/rappels', [RappelController::class, 'index']);
    Route::post('/rappels', [RappelController::class, 'store']);
    Route::patch('/rappels/{id}/sent', [RappelController::class, 'markAsSent']);

    // ---- Administration ----
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/admin/activity-logs', [AdminController::class, 'activityLogs']);
    Route::get('/admin/transaction-logs', [AdminController::class, 'transactionLogs']);
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::post('/admin/users', [AdminController::class, 'storeUser']);
    Route::patch('/admin/users/{id}', [AdminController::class, 'updateUser']);
});