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

interface Genero {
  id: number;
  nombre: string;
}

interface Formato {
  id: number;
  nombre: string;
}

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
  selector: 'app-pelicula-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './peliculas-form.html',
  styleUrl: './peliculas-form.css'
})
export class PeliculaForm implements OnChanges {

  @Input() generos: Genero[] = [];
  @Input() formatos: Formato[] = [];
  @Input() editando = false;
  @Input() pelicula: Pelicula | null = null;

  private _generosSeleccionadosIniciales: number[] = [];

  // Copiamos las selecciones iniciales para trabajar con ellas dentro del formulario.
  @Input()
  set generosSeleccionadosIniciales(value: number[]) {
    this._generosSeleccionadosIniciales = value ?? [];
    this.generosSeleccionados = [
      ...this._generosSeleccionadosIniciales
    ];
  }

  get generosSeleccionadosIniciales(): number[] {
    return this._generosSeleccionadosIniciales;
  }

  private _formatosSeleccionadosIniciales: number[] = [];

  @Input()
  set formatosSeleccionadosIniciales(value: number[]) {
    this._formatosSeleccionadosIniciales = value ?? [];
    this.formatosSeleccionados = [
      ...this._formatosSeleccionadosIniciales
    ];
  }

  get formatosSeleccionadosIniciales(): number[] {
    return this._formatosSeleccionadosIniciales;
  }

  nombre = '';
  sinopsis = '';
  duracion: number | null = null;
  fechaDeEstreno = '';
  clasificacionDeEdad = 0;
  imagenSeleccionada: File | null = null;
  generosSeleccionados: number[] = [];
  formatosSeleccionados: number[] = [];

  @Output()
  guardar = new EventEmitter<any>();

  @Output()
  cancelar = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pelicula'] && this.pelicula) {
      this.cargarDatosPelicula();
    }
  }

  cargarDatosPelicula() {
    if (!this.pelicula) {
      return;
    }

    this.nombre = this.pelicula.nombre;
    this.sinopsis = this.pelicula.sinopsis;
    this.duracion = this.pelicula.duracion;
    this.fechaDeEstreno = this.pelicula.fecha_de_estreno;
    this.clasificacionDeEdad =
      this.pelicula.clasificacion_de_edad;

    // En una edición, si no se selecciona una nueva imagen, se conserva la actual.
    this.imagenSeleccionada = null;
  }

  fechaMinima(): string {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  seleccionarImagen(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.imagenSeleccionada = input.files[0];
    } else {
      this.imagenSeleccionada = null;
    }
  }

  seleccionarGenero(generoId: number) {
    if (this.generosSeleccionados.includes(generoId)) {
      this.generosSeleccionados =
        this.generosSeleccionados.filter(
          id => id !== generoId
        );
    } else {
      this.generosSeleccionados.push(generoId);
    }
  }

  seleccionarFormato(formatoId: number) {
    if (this.formatosSeleccionados.includes(formatoId)) {
      this.formatosSeleccionados =
        this.formatosSeleccionados.filter(
          id => id !== formatoId
        );
    } else {
      this.formatosSeleccionados.push(formatoId);
    }
  }

  guardarFormulario() {
    if (!this.validarFormulario()) {
      return;
    }

    this.guardar.emit({
      nombre: this.nombre,
      sinopsis: this.sinopsis,
      duracion: this.duracion,
      fechaDeEstreno: this.fechaDeEstreno,
      clasificacionDeEdad: this.clasificacionDeEdad,
      imagen: this.imagenSeleccionada,
      generosSeleccionados: this.generosSeleccionados,
      formatosSeleccionados: this.formatosSeleccionados
    });
  }

  // Valida que los datos obligatorios estén completos antes de guardar.
  validarFormulario(): boolean {
    if (!this.editando && !this.imagenSeleccionada) {
      alert(
        'Debés seleccionar una imagen para la película.'
      );
      return false;
    }

    if (!this.nombre.trim()) {
      alert(
        'Debés ingresar el nombre de la película.'
      );
      return false;
    }

    if (!this.sinopsis.trim()) {
      alert(
        'Debés ingresar la sinopsis.'
      );
      return false;
    }

    if (!this.duracion || this.duracion <= 0) {
      alert(
        'Debés ingresar una duración válida.'
      );
      return false;
    }

    if (!this.fechaDeEstreno) {
      alert(
        'Debés ingresar la fecha de estreno.'
      );
      return false;
    }

    if (this.fechaDeEstreno < this.fechaMinima()) {
      alert(
        'La fecha de estreno no puede ser anterior a hoy.'
      );
      return false;
    }

    if (this.generosSeleccionados.length === 0) {
      alert(
        'Debés seleccionar al menos un género.'
      );
      return false;
    }

    if (this.formatosSeleccionados.length === 0) {
      alert(
        'Debés seleccionar al menos un formato.'
      );
      return false;
    }

    return true;
  }

  cerrar() {
    this.cancelar.emit();
  }

  limpiarFormulario() {
    this.nombre = '';
    this.sinopsis = '';
    this.duracion = null;
    this.fechaDeEstreno = '';
    this.clasificacionDeEdad = 0;
    this.imagenSeleccionada = null;
    this.generosSeleccionados = [];
    this.formatosSeleccionados = [];
  }
}