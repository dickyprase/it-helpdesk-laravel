<?php

namespace App\Http\Controllers;

use App\Models\LeaderboardLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    public function index(Request $request): Response
    {
        $month = $request->integer('month', now()->month);
        $year = $request->integer('year', now()->year);
        $viewType = $request->get('view', 'monthly'); // monthly or yearly

        $query = LeaderboardLog::query()
            ->select('staff_id', DB::raw('SUM(points) as total_points'), DB::raw('COUNT(*) as ticket_count'))
            ->groupBy('staff_id')
            ->orderByDesc('total_points');

        if ($viewType === 'monthly') {
            $query->where('period_month', $month)->where('period_year', $year);
        } else {
            $query->where('period_year', $year);
        }

        $leaderboard = $query->get()->map(function ($entry) {
            $staff = User::find($entry->staff_id);
            return [
                'staff_id' => $entry->staff_id,
                'staff_name' => $staff?->name ?? 'Unknown',
                'staff_avatar' => $staff?->avatar,
                'total_points' => (int) $entry->total_points,
                'ticket_count' => (int) $entry->ticket_count,
            ];
        });

        // Available periods
        $periods = LeaderboardLog::query()
            ->select('period_month', 'period_year')
            ->distinct()
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->get()
            ->map(fn ($p) => [
                'month' => $p->period_month,
                'year' => $p->period_year,
                'label' => \Carbon\Carbon::create($p->period_year, $p->period_month)->translatedFormat('F Y'),
            ]);

        return Inertia::render('Leaderboard/Index', [
            'leaderboard' => $leaderboard,
            'periods' => $periods,
            'filters' => [
                'month' => $month,
                'year' => $year,
                'view' => $viewType,
            ],
        ]);
    }
}
