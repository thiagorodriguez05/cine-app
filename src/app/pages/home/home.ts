import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Supabase } from '../../services/supabase';
import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';

interface Pelicula {
  id: string;
  nombre: string;
  imagen: string;
  sinopsis: string;
  duracion: number;
  fecha_de_estreno: string;
  clasificacion_de_edad: number;
  estado: boolean;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  peliculas = signal<Pelicula[]>([]);

  constructor(private supabaseService: Supabase) {}

  ngOnInit() {
    this.cargarPeliculas();
  }

  async cargarPeliculas() {

    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('peliculas')
        .select('*')
        .eq('estado', true)
        .order('nombre');

    if (error) {
      console.error('Error al cargar películas:', error);
      return;
    }

    this.peliculas.set(data ?? []);
  }
}