<?php

namespace App\Http\Requests;

class UpdateProjectRequest extends StoreProjectRequest
{
    // Inherits the same authorize() and rules() from StoreProjectRequest.
    // Add overrides here if update rules ever diverge from create rules.
}
