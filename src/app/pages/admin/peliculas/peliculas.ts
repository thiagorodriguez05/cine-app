import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PeliculasService } from '../../../services/peliculas.service';
import { formatearDuracion } from '../../../utils/peliculas.utils';
import { PeliculaForm } from './peliculas-form/peliculas-form';

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

interface Genero {
  id: number;
  nombre: string;
}

interface Formato {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-peliculas',
  imports: [CommonModule, PeliculaForm],
  templateUrl: './peliculas.html',
  styleUrl: './peliculas.css'
})
export class Peliculas implements OnInit {

  peliculas = signal<Pelicula[]>([]);
  generos: Genero[] = [];
  formatos: Formato[] = [];

  // Signals para actualizar la información relacionada con cada película.
  formatosPorPelicula =
    signal<{ [peliculaId: string]: string[] }>({});

  generosPorPelicula =
    signal<{ [peliculaId: string]: number[] }>({});

  mostrarFormulario = false;
  editando = false;
  peliculaEditandoId: string | null = null;
  peliculaSeleccionada: Pelicula | null = null;
  generosSeleccionados: number[] = [];
  formatosSeleccionados: number[] = [];

  constructor(
    private peliculasService: PeliculasService
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  // Carga las películas y toda la información necesaria para mostrarlas y editarlas.
  async cargarDatos() {
    const peliculas =
      await this.peliculasService.obtenerPeliculas();

    this.peliculas.set(peliculas);

    this.generos =
      await this.peliculasService.obtenerGeneros();

    this.formatos =
      await this.peliculasService.obtenerFormatos();

    this.formatosPorPelicula.set(
      await this.peliculasService.obtenerFormatosPorPelicula()
    );

    const generosPorPelicula:
      { [peliculaId: string]: number[] } = {};

    for (const pelicula of peliculas) {
      generosPorPelicula[pelicula.id] =
        await this.peliculasService.obtenerGenerosDePelicula(
          pelicula.id
        );
    }

    this.generosPorPelicula.set(
      generosPorPelicula
    );
  }

  abrirFormulario() {
    this.editando = false;
    this.peliculaEditandoId = null;
    this.peliculaSeleccionada = null;
    this.generosSeleccionados = [];
    this.formatosSeleccionados = [];
    this.mostrarFormulario = true;
  }

  // Carga en el formulario los datos de la película seleccionada para editarla.
  editarPelicula(pelicula: Pelicula) {
    this.editando = true;
    this.peliculaEditandoId = pelicula.id;
    this.peliculaSeleccionada = pelicula;

    this.generosSeleccionados = [
      ...(this.generosPorPelicula()[pelicula.id] ?? [])
    ];

    const formatos =
      this.formatosPorPelicula()[pelicula.id] ?? [];

    this.formatosSeleccionados = formatos
      .map(nombre =>
        this.formatos.find(
          formato => formato.nombre === nombre
        )?.id
      )
      .filter(
        (id): id is number =>
          id !== undefined
      );

    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.editando = false;
    this.peliculaEditandoId = null;
    this.peliculaSeleccionada = null;
    this.generosSeleccionados = [];
    this.formatosSeleccionados = [];
  }

  async guardarPelicula(datos: any) {
    if (this.editando && this.peliculaEditandoId) {
      await this.peliculasService.actualizarPelicula(
        this.peliculaEditandoId,
        datos
      );
    } else {
      await this.peliculasService.crearPelicula(datos);
    }

    this.cerrarFormulario();
    await this.cargarDatos();
  }

  async cambiarEstado(pelicula: Pelicula) {
    const confirmar = confirm(
      `¿Querés desactivar la película "${pelicula.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    await this.peliculasService.desactivarPelicula(
      pelicula.id
    );

    await this.cargarDatos();
  }

  formatearDuracion(minutos: number): string {
    return formatearDuracion(minutos);
  }
}