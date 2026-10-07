import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { formatearDuracion } from '../../utils/peliculas.utils';

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
  selector: 'app-card',
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card {

  @Input() pelicula!: Pelicula;
    formatearDuracion(minutos: number): string {
    return formatearDuracion(minutos);
  }

}