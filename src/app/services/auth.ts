import { Injectable } from '@angular/core';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  constructor(private superbaseService: Supabase){
  }

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

