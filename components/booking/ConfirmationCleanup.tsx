'use client';

import { useEffect } from 'react';

/**
 * ConfirmationCleanup — Belt-and-suspenders sessionStorage wipe.
 *
 * Context: BookingWizard already wipes wizard_state synchronously in its
 * onSuccess callback (the primary fix for Bug 3). This component is a
 * secondary safety net: when the user lands on the confirmation page,
 * it unconditionally removes wizard_state, guaranteeing that any residual
 * state (e.g. from a rare race or a direct URL navigation) is gone before
 * the user clicks "Go to My Dashboard" or "Reserve Session".
 *
 * This is a client component mounted inside the server-rendered confirmation
 * page. It runs once on mount with zero visible UI.
 */
export function ConfirmationCleanup() {
  useEffect(() => {
    // Remove any saved wizard state when the user reaches the confirmation page.
    // Covers: race conditions, direct URL access, hard-refresh on this page.
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('wizard_state');
    }
  }, []);

  return null;
}
