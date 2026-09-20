import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Supabase } from '../services/supabase';

interface Genero {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-generos',
  imports: [CommonModule],
  templateUrl: './generos.html',
  styleUrl: './generos.css'
})
export class Generos implements OnInit {

  generos = signal<Genero[]>([]);

  constructor(private supabaseService: Supabase) {
  }

  ngOnInit() {
    this.cargarGeneros();
  }

  async cargarGeneros() {

    const { data, error } = await this.supabaseService
      .getClient()
      .from('genero')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error al cargar géneros:', error);
      return;
    }

    console.log('Géneros cargados:', data);

    this.generos.set(data ?? []);

    console.log('Cantidad en el array:', this.generos().length);
  }
}