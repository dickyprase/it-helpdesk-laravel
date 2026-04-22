<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isUser();
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'category_id' => ['required', 'exists:categories,id'],
            'priority' => ['required', 'in:LOW,MEDIUM,HIGH'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240'], // 10MB per file
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Judul tiket wajib diisi.',
            'description.required' => 'Deskripsi tiket wajib diisi.',
            'category_id.required' => 'Kategori wajib dipilih.',
            'category_id.exists' => 'Kategori tidak valid.',
            'priority.required' => 'Prioritas wajib dipilih.',
            'attachments.max' => 'Maksimal 5 file attachment.',
            'attachments.*.max' => 'Ukuran file maksimal 10MB.',
        ];
    }
}
