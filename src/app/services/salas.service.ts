import { Injectable } from '@angular/core';
import { Supabase } from './supabase';

interface Sala {
  id: number;
  nombre: string;
  formato: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalasService {

  constructor(
    private supabaseService: Supabase
  ) {}

  // Obtiene las salas desde la base de datos y las ordena por ID.
  async obtenerSalas(): Promise<Sala[]> {
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('salas')
        .select('*')
        .order('id');

    if (error) {
      console.error(
        'Error al cargar salas:',
        error
      );
      return [];
    }

    return data ?? [];
  }
}