<?php

namespace App\Enums;

enum UserRole: string
{
    case USER = 'USER';
    case STAFF = 'STAFF';
    case MANAGER = 'MANAGER';

    public function label(): string
    {
        return match ($this) {
            self::USER => 'User',
            self::STAFF => 'Staff',
            self::MANAGER => 'Manager',
        };
    }
}
