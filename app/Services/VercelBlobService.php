<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class VercelBlobService
{
    protected string $token;

    public function __construct()
    {
        $this->token = config('services.vercel_blob.token') ?? '';
    }

    /**
     * Delete a blob by its URL.
     */
    public function delete(string $url): bool
    {
        if (empty($this->token)) {
            return false;
        }

        $response = Http::withToken($this->token)
            ->post('https://blob.vercel-storage.com/delete', [
                'urls' => [$url],
            ]);

        return $response->successful();
    }

    /**
     * Handle the server-side part of a Vercel Blob upload.
     * This follows the Vercel Blob "Serverless" upload protocol.
     */
    public function handleUpload(array $payload): array
    {
        $type = $payload['type'];

        if ($type === 'blob.generate-client-token') {
            // Validate the request here (e.g., check if user is authenticated)
            if (! auth()->check()) {
                throw new \Exception('Unauthorized');
            }

            // Generate a token for the client
            // Since we don't have a PHP SDK, we have to follow the protocol
            // But for simplicity in this specific project, we can implement a proxy or a signed URL approach.
            // However, Vercel Blob's handleUpload is very specific to Node.js SDK.

            // ALTERNATIVE: Use a Proxy upload approach for PHP.
            // Or just allow the client to upload if they have the token (less secure but easier).
        }

        return [];
    }
}
