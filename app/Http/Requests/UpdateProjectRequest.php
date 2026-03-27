<?php

namespace App\Http\Requests;

class UpdateProjectRequest extends StoreProjectRequest
{
    public function rules(): array
    {
        $rules = parent::rules();

        // Allow 'ACTIVE' in the list of valid statuses if it's an update,
        // but it still shouldn't be the path for initial activation.
        $rules['status'] = 'nullable|string|in:ACTIVE,PLANNING,COMPLETED,ON_HOLD,WARRANTY_PERIOD';

        return $rules;
    }
}
