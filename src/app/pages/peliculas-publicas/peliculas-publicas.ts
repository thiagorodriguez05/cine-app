import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { Supabase } from '../../services/supabase';
import { Navbar } from '../../shared/navbar/navbar';
import { Card } from '../../components/card/card';

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
  selector: 'app-peliculas-publicas',
  imports: [
    CommonModule,
    Navbar,
    Card
  ],
  templateUrl: './peliculas-publicas.html',
  styleUrl: './peliculas-publicas.css'
})
export class PeliculasPublicas implements OnInit {

  peliculas = signal<Pelicula[]>([]);
  proximamente = signal<Pelicula[]>([]);

  todasLasPeliculas: Pelicula[] = [];

  constructor(
    private supabaseService: Supabase,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.cargarPeliculas();

    this.route.queryParamMap.subscribe(params => {
      const busqueda = params.get('buscar')?.toLowerCase().trim() || '';

      this.filtrarPeliculas(busqueda);
    });
  }

  async cargarPeliculas() {

    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('peliculas')
        .select('*')
        .order('fecha_de_estreno');

    if (error) {
      console.error(
        'Error al cargar películas:',
        error
      );
      return;
    }

    this.todasLasPeliculas = data ?? [];

    this.filtrarPeliculas(
      this.route.snapshot.queryParamMap.get('buscar')?.toLowerCase().trim() || ''
    );
  }

  filtrarPeliculas(busqueda: string) {

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let peliculasFiltradas = this.todasLasPeliculas;

    if (busqueda) {
      peliculasFiltradas = this.todasLasPeliculas.filter(pelicula =>
        pelicula.nombre
          .toLowerCase()
          .includes(busqueda)
      );
    }

    const estrenadas = peliculasFiltradas.filter(pelicula => {

      const fechaEstreno = new Date(
        pelicula.fecha_de_estreno
      );

      fechaEstreno.setHours(0, 0, 0, 0);

      return (
        pelicula.estado === true &&
        fechaEstreno <= hoy
      );
    });

    const futuras = peliculasFiltradas.filter(pelicula => {

      const fechaEstreno = new Date(
        pelicula.fecha_de_estreno
      );

      fechaEstreno.setHours(0, 0, 0, 0);

      return fechaEstreno > hoy;
    });

    this.peliculas.set(estrenadas);
    this.proximamente.set(futuras);
  }
}