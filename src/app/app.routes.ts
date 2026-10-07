import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Admin } from './pages/admin/admin';
import { Inicio } from './pages/admin/inicio/inicio';

import { Peliculas } from './pages/admin/peliculas/peliculas';
import { Generos } from './pages/admin/generos/generos';
import { Funciones } from './pages/admin/funciones/funciones';
import { Salas } from './pages/admin/salas/salas';
import { CandyBar } from './pages/admin/candy-bar/candy-bar';
import { Productos } from './pages/admin/candy-bar/productos/productos';
import { Categorias } from './pages/admin/candy-bar/categorias/categorias';
import { Combos } from './pages/admin/candy-bar/combos/combos';

import { CandyBar as CandyBarPublico } from './pages/candy-bar/candy-bar';

import { authGuard } from './guards/auth-guard';
import { userGuard } from './guards/user-guard.ts';

import { MiCuenta } from './pages/mi-cuenta/mi-cuenta';

import { Home } from './pages/home/home';
import { PeliculasPublicas } from './pages/peliculas-publicas/peliculas-publicas';
import { Cartelera } from './pages/cartelera/cartelera';
import { Compra } from './pages/compra/compra';
import { Butacas } from './pages/butacas/butacas';
import { ResumenCompra } from './pages/resumen-compra/resumen-compra';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'mi-cuenta',
    component: MiCuenta,
    canActivate: [userGuard]
  },

  {
    path: 'peliculas',
    component: PeliculasPublicas
  },

  {
    path: 'peliculas/:id',
    component: Cartelera
  },

  {
    path: 'compra/:id',
    component: Compra
  },

  {
    path: 'compra/:id/butacas',
    component: Butacas
  },

  {
    path: 'candy-bar',
    component: CandyBarPublico
  },

  {
    path: 'resumen-compra',
    component: ResumenCompra
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'registro',
    component: Registro
  },

  {
    path: 'admin',
    component: Admin,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: Inicio,
        canActivate: [authGuard]
      },

      {
        path: 'peliculas',
        component: Peliculas,
        canActivate: [authGuard]
      },

      {
        path: 'generos',
        component: Generos,
        canActivate: [authGuard]
      },

      {
        path: 'funciones',
        component: Funciones,
        canActivate: [authGuard]
      },

      {
        path: 'salas',
        component: Salas,
        canActivate: [authGuard]
      },

      {
        path: 'candy-bar',
        component: CandyBar,
        canActivate: [authGuard]
      },

      {
        path: 'candy-bar/productos',
        component: Productos,
        canActivate: [authGuard]
      },

      {
        path: 'candy-bar/categorias',
        component: Categorias,
        canActivate: [authGuard]
      },
      {
        path: 'candy-bar/combos',
        component: Combos,
        canActivate: [authGuard]
      }
    ]
  }
];