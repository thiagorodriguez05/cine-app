import { Injectable } from '@angular/core';
import { Supabase } from './supabase';

export interface Genero {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeneroService {

  constructor(
    private supabaseService: Supabase
  ) {}

  // Obtiene los géneros desde la base de datos y los ordena por nombre.
  async obtenerGeneros(): Promise<Genero[]> {
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('genero')
        .select('*')
        .order('nombre');

    if (error) {
      console.error(
        'Error al cargar géneros:',
        error
      );
      return [];
    }

    return data ?? [];
  }
}