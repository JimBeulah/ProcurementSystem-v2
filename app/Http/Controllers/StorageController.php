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
    /**
     * Handle Vercel Blob upload protocol.
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

        $body = $request->json()->all();
        $type = $body['type'] ?? '';

        if ($type === 'blob.generate-client-token') {
            $payload = $body['payload'];
            $pathname = $payload['pathname'];
            
            $clientToken = $this->generateClientToken($token, $pathname);

            return response()->json([
                'type' => 'blob.generate-client-token',
                'clientToken' => $clientToken,
            ]);
        }

        return response()->json(['error' => 'Invalid event type'], 400);
    }

    /**
     * Generate a Vercel Blob client token from a read-write token.
     * Replicates the logic in @vercel/blob client SDK.
     */
    private function generateClientToken(string $readWriteToken, string $pathname): string
    {
        $parts = explode('_', $readWriteToken);
        // Vercel Blob tokens look like: vercel_blob_rw_<storeId>_<token>
        // Index 0: vercel, 1: blob, 2: rw, 3: storeId, 4+: token
        $storeId = $parts[3] ?? '';
        
        // Reconstruct the token secret part (everything after the storeId)
        $tokenSecret = implode('_', array_slice($parts, 4));

        $validUntil = (time() + 3600) * 1000; // 1 hour in milliseconds

        $payloadData = [
            'pathname' => $pathname,
            'validUntil' => $validUntil,
        ];

        $encodedPayload = base64_encode(json_encode($payloadData));
        $signature = hash_hmac('sha256', $encodedPayload, $tokenSecret);
        
        $tokenData = base64_encode($signature . '.' . $encodedPayload);
        
        return "vercel_blob_client_{$storeId}_{$tokenData}";
    }
}
