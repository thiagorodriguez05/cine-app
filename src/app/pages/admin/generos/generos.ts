import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  GeneroService,
  Genero
} from '../../../services/genero.service';

@Component({
  selector: 'app-generos',
  imports: [CommonModule],
  templateUrl: './generos.html',
  styleUrl: './generos.css'
})
export class Generos implements OnInit {

  // Signal que contiene los géneros disponibles.
  generos = signal<Genero[]>([]);

  constructor(
    private generoService: GeneroService
  ) {}

  ngOnInit() {
    this.cargarGeneros();
  }

  // Obtiene los géneros desde el servicio y actualiza el signal.
  async cargarGeneros() {
    const generos =
      await this.generoService.obtenerGeneros();

    this.generos.set(generos);
  }
}