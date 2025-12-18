<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
*/

// HRIS User Sync - Every 30 minutes
Schedule::command('hris:sync-users')
    ->everyThirtyMinutes()
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/hris-sync.log'));

// Horizon metrics snapshot
Schedule::command('horizon:snapshot')
    ->everyFiveMinutes();
