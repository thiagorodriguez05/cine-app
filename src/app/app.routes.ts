import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Admin } from './admin/admin';
import { Peliculas } from './peliculas/peliculas';
import { Generos } from './generos/generos';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [authGuard],
    children:[
        {
            path: 'peliculas',
            component: Peliculas,
            canActivate: [authGuard]
        },
        {
            path: 'generos',
            component: Generos,
            canActivate: [authGuard]
        }
    ]
  }
  
];