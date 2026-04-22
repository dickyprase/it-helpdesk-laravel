<?php

namespace App\Http\Controllers;

use App\Enums\AttachmentContext;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\UserRole;
use App\Http\Requests\AssignTicketRequest;
use App\Http\Requests\CreateTicketRequest;
use App\Http\Requests\ResolveTicketRequest;
use App\Models\Category;
use App\Models\LeaderboardLog;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\User;
use App\Services\TicketStateMachine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    /**
     * Daftar tiket (paginated + filter)
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Ticket::with(['user:id,name', 'staff:id,name', 'category:id,name'])
            ->latest();

        // Filter berdasarkan role
        if ($user->isUser()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isStaff()) {
            $query->where(function ($q) use ($user) {
                $q->where('staff_id', $user->id)
                  ->orWhere('status', TicketStatus::OPEN);
            });
        }
        // MANAGER: lihat semua

        // Filter status
        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        // Filter kategori
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }

        $tickets = $query->paginate(15)->withQueryString();

        $categories = Category::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets,
            'categories' => $categories,
            'filters' => $request->only(['status', 'category_id', 'search']),
            'statuses' => array_map(fn ($s) => ['value' => $s->value, 'label' => $s->label()], TicketStatus::cases()),
        ]);
    }

    /**
     * Form buat tiket baru
     */
    public function create(): Response
    {
        $this->authorize('create', Ticket::class);

        $categories = Category::orderBy('name')->get(['id', 'name']);
        $priorities = array_map(fn ($p) => ['value' => $p->value, 'label' => $p->label()], TicketPriority::cases());

        return Inertia::render('Tickets/Create', [
            'categories' => $categories,
            'priorities' => $priorities,
        ]);
    }

    /**
     * Simpan tiket baru
     */
    public function store(CreateTicketRequest $request): RedirectResponse
    {
        $ticket = Ticket::create([
            'title' => $request->title,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'priority' => $request->priority,
            'user_id' => $request->user()->id,
            'status' => TicketStatus::OPEN,
        ]);

        // Handle attachments
        if ($request->hasFile('attachments')) {
            $this->saveAttachments($ticket, $request->file('attachments'), AttachmentContext::CREATION);
        }

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Tiket berhasil dibuat.');
    }

    /**
     * Detail tiket
     */
    public function show(Request $request, Ticket $ticket): Response
    {
        $this->authorize('view', $ticket);

        $ticket->load([
            'user:id,name,email,avatar',
            'staff:id,name,email,avatar',
            'category:id,name',
            'attachments',
        ]);

        $user = $request->user();
        $availableTransitions = TicketStateMachine::availableTransitions($user, $ticket);
        $staffList = $user->isManager()
            ? User::where('role', UserRole::STAFF)->orWhere('role', UserRole::MANAGER)->orderBy('name')->get(['id', 'name', 'role'])
            : [];

        return Inertia::render('Tickets/Show', [
            'ticket' => $ticket,
            'availableTransitions' => array_map(fn ($s) => ['value' => $s->value, 'label' => $s->label()], $availableTransitions),
            'staffList' => $staffList,
            'canClaim' => $user->can('claim', $ticket),
            'canAssign' => $user->can('assign', $ticket),
            'canSetDifficulty' => $user->can('setDifficulty', $ticket),
            'canChat' => $user->can('chat', $ticket),
        ]);
    }

    /**
     * Klaim tiket (STAFF/MANAGER)
     */
    public function claim(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('claim', $ticket);

        // Gunakan transaction dengan SELECT FOR UPDATE untuk race condition
        DB::transaction(function () use ($request, $ticket) {
            $locked = Ticket::lockForUpdate()->find($ticket->id);

            if (!$locked->isOpen() || $locked->staff_id !== null) {
                abort(409, 'Tiket sudah diklaim oleh staff lain.');
            }

            $locked->update([
                'staff_id' => $request->user()->id,
                'status' => TicketStatus::IN_PROGRESS,
            ]);
        });

        return back()->with('success', 'Tiket berhasil diklaim.');
    }

    /**
     * Assign staff ke tiket (MANAGER)
     */
    public function assign(AssignTicketRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('assign', $ticket);

        $newStatus = $ticket->isOpen() ? TicketStatus::IN_PROGRESS : $ticket->status;

        $ticket->update([
            'staff_id' => $request->staff_id,
            'status' => $newStatus,
        ]);

        return back()->with('success', 'Staff berhasil di-assign.');
    }

    /**
     * Update status tiket (generic, via state machine)
     */
    public function updateStatus(Request $request, Ticket $ticket): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'string'],
        ]);

        $newStatus = TicketStatus::from($request->status);
        $user = $request->user();

        if (!TicketStateMachine::canUserTransition($user, $ticket, $newStatus)) {
            return back()->with('error', 'Transisi status tidak diizinkan.');
        }

        $ticket->update(['status' => $newStatus]);

        // Jika CLOSED, beri poin leaderboard
        if ($newStatus === TicketStatus::CLOSED && $ticket->staff_id) {
            $now = now();
            LeaderboardLog::create([
                'staff_id' => $ticket->staff_id,
                'ticket_id' => $ticket->id,
                'points' => $ticket->calculatePoints(),
                'period_month' => $now->month,
                'period_year' => $now->year,
            ]);
        }

        return back()->with('success', "Status tiket diubah ke {$newStatus->label()}.");
    }

    /**
     * Resolve tiket (STAFF)
     */
    public function resolve(ResolveTicketRequest $request, Ticket $ticket): RedirectResponse
    {
        $user = $request->user();

        if (!TicketStateMachine::canUserTransition($user, $ticket, TicketStatus::RESOLVED)) {
            return back()->with('error', 'Tidak dapat resolve tiket ini.');
        }

        $ticket->update([
            'status' => TicketStatus::RESOLVED,
            'resolution_note' => $request->resolution_note,
        ]);

        if ($request->hasFile('attachments')) {
            $this->saveAttachments($ticket, $request->file('attachments'), AttachmentContext::RESOLUTION);
        }

        return back()->with('success', 'Tiket berhasil di-resolve.');
    }

    /**
     * Set difficulty level
     */
    public function setDifficulty(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('setDifficulty', $ticket);

        $request->validate([
            'difficulty_level' => ['required', 'integer', 'in:1,2,3'],
        ]);

        $ticket->update(['difficulty_level' => $request->difficulty_level]);

        return back()->with('success', 'Difficulty level diperbarui.');
    }

    /**
     * Helper: simpan attachment files
     */
    private function saveAttachments(Ticket $ticket, array $files, AttachmentContext $context): void
    {
        foreach ($files as $file) {
            $path = $file->store("tickets/{$ticket->id}", 'public');

            TicketAttachment::create([
                'ticket_id' => $ticket->id,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $file->getClientMimeType(),
                'context' => $context,
            ]);
        }
    }
}
