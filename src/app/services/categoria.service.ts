import { Injectable } from '@angular/core';
import { Supabase } from './supabase';

export interface Categoria {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  constructor(private supabaseService: Supabase) {}

  // Obtiene las categorías desde la base de datos y las ordena por nombre.
  async obtenerCategorias(): Promise<Categoria[]> {
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('categorias')
        .select('*')
        .order('nombre');

    if (error) {
      console.error('Error al cargar categorías:', error);
      return [];
    }

    return data ?? [];
  }
}