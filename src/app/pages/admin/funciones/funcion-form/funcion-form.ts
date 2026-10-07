import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  DatosProgramacion,
  PeliculaProgramacion
} from '../../../../services/funciones.service';

interface Pelicula {
  id: string;
  nombre: string;
  duracion: number;
}

@Component({
  selector: 'app-funcion-form',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './funcion-form.html',
  styleUrl: './funcion-form.css'
})
export class FuncionForm implements OnChanges {

  @Input() peliculas: Pelicula[] = [];

  @Input() formatosPorPelicula: {
    [peliculaId: string]: string[]
  } = {};

  @Input() mostrar = false;

  @Output()
  guardar =
    new EventEmitter<DatosProgramacion>();

  @Output()
  cancelar =
    new EventEmitter<void>();

  fechaDesde = '';
  idioma = 'Castellano';

  peliculasSeleccionadas:
    PeliculaProgramacion[] = [];

  horarios: string[] =
    this.generarHorarios();

  dias: {
    numero: number;
    nombre: string;
  }[] = [];

  ngOnChanges(changes: SimpleChanges) {

    if (
      changes['mostrar'] &&
      this.mostrar
    ) {
      this.limpiarFormulario();
    }
  }

  private generarHorarios(): string[] {

    const horarios: string[] = [];

    for (
      let minutos = 10 * 60;
      minutos <= 23 * 60;
      minutos += 30
    ) {

      const horas =
        Math.floor(minutos / 60);

      const minutosRestantes =
        minutos % 60;

      horarios.push(
        `${String(horas).padStart(2, '0')}:${String(minutosRestantes).padStart(2, '0')}`
      );
    }

    return horarios;
  }

  horariosHasta(
    peliculaId: string
  ): string[] {

    const pelicula =
      this.peliculasSeleccionadas.find(
        item =>
          item.peliculaId === peliculaId
      );

    if (
      !pelicula ||
      !pelicula.horaDesde
    ) {
      return this.horarios;
    }

    return this.horarios.filter(
      horario =>
        horario > pelicula.horaDesde
    );
  }

  seleccionarPelicula(
    peliculaId: string
  ) {

    const indice =
      this.peliculasSeleccionadas.findIndex(
        pelicula =>
          pelicula.peliculaId === peliculaId
      );

    if (indice >= 0) {

      this.peliculasSeleccionadas.splice(
        indice,
        1
      );

      return;
    }

    this.peliculasSeleccionadas.push({
      peliculaId,
      formatos: [],
      dias: [],
      horaDesde: '',
      horaHasta: ''
    });
  }

  peliculaSeleccionada(
    peliculaId: string
  ): boolean {

    return this.peliculasSeleccionadas.some(
      pelicula =>
        pelicula.peliculaId === peliculaId
    );
  }

  obtenerFormatos(
    peliculaId: string
  ): string[] {

    return (
      this.formatosPorPelicula[peliculaId] ??
      []
    );
  }

  seleccionarFormato(
    peliculaId: string,
    formato: string
  ) {

    const pelicula =
      this.peliculasSeleccionadas.find(
        pelicula =>
          pelicula.peliculaId === peliculaId
      );

    if (!pelicula) {
      return;
    }

    const indice =
      pelicula.formatos.indexOf(formato);

    if (indice >= 0) {

      pelicula.formatos.splice(
        indice,
        1
      );

      return;
    }

    pelicula.formatos.push(formato);
  }

  formatoSeleccionado(
    peliculaId: string,
    formato: string
  ): boolean {

    const pelicula =
      this.peliculasSeleccionadas.find(
        pelicula =>
          pelicula.peliculaId === peliculaId
      );

    return (
      pelicula?.formatos.includes(formato) ??
      false
    );
  }

  seleccionarDia(
    peliculaId: string,
    dia: number
  ) {

    const pelicula =
      this.peliculasSeleccionadas.find(
        item =>
          item.peliculaId === peliculaId
      );

    if (!pelicula) {
      return;
    }

    const indice =
      pelicula.dias.indexOf(dia);

    if (indice >= 0) {

      pelicula.dias.splice(
        indice,
        1
      );

      return;
    }

    pelicula.dias.push(dia);
  }

  diaSeleccionado(
    peliculaId: string,
    dia: number
  ): boolean {

    const pelicula =
      this.peliculasSeleccionadas.find(
        item =>
          item.peliculaId === peliculaId
      );

    return (
      pelicula?.dias.includes(dia) ??
      false
    );
  }

  cambiarFecha(
    fecha: string
  ) {

    this.fechaDesde = fecha;

    this.generarDias();

    for (
      const pelicula
      of this.peliculasSeleccionadas
    ) {
      pelicula.dias = [];
    }
  }

  private generarDias() {

    this.dias = [];

    if (!this.fechaDesde) {
      return;
    }

    const fecha =
      new Date(
        this.fechaDesde + 'T00:00:00'
      );

    const nombresDias = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado'
    ];

    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const fechaDia =
        new Date(fecha);

      fechaDia.setDate(
        fecha.getDate() + i
      );

      const diaSemana =
        fechaDia.getDay();

      this.dias.push({
        numero: i,
        nombre:
          `${nombresDias[diaSemana]} ${fechaDia.getDate()}`
      });
    }
  }

  fechaMinima(): string {

    const hoy = new Date();

    const año =
      hoy.getFullYear();

    const mes =
      String(
        hoy.getMonth() + 1
      ).padStart(2, '0');

    const dia =
      String(
        hoy.getDate()
      ).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  obtenerFechaFin(): string {

    if (!this.fechaDesde) {
      return '';
    }

    const fecha =
      new Date(
        this.fechaDesde + 'T00:00:00'
      );

    fecha.setDate(
      fecha.getDate() + 6
    );

    const año =
      fecha.getFullYear();

    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(2, '0');

    const dia =
      String(
        fecha.getDate()
      ).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  validarFecha(): boolean {

    if (!this.fechaDesde) {
      return false;
    }

    const hoy = new Date();

    const fechaSeleccionada =
      new Date(
        this.fechaDesde + 'T00:00:00'
      );

    hoy.setHours(
      0,
      0,
      0,
      0
    );

    return fechaSeleccionada >= hoy;
  }

  validarFranjaHoraria(
    pelicula: PeliculaProgramacion
  ): boolean {

    if (
      !pelicula.horaDesde ||
      !pelicula.horaHasta
    ) {
      return false;
    }

    return (
      pelicula.horaDesde <
      pelicula.horaHasta
    );
  }

  guardarFormulario() {

    if (!this.validarFormulario()) {
      return;
    }

    this.guardar.emit({
      fechaDesde: this.fechaDesde,
      idioma: this.idioma,
      peliculas: this.peliculasSeleccionadas
    });
  }

  validarFormulario(): boolean {

    if (!this.fechaDesde) {

      alert(
        'Seleccioná una fecha de inicio.'
      );

      return false;
    }

    if (!this.validarFecha()) {

      alert(
        'La fecha no puede ser anterior a hoy.'
      );

      return false;
    }

    if (
      this.peliculasSeleccionadas.length === 0
    ) {

      alert(
        'Seleccioná al menos una película.'
      );

      return false;
    }

    for (
      const pelicula
      of this.peliculasSeleccionadas
    ) {

      const datosPelicula =
        this.peliculas.find(
          item =>
            item.id === pelicula.peliculaId
        );

      const nombrePelicula =
        datosPelicula?.nombre ??
        'la película';

      if (
        pelicula.formatos.length === 0
      ) {

        alert(
          `Seleccioná al menos un formato para "${nombrePelicula}".`
        );

        return false;
      }

      if (
        pelicula.dias.length === 0
      ) {

        alert(
          `Seleccioná al menos un día para "${nombrePelicula}".`
        );

        return false;
      }

      if (!pelicula.horaDesde) {

        alert(
          `Seleccioná el horario desde para "${nombrePelicula}".`
        );

        return false;
      }

      if (!pelicula.horaHasta) {

        alert(
          `Seleccioná el horario hasta para "${nombrePelicula}".`
        );

        return false;
      }

      if (
        !this.validarFranjaHoraria(
          pelicula
        )
      ) {

        alert(
          `El horario hasta debe ser posterior al horario desde para "${nombrePelicula}".`
        );

        return false;
      }
    }

    return true;
  }

  cerrar() {
    this.cancelar.emit();
  }

  limpiarFormulario() {

    this.fechaDesde = '';
    this.idioma = 'Castellano';

    this.peliculasSeleccionadas = [];

    this.dias = [];
  }
}