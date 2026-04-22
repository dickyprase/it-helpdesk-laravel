<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\WhatsAppController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── Public ──
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

// ── Authenticated ──
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', function () {
        $user = auth()->user();
        $stats = [
            'open' => \App\Models\Ticket::where('status', 'OPEN')->count(),
            'in_progress' => \App\Models\Ticket::where('status', 'IN_PROGRESS')->count(),
            'pending' => \App\Models\Ticket::where('status', 'PENDING')->count(),
            'resolved' => \App\Models\Ticket::where('status', 'RESOLVED')->count(),
            'closed' => \App\Models\Ticket::where('status', 'CLOSED')->count(),
        ];

        if ($user->isUser()) {
            $stats['my_tickets'] = \App\Models\Ticket::where('user_id', $user->id)->count();
        } elseif ($user->isStaff()) {
            $stats['my_handled'] = \App\Models\Ticket::where('staff_id', $user->id)->count();
        }

        return Inertia::render('Dashboard', [
            'stats' => $stats,
        ]);
    })->name('dashboard');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'changePassword'])->name('profile.changePassword');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Tickets
    Route::resource('tickets', TicketController::class)->only(['index', 'create', 'store', 'show']);
    Route::post('/tickets/{ticket}/claim', [TicketController::class, 'claim'])->name('tickets.claim');
    Route::post('/tickets/{ticket}/assign', [TicketController::class, 'assign'])->name('tickets.assign');
    Route::post('/tickets/{ticket}/status', [TicketController::class, 'updateStatus'])->name('tickets.updateStatus');
    Route::post('/tickets/{ticket}/resolve', [TicketController::class, 'resolve'])->name('tickets.resolve');
    Route::post('/tickets/{ticket}/difficulty', [TicketController::class, 'setDifficulty'])->name('tickets.setDifficulty');

    // Chat (JSON API, rate limited)
    Route::get('/tickets/{ticket}/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::post('/tickets/{ticket}/chat', [ChatController::class, 'store'])->middleware('throttle:chat')->name('chat.store');
    Route::post('/tickets/{ticket}/chat/voice', [ChatController::class, 'storeVoice'])->middleware('throttle:chat')->name('chat.storeVoice');
    Route::post('/tickets/{ticket}/chat/attachment', [ChatController::class, 'storeAttachment'])->middleware('throttle:chat')->name('chat.storeAttachment');

    // Leaderboard (STAFF + MANAGER)
    Route::get('/leaderboard', [LeaderboardController::class, 'index'])
        ->middleware('role:staff,manager')
        ->name('leaderboard');

    // WhatsApp Admin (MANAGER only)
    Route::middleware('role:manager')->prefix('admin/whatsapp')->name('whatsapp.')->group(function () {
        Route::get('/', [WhatsAppController::class, 'index'])->name('index');
        Route::post('/connect', [WhatsAppController::class, 'connect'])->name('connect');
        Route::post('/disconnect', [WhatsAppController::class, 'disconnect'])->name('disconnect');
        Route::post('/logout', [WhatsAppController::class, 'logout'])->name('logout');
        Route::post('/toggle', [WhatsAppController::class, 'toggleNotifications'])->name('toggle');
        Route::post('/test', [WhatsAppController::class, 'testMessage'])->name('test');
        Route::post('/template', [WhatsAppController::class, 'upsertTemplate'])->name('template.upsert');
        Route::delete('/template/{template}', [WhatsAppController::class, 'deleteTemplate'])->name('template.delete');
        Route::get('/status', [WhatsAppController::class, 'status'])->name('status');
    });
});

require __DIR__.'/auth.php';
