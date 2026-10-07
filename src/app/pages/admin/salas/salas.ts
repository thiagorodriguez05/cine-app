import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SalasService } from '../../../services/salas.service';

interface Sala {
  id: number;
  nombre: string;
  formato: string;
}

@Component({
  selector: 'app-salas',
  imports: [CommonModule],
  templateUrl: './salas.html',
  styleUrl: './salas.css'
})
export class Salas implements OnInit {

  // Signal que contiene las salas disponibles.
  salas = signal<Sala[]>([]);

  constructor(
    private salasService: SalasService
  ) {}

  ngOnInit() {
    this.cargarSalas();
  }

  // Obtiene las salas mediante el servicio y actualiza el signal.
  async cargarSalas() {
    this.salas.set(
      await this.salasService.obtenerSalas()
    );
  }
}