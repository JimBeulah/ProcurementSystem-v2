import { usePage } from '@inertiajs/react';

/**
 * Provides permission-checking utilities based on the authenticated user's roles and permissions.
 * @returns {{ can: (permission: string) => boolean, hasRole: (role: string) => boolean }}
 */
export function usePermissions() {
    const { auth } = usePage().props;

    /**
     * Checks if the user has a specific permission.
     * Admins always pass.
     */
    const can = (permission) => {
        if (!auth) return false;
        if (auth.roles?.includes('admin')) return true;
        return auth.permissions?.includes(permission) ?? false;
    };

    /**
     * Checks if the user has a specific role.
     */
    const hasRole = (role) => {
        return auth?.roles?.includes(role) ?? false;
    };

    return { can, hasRole };
}
