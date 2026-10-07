import { Injectable } from '@angular/core';

import { Supabase } from './supabase';

export interface Cupon {
  id: number;
  codigo: string;
  descripcion: string;
  porcentaje_descuento: number;
  estado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CuponesService {

  constructor(
    private supabaseService: Supabase
  ) {}

  async obtenerCupones(): Promise<Cupon[]> {
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('cupones')
        .select('*')
        .eq('estado', true);

    if (error) {
      console.error(
        'Error al obtener los cupones:',
        error
      );

      return [];
    }

    return data ?? [];
  }
}