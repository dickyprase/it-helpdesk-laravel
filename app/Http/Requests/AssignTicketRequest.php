<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class AssignTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isManager();
    }

    public function rules(): array
    {
        return [
            'staff_id' => ['required', 'exists:users,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $staff = \App\Models\User::find($this->staff_id);
            if ($staff && !$staff->isStaffOrManager()) {
                $validator->errors()->add('staff_id', 'User yang dipilih bukan staff.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'staff_id.required' => 'Staff wajib dipilih.',
            'staff_id.exists' => 'Staff tidak ditemukan.',
        ];
    }
}
