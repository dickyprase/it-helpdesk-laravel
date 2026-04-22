<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TicketController;
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

        // Stats spesifik per role
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
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Tickets
    Route::resource('tickets', TicketController::class)->only(['index', 'create', 'store', 'show']);
    Route::post('/tickets/{ticket}/claim', [TicketController::class, 'claim'])->name('tickets.claim');
    Route::post('/tickets/{ticket}/assign', [TicketController::class, 'assign'])->name('tickets.assign');
    Route::post('/tickets/{ticket}/status', [TicketController::class, 'updateStatus'])->name('tickets.updateStatus');
    Route::post('/tickets/{ticket}/resolve', [TicketController::class, 'resolve'])->name('tickets.resolve');
    Route::post('/tickets/{ticket}/difficulty', [TicketController::class, 'setDifficulty'])->name('tickets.setDifficulty');
});

require __DIR__.'/auth.php';
