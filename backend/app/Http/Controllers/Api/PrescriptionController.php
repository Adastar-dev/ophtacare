<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Models\Consultation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PrescriptionController extends Controller
{
    /**
     * Lister les ordonnances visibles par l'utilisateur connecté.
     * - patient : ses propres ordonnances
     * - staff   : celles des patients de sa clinique
     * - super_admin : toutes
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Prescription::with([
            'consultation.patient.clinique',
            'consultation.medecin:id,name',
        ])->latest();

        if ($user->role === 'patient') {
            if (! $user->patient_id) {
                return response()->json([], 200);
            }
            $query->whereHas('consultation', fn($q) => $q->where('patient_id', $user->patient_id));
        } elseif ($user->role !== 'super_admin') {
            $query->whereHas('consultation.patient', fn($q) => $q->where('clinique_id', $user->clinique_id));
        }

        if ($request->filled('consultation_id')) {
            $query->where('consultation_id', $request->consultation_id);
        }

        return response()->json($query->get(), 200);
    }

    /**
     * Enregistrer une nouvelle ordonnance optique.
     */
    public function store(Request $request)
    {
        // 1. Validation stricte des données reçues de React
        $validator = Validator::make($request->all(), [
            'consultation_id' => 'required|exists:consultations,id',
            'type_verre' => 'required|string|in:unifocal,progressif,bifocal,lentilles',
            'type_teinte' => 'nullable|string|in:blanc,photochromique,solaire',
            'oeil_droit_add' => 'nullable|string|max:10',
            'oeil_gauche_add' => 'nullable|string|max:10',
            'remarques' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation des données de prescription.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $qrToken = Str::random(40);

            $prescription = Prescription::create([
                'consultation_id' => $request->consultation_id,
                'contenu_ordonnance' => [
                    'type_verre' => $request->type_verre,
                    'type_teinte' => $request->type_teinte ?: 'blanc',
                    'oeil_droit_add' => $request->oeil_droit_add ?? '0.00',
                    'oeil_gauche_add' => $request->oeil_gauche_add ?? '0.00',
                    'remarques' => $request->remarques,
                ],
                'qr_token' => $qrToken,
                'qr_token_expire_at' => now()->addDays(90),
            ]);

            $urlOpticien = url("/api/partenaire/prescription/{$qrToken}");

            return response()->json([
                'message' => 'Ordonnance visuelle enregistrée avec succès.',
                'prescription' => $prescription,
                'url_opticien' => $urlOpticien,
                'qr_token' => $qrToken,
            ], 201);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Prescription store failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Une erreur interne est survenue lors de l\'enregistrement.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les détails d'une ordonnance spécifique.
     */
    public function show($id)
    {
        $prescription = Prescription::with('consultation.rendezVous.patient')->find($id);

        if (!$prescription) {
            return response()->json(['message' => 'Ordonnance introuvable.'], 404);
        }

        return response()->json($prescription);
    }

    /**
     * Récupérer une ordonnance via son qr_token unique (Lien QR Code Opticien).
     */
    public function getByToken($token)
    {
        $prescription = Prescription::with('consultation.rendezVous.patient')
            ->where('qr_token', $token)
            ->first();

        if (!$prescription) {
            return response()->json(['message' => 'Lien de prescription invalide ou expiré.'], 404);
        }

        if ($prescription->qr_token_expire_at && $prescription->qr_token_expire_at->isPast()) {
            return response()->json(['message' => 'Ce lien d\'ordonnance a expiré.'], 410);
        }

        return response()->json($prescription);
    }

    /**
     * Télécharger l'ordonnance en PDF.
     * Nécessite: composer require barryvdh/laravel-dompdf
     */
    public function downloadPdf($id)
    {
        $prescription = Prescription::with([
            'consultation.rendezVous.patient',
            'consultation.medecin',
        ])->findOrFail($id);

        // Stub — activer après composer require barryvdh/laravel-dompdf
        // $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.ordonnance', compact('prescription'));
        // return $pdf->download('ordonnance-' . $prescription->id . '.pdf');

        return response()->json([
            'message' => 'PDF prêt à générer. Installer: composer require barryvdh/laravel-dompdf',
            'prescription_id' => $prescription->id,
        ], 200);
    }
}