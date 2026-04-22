<?php

namespace App\Enums;

enum ChatType: string
{
    case TEXT = 'text';
    case VOICE = 'voice';
    case ATTACHMENT = 'attachment';
}
