import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  CategoriaService,
  Categoria
} from '../../../../services/categoria.service';

@Component({
  selector: 'app-categorias',
  imports: [CommonModule],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css'
})
export class Categorias implements OnInit {

  // Signal que contiene las categorías disponibles.
  categorias = signal<Categoria[]>([]);

  constructor(
    private categoriaService: CategoriaService
  ) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  // Obtiene las categorías desde el servicio y actualiza el signal.
  async cargarCategorias() {
    const categorias =
      await this.categoriaService.obtenerCategorias();

    this.categorias.set(categorias);
  }
}