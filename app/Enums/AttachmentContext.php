<?php

namespace App\Enums;

enum AttachmentContext: string
{
    case CREATION = 'creation';
    case RESOLUTION = 'resolution';
    case CHAT = 'chat';
}
