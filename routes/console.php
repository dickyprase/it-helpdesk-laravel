<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

// Bersihkan expired sessions setiap jam
Schedule::call(function () {
    $lifetime = config('session.lifetime', 120);
    $expiredBefore = now()->subMinutes($lifetime)->getTimestamp();

    $deleted = DB::table('sessions')
        ->where('last_activity', '<', $expiredBefore)
        ->delete();

    if ($deleted > 0) {
        logger()->info("[Session Cleanup] Deleted {$deleted} expired sessions.");
    }
})->hourly()->name('session-cleanup');
