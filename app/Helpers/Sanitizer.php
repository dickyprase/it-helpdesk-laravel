<?php

namespace App\Helpers;

class Sanitizer
{
    /**
     * Sanitize filename — hapus karakter berbahaya, path traversal, dan null bytes.
     */
    public static function fileName(string $name): string
    {
        // Hapus null bytes
        $name = str_replace("\0", '', $name);

        // Ambil hanya basename (hapus path traversal)
        $name = basename($name);

        // Hapus karakter non-printable
        $name = preg_replace('/[^\x20-\x7E\p{L}\p{N}\s\.\-_]/u', '', $name);

        // Fallback jika kosong
        return $name ?: 'unnamed_file';
    }

    /**
     * Escape LIKE wildcard characters (% dan _) dalam search input.
     */
    public static function escapeLike(string $value): string
    {
        return str_replace(
            ['\\', '%', '_'],
            ['\\\\', '\\%', '\\_'],
            $value
        );
    }

    /**
     * Strip HTML tags dari text input (anti-XSS untuk data yang disimpan ke DB).
     */
    public static function stripTags(string $value): string
    {
        return strip_tags($value);
    }
}
