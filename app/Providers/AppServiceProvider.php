<?php

namespace App\Providers;

use App\Models\Asset;
use App\Models\AssetRequest;
use App\Policies\AssetPolicy;
use App\Policies\AssetRequestPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     */
    protected array $policies = [
        Asset::class => AssetPolicy::class,
        AssetRequest::class => AssetRequestPolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }

        // Super admin bypasses all authorization
        Gate::before(function ($user, $ability) {
            if ($user->hasRole('super_admin')) {
                return true;
            }
        });
    }
}
