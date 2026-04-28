<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StorageController extends Controller
{
    /**
     * Handle file upload to Vercel Blob via server-side API.
     */
    public function handleUpload(Request $request)
    {
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $token = config('services.vercel_blob.token');
        if (!$token) {
            return response()->json(['error' => 'Vercel Blob token not configured'], 500);
        }

        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file provided'], 400);
        }

        $file = $request->file('file');
        $filename = time() . '-' . $file->getClientOriginalName();
        
        try {
            // Upload directly to Vercel Blob REST API
            // Documentation: https://vercel.com/docs/storage/vercel-blob/rest-api
            $response = Http::withToken($token)
                ->withHeaders([
                    'x-api-version' => '7',
                ])
                ->withBody(file_get_contents($file->getRealPath()), $file->getMimeType())
                ->put("https://blob.vercel-storage.com/" . $filename . "?access=public");

            if ($response->failed()) {
                Log::error('Vercel Blob upload failed: ' . $response->body());
                return response()->json(['error' => 'Vercel API error: ' . $response->status()], 500);
            }

            $data = $response->json();
            
            return response()->json([
                'url' => $data['url'],
                'pathname' => $data['pathname'],
            ]);
        } catch (\Exception $e) {
            Log::error('Vercel Blob Exception: ' . $e->getMessage());
            return response()->json(['error' => 'Server error during upload'], 500);
        }
    }
}
