import { Injectable } from '@angular/core';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  constructor(private superbaseService: Supabase) {}

  async login(email: string, password: string) {
    const { data, error } = await this.superbaseService
      .getClient()
      .auth
      .signInWithPassword({
        email,
        password
      });

    return { data, error };
  }

  async registrar(
    email: string,
    password: string,
    datos: {
      nombre: string;
      apellido: string;
      fecha_de_nacimiento: string;
      tipo_de_sangre: string;
      color_de_ojos: string;
    }
  ) {
    const { data, error } = await this.superbaseService
      .getClient()
      .auth
      .signUp({
        email,
        password,
        options: {
          data: {
            nombre: datos.nombre,
            apellido: datos.apellido,
            fecha_de_nacimiento: datos.fecha_de_nacimiento,
            tipo_de_sangre: datos.tipo_de_sangre,
            color_de_ojos: datos.color_de_ojos
          }
        }
      });

    return { data, error };
  }

  async obtenerRol(userId: string) {
    const { data, error } = await this.superbaseService
      .getClient()
      .from('usuarios')
      .select('rol')
      .eq('id', userId)
      .single();

    return { data, error };
  }
}