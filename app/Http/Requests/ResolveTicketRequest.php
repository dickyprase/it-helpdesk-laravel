<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResolveTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ticket = $this->route('ticket');
        $user = $this->user();

        return ($user->isStaff() && $ticket->staff_id === $user->id)
            || $user->isManager();
    }

    public function rules(): array
    {
        return [
            'resolution_note' => ['required', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'resolution_note.required' => 'Catatan resolusi wajib diisi.',
        ];
    }
}
