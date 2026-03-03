<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientRequest;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(): Response
    {
        $clients = Client::withCount('projects')->with('contacts')->get();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
        ]);
    }

    public function store(StoreClientRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $client = Client::create(['name' => $validated['name']]);

        if (!empty($validated['contacts'])) {
            foreach ($validated['contacts'] as $contactData) {
                $client->contacts()->create([
                    'name' => $contactData['name'],
                    'phone' => $contactData['phone'] ?? null,
                ]);
            }
        }

        return redirect()->route('clients.index')->with('success', 'Client created successfully.');
    }

    public function update(StoreClientRequest $request, Client $client): RedirectResponse
    {
        $validated = $request->validated();
        $client->update(['name' => $validated['name']]);

        // Sync contacts
        $existingContactIds = [];
        if (!empty($validated['contacts'])) {
            foreach ($validated['contacts'] as $contactData) {
                if (!empty($contactData['id'])) {
                    // Update existing
                    $contact = $client->contacts()->find($contactData['id']);
                    if ($contact) {
                        $contact->update([
                            'name' => $contactData['name'],
                            'phone' => $contactData['phone'] ?? null,
                        ]);
                        $existingContactIds[] = $contact->id;
                    }
                } else {
                    // Create new
                    $newContact = $client->contacts()->create([
                        'name' => $contactData['name'],
                        'phone' => $contactData['phone'] ?? null,
                    ]);
                    $existingContactIds[] = $newContact->id;
                }
            }
        }

        // Remove contacts that were deleted
        $client->contacts()->whereNotIn('id', $existingContactIds)->delete();

        return redirect()->route('clients.index')->with('success', 'Client updated successfully.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();

        return redirect()->route('clients.index')->with('success', 'Client deleted successfully.');
    }
}
