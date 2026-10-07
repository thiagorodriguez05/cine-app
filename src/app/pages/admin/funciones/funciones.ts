import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  DatosProgramacion,
  DiaPropuesta,
  FuncionesService
} from '../../../services/funciones.service';

import { FuncionForm } from './funcion-form/funcion-form';
import { ProgramacionPropuesta } from './programacion-propuesta/programacion-propuesta';

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

interface Pelicula {
  id: string;
  nombre: string;
  duracion: number;
}

@Component({
  selector: 'app-funciones',
  imports: [
    CommonModule,
    FuncionForm,
    ProgramacionPropuesta
  ],
  templateUrl: './funciones.html',
  styleUrl: './funciones.css'
})
export class Funciones implements OnInit {

  funciones = signal<Funcion[]>([]);
  peliculas = signal<Pelicula[]>([]);

  formatosPorPelicula =
    signal<{
      [peliculaId: string]: string[]
    }>({});

  propuesta = signal<DiaPropuesta[]>([]);

  mostrarModal = false;
  mostrarPropuesta = false;

  generandoProgramacion = false;
  confirmandoProgramacion = false;

  datosProgramacion:
    DatosProgramacion | null = null;

  constructor(
    private funcionesService: FuncionesService
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.funciones.set(
      await this.funcionesService
        .obtenerFunciones()
    );

    this.peliculas.set(
      await this.funcionesService
        .obtenerPeliculas()
    );

    this.formatosPorPelicula.set(
      await this.funcionesService
        .obtenerFormatosPorPelicula()
    );
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  async generarProgramacion(
    datos: DatosProgramacion
  ) {

    if (this.generandoProgramacion) {
      return;
    }

    this.generandoProgramacion = true;

    try {

      const resultado =
        await this.funcionesService
          .generarPropuestaProgramacion(
            datos
          );

      if (resultado.length === 0) {
        alert(
          'No se pudo generar una programación con los datos seleccionados.'
        );

        return;
      }

      this.datosProgramacion = datos;

      this.propuesta.set(
        resultado
      );

      this.mostrarModal = false;
      this.mostrarPropuesta = true;

    } finally {

      this.generandoProgramacion = false;
    }
  }

  async confirmarProgramacion() {

    if (
      this.confirmandoProgramacion ||
      !this.datosProgramacion
    ) {
      return;
    }

    this.confirmandoProgramacion = true;

    const datos =
      this.datosProgramacion;

    for (
      const dia of this.propuesta()
    ) {

      for (
        const sala of dia.salas
      ) {

        for (
          const funcion of sala.funciones
        ) {

          const creada =
            await this.funcionesService
              .crearFuncion({

                pelicula_id:
                  funcion.peliculaId,

                sala_id:
                  sala.salaId,

                fecha:
                  dia.fecha,

                hora_de_inicio:
                  funcion.horaInicio,

                hora_de_fin:
                  funcion.horaFin,

                formato:
                  sala.formato,

                idioma:
                  datos.idioma,

                precio_base:
                  10000
              });

          if (!creada) {

            this.confirmandoProgramacion =
              false;

            alert(
              'Ocurrió un error al guardar la programación.'
            );

            return;
          }
        }
      }
    }

    this.confirmandoProgramacion =
      false;

    alert(
      'La programación semanal fue confirmada correctamente.'
    );

    this.mostrarPropuesta = false;

    this.propuesta.set([]);

    this.datosProgramacion = null;

    await this.cargarDatos();
  }

  cerrarPropuesta() {
    this.mostrarPropuesta = false;

    this.propuesta.set([]);

    this.datosProgramacion = null;
  }
}