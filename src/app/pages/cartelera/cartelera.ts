import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Supabase } from '../../services/supabase';
import { FuncionesService } from '../../services/funciones.service';
import { Navbar } from '../../shared/navbar/navbar';

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

interface Funcion {
  id: number;
  pelicula_id: string;
  sala_id: number;
  fecha: string;
  hora_de_inicio: string;
  hora_de_fin: string;
  formato: string;
  idioma: string;
  precio_base: number;
}

interface GrupoFunciones {
  formato: string;
  idioma: string;
  funciones: Funcion[];
}

@Component({
  selector: 'app-cartelera',
  imports: [
    CommonModule,
    RouterLink,
    Navbar
  ],
  templateUrl: './cartelera.html',
  styleUrl: './cartelera.css'
})
export class Cartelera implements OnInit {

  pelicula = signal<Pelicula | null>(null);
  funciones = signal<Funcion[]>([]);
  fechas = signal<string[]>([]);
  fechaSeleccionada = signal<string>('');
  formatos = signal<string[]>([]);
  idiomas = signal<string[]>([]);
  formatoSeleccionado = signal<string>('');
  idiomaSeleccionado = signal<string>('');
  funcionSeleccionada = signal<Funcion | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: Supabase,
    private funcionesService: FuncionesService
  ) {}

  ngOnInit() {
    this.cargarPelicula();
  }

  async cargarPelicula() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('peliculas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al cargar la película:', error);
      return;
    }

    if (!data) {
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaEstreno = new Date(data.fecha_de_estreno);
    fechaEstreno.setHours(0, 0, 0, 0);

    if (data.estado === false && fechaEstreno <= hoy) {
      console.error('La película no está disponible.');
      return;
    }

    this.pelicula.set(data);

    if (fechaEstreno > hoy) {
      this.funciones.set([]);
      this.fechas.set([]);
      this.formatos.set([]);
      this.idiomas.set([]);
      return;
    }

    await this.cargarFunciones(id);
  }

  esProximamente(): boolean {
    const pelicula = this.pelicula();

    if (!pelicula) {
      return false;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaEstreno = new Date(pelicula.fecha_de_estreno);
    fechaEstreno.setHours(0, 0, 0, 0);

    return fechaEstreno > hoy;
  }

  async cargarFunciones(peliculaId: string) {
    const todasLasFunciones =
      await this.funcionesService.obtenerFunciones();

    const ahora = new Date();

    const inicioHoy = new Date(ahora);
    inicioHoy.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioHoy);
    finSemana.setDate(finSemana.getDate() + 6);

    const funcionesPelicula = todasLasFunciones.filter(funcion => {
      if (funcion.pelicula_id !== peliculaId) {
        return false;
      }

      const fechaFuncion = new Date(
        funcion.fecha + 'T00:00:00'
      );

      if (
        fechaFuncion < inicioHoy ||
        fechaFuncion > finSemana
      ) {
        return false;
      }

      if (fechaFuncion > inicioHoy) {
        return true;
      }

      const [horas, minutos] =
        funcion.hora_de_inicio.split(':').map(Number);

      const horaFuncion = new Date(ahora);

      horaFuncion.setHours(
        horas,
        minutos,
        0,
        0
      );

      return horaFuncion > ahora;
    });

    this.funciones.set(funcionesPelicula);

    const fechasSemana: string[] = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioHoy);

      fecha.setDate(fecha.getDate() + i);

      fechasSemana.push(
        this.formatearFechaParaBaseDeDatos(fecha)
      );
    }

    this.fechas.set(fechasSemana);
    this.fechaSeleccionada.set(fechasSemana[0]);

    const formatos = [
      ...new Set(
        funcionesPelicula.map(funcion => funcion.formato)
      )
    ];

    const idiomas = [
      ...new Set(
        funcionesPelicula.map(funcion => funcion.idioma)
      )
    ];

    this.formatos.set(formatos);
    this.idiomas.set(idiomas);
  }

  seleccionarFecha(fecha: string) {
    this.fechaSeleccionada.set(fecha);
    this.funcionSeleccionada.set(null);
  }

  seleccionarFormato(formato: string) {
    if (this.formatoSeleccionado() === formato) {
      this.formatoSeleccionado.set('');
      this.funcionSeleccionada.set(null);
      return;
    }

    this.formatoSeleccionado.set(formato);
    this.funcionSeleccionada.set(null);
  }

  seleccionarIdioma(idioma: string) {
    if (this.idiomaSeleccionado() === idioma) {
      this.idiomaSeleccionado.set('');
      this.funcionSeleccionada.set(null);
      return;
    }

    this.idiomaSeleccionado.set(idioma);
    this.funcionSeleccionada.set(null);
  }

  seleccionarFuncion(funcion: Funcion) {
    this.funcionSeleccionada.set(funcion);
  }

  comprarEntradas() {
    const funcion = this.funcionSeleccionada();

    if (!funcion) {
      return;
    }

    this.router.navigate([
      '/compra',
      funcion.id
    ]);
  }

  obtenerFuncionesFiltradas(): Funcion[] {
    return this.funciones().filter(funcion => {
      if (funcion.fecha !== this.fechaSeleccionada()) {
        return false;
      }

      if (
        this.formatoSeleccionado() &&
        funcion.formato !== this.formatoSeleccionado()
      ) {
        return false;
      }

      if (
        this.idiomaSeleccionado() &&
        funcion.idioma !== this.idiomaSeleccionado()
      ) {
        return false;
      }

      return true;
    });
  }

  obtenerFuncionesAgrupadas(): GrupoFunciones[] {
    const funciones = this.obtenerFuncionesFiltradas();
    const grupos: GrupoFunciones[] = [];

    for (const funcion of funciones) {
      let grupo = grupos.find(
        grupo =>
          grupo.formato === funcion.formato &&
          grupo.idioma === funcion.idioma
      );

      if (!grupo) {
        grupo = {
          formato: funcion.formato,
          idioma: funcion.idioma,
          funciones: []
        };

        grupos.push(grupo);
      }

      grupo.funciones.push(funcion);
    }

    return grupos;
  }

  formatearFechaParaBaseDeDatos(fecha: Date): string {
    const año = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  formatearFecha(fecha: string): string {
    const fechaObj = new Date(
      fecha + 'T00:00:00'
    );

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const mañana = new Date(hoy);

    mañana.setDate(
      mañana.getDate() + 1
    );

    if (fechaObj.getTime() === hoy.getTime()) {
      return 'HOY';
    }

    if (fechaObj.getTime() === mañana.getTime()) {
      return 'MAÑANA';
    }

    return fechaObj
      .toLocaleDateString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      })
      .toUpperCase();
  }

  formatearDuracion(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    if (horas === 0) {
      return `${minutosRestantes} minutos`;
    }

    if (minutosRestantes === 0) {
      return `${horas} horas`;
    }

    return `${horas} horas ${minutosRestantes} minutos`;
  }
}