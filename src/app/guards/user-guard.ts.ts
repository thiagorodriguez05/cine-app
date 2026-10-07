import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Supabase } from '../services/supabase';

export const userGuard: CanActivateFn = async () => {

  const supabaseService = inject(Supabase);
  const router = inject(Router);

  const { data } =
    await supabaseService
      .getClient()
      .auth
      .getUser();

  if (!data.user) {
    return router.parseUrl('/login');
  }

  return true;
};