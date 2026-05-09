<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        // Since this is the first user in the test database, they should be admin/active
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_subsequent_users_are_redirected_to_inactive_page(): void
    {
        // Create the first user (Admin)
        \App\Models\User::factory()->create();

        $response = $this->post('/register', [
            'name' => 'Second User',
            'username' => 'seconduser',
            'email' => 'second@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        // The second user should be inactive and redirected accordingly
        $response->assertRedirect(route('account.inactive', absolute: false));
    }
}
