<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    public static function log(
        string $action,
        ?object $model = null,
        array $anciennesValeurs = [],
        array $nouvellesValeurs = [],
        ?Request $request = null
    ): void {
        $user = Auth::user();

        ActivityLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model?->id,
            'anciennes_valeurs' => !empty($anciennesValeurs) ? $anciennesValeurs : null,
            'nouvelles_valeurs' => !empty($nouvellesValeurs) ? $nouvellesValeurs : null,
            'ip' => $request?->ip() ?? request()->ip(),
            'user_agent' => $request?->userAgent() ?? request()->userAgent(),
            'clinique_id' => $user?->clinique_id,
        ]);
    }
}
