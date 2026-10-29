<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Console\Scheduling\Schedule;
use App\Contracts\PaymentProviderInterface;
use App\Services\Payment\WaveProviderMock;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentProviderInterface::class, WaveProviderMock::class);
    }

    public function boot(): void
    {
        $this->callAfterResolving(Schedule::class, function (Schedule $schedule) {
            $schedule->command('rappels:envoyer')->everyFifteenMinutes();
        });
    }
}
