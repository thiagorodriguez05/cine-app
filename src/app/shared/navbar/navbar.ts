import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    FormsModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  busqueda = '';
  usuarioLogueado = signal(false);

  constructor(
    private router: Router,
    private supabaseService: Supabase
  ) {}

  async ngOnInit() {
    const { data } =
      await this.supabaseService
        .getClient()
        .auth
        .getUser();

    this.usuarioLogueado.set(!!data.user);
  }

  buscar() {
    const texto = this.busqueda.trim();

    if (!texto) {
      return;
    }

    this.router.navigate(['/peliculas'], {
      queryParams: { buscar: texto }
    });
  }
}