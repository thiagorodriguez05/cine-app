import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  DiaPropuesta
} from '../../../../services/funciones.service';

@Component({
  selector: 'app-programacion-propuesta',
  imports: [CommonModule],
  templateUrl: './programacion-propuesta.html',
  styleUrl: './programacion-propuesta.css'
})
export class ProgramacionPropuesta {

  @Input()
  propuesta: DiaPropuesta[] = [];

  @Output()
  volver = new EventEmitter<void>();

  @Output()
  confirmar = new EventEmitter<void>();

  volverAEditar() {
    this.volver.emit();
  }

  confirmarProgramacion() {
    this.confirmar.emit();
  }

  formatearFecha(fecha: string): string {

    const fechaDate =
      new Date(
        fecha + 'T00:00:00'
      );

    return fechaDate.toLocaleDateString(
      'es-AR',
      {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    );
  }
}