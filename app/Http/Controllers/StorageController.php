<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class StorageController extends Controller
{
    /**
     * Get a token for Vercel Blob upload.
     * Only for authenticated users.
     */
    public function getVercelToken()
    {
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return response()->json([
            'token' => config('services.vercel_blob.token'),
        ]);
    }
}
