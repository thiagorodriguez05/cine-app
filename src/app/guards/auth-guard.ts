import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Supabase } from '../services/supabase';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = async (route, state) => {

  const supabaseService = inject(Supabase);
  const authService = inject(Auth);
  const router = inject(Router);

  const { data } = await supabaseService
    .getClient()
    .auth
    .getUser();

  // Primero verificamos si existe una sesión iniciada.
  if (!data.user) {
    return router.parseUrl('/login');
  }

  // Obtenemos el rol del usuario desde la tabla usuarios.
  const { data: usuario, error } =
    await authService.obtenerRol(data.user.id);

  // Si hubo un error o no encontramos al usuario, se bloquea el acceso.
  if (error || !usuario) {
    return router.parseUrl('/login');
  }

  // Solo los usuarios con rol ADMIN pueden acceder a las rutas protegidas.
  if (usuario.rol === 'ADMIN') {
    return true;
  }

  // Si está logueado pero no es administrador, se bloquea el acceso.
  return router.parseUrl('/login');
};