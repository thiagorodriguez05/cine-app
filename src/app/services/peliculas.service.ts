import { Injectable } from '@angular/core';
import { Supabase } from './supabase';

interface Pelicula {
  id: string;
  nombre: string;
  imagen: string;
  sinopsis: string;
  duracion: number;
  fecha_de_estreno: string;
  clasificacion_de_edad: number;
  estado: boolean;
}

interface Genero {
  id: number;
  nombre: string;
}

interface Formato {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class PeliculasService {

  constructor(
    private supabaseService: Supabase
  ) {}

  // Obtiene todas las películas ordenadas por nombre.
  async obtenerPeliculas(): Promise<Pelicula[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('peliculas')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error al cargar películas:', error);
      return [];
    }

    return data ?? [];
  }

  // Obtiene los géneros disponibles para asociarlos a las películas.
  async obtenerGeneros(): Promise<Genero[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('genero')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error al cargar géneros:', error);
      return [];
    }

    return data ?? [];
  }

  // Obtiene los formatos disponibles.
  async obtenerFormatos(): Promise<Formato[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('formatos')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error al cargar formatos:', error);
      return [];
    }

    return data ?? [];
  }

  // Construye un mapa con los formatos asociados a cada película.
  async obtenerFormatosPorPelicula(): Promise<{
    [peliculaId: string]: string[]
  }> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('peliculas_formatos')
      .select(`
        pelicula_id,
        formatos (
          nombre
        )
      `);

    if (error) {
      console.error(
        'Error al cargar formatos de películas:',
        error
      );
      return {};
    }

    const mapa: {
      [peliculaId: string]: string[]
    } = {};

    for (const relacion of data ?? []) {
      const formatosRelacionados =
        Array.isArray(relacion.formatos)
          ? relacion.formatos
          : [relacion.formatos];

      for (const formato of formatosRelacionados) {
        if (!formato?.nombre) {
          continue;
        }

        if (!mapa[relacion.pelicula_id]) {
          mapa[relacion.pelicula_id] = [];
        }

        mapa[relacion.pelicula_id].push(
          formato.nombre
        );
      }
    }

    return mapa;
  }

  // Obtiene los IDs de los géneros asociados a una película.
  async obtenerGenerosDePelicula(
    peliculaId: string
  ): Promise<number[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('peliculas_genero')
      .select('genero_id')
      .eq('pelicula_id', peliculaId);

    if (error) {
      console.error(
        'Error al cargar géneros de la película:',
        error
      );
      return [];
    }

    return (data ?? []).map(
      relacion => relacion.genero_id
    );
  }

  // Obtiene los IDs de los formatos asociados a una película.
  async obtenerFormatosDePelicula(
    peliculaId: string
  ): Promise<number[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('peliculas_formatos')
      .select('formato_id')
      .eq('pelicula_id', peliculaId);

    if (error) {
      console.error(
        'Error al cargar formatos de la película:',
        error
      );
      return [];
    }

    return (data ?? []).map(
      relacion => relacion.formato_id
    );
  }

  // Sube la imagen al Storage y devuelve su URL pública.
  async subirImagen(
    imagen: File
  ): Promise<string | null> {
    const nombreArchivo =
      Date.now() + '_' + imagen.name;

    const rutaImagen =
      'peliculas/' + nombreArchivo;

    const { error } = await this.supabaseService
      .getClient()
      .storage
      .from('peliculas')
      .upload(rutaImagen, imagen);

    if (error) {
      console.error(
        'Error al subir imagen:',
        error
      );
      return null;
    }

    const { data } =
      this.supabaseService
        .getClient()
        .storage
        .from('peliculas')
        .getPublicUrl(rutaImagen);

    return data.publicUrl;
  }

  // Crea la película y guarda sus relaciones con géneros y formatos.
  async crearPelicula(
    datos: any
  ): Promise<boolean> {
    const imagenUrl =
      await this.subirImagen(datos.imagen);

    if (!imagenUrl) {
      return false;
    }

    const {
      data: pelicula,
      error: errorPelicula
    } = await this.supabaseService
      .getClient()
      .from('peliculas')
      .insert({
        nombre: datos.nombre,
        imagen: imagenUrl,
        sinopsis: datos.sinopsis,
        duracion: datos.duracion,
        fecha_de_estreno: datos.fechaDeEstreno,
        clasificacion_de_edad:
          datos.clasificacionDeEdad
      })
      .select()
      .single();

    if (errorPelicula) {
      console.error(
        'Error al crear película:',
        errorPelicula
      );
      return false;
    }

    const relacionesGeneros =
      datos.generosSeleccionados.map(
        (generoId: number) => ({
          pelicula_id: pelicula.id,
          genero_id: generoId
        })
      );

    const { error: errorGeneros } =
      await this.supabaseService
        .getClient()
        .from('peliculas_genero')
        .insert(relacionesGeneros);

    if (errorGeneros) {
      console.error(
        'Error al guardar géneros:',
        errorGeneros
      );
      return false;
    }

    const relacionesFormatos =
      datos.formatosSeleccionados.map(
        (formatoId: number) => ({
          pelicula_id: pelicula.id,
          formato_id: formatoId
        })
      );

    const { error: errorFormatos } =
      await this.supabaseService
        .getClient()
        .from('peliculas_formatos')
        .insert(relacionesFormatos);

    if (errorFormatos) {
      console.error(
        'Error al guardar formatos:',
        errorFormatos
      );
      return false;
    }

    return true;
  }

  // Actualiza los datos de la película y reemplaza sus relaciones de géneros y formatos.
  async actualizarPelicula(
    peliculaId: string,
    datos: any
  ): Promise<boolean> {
    let imagenUrl: string | null = null;

    if (datos.imagen) {
      imagenUrl =
        await this.subirImagen(datos.imagen);

      if (!imagenUrl) {
        return false;
      }
    }

    const datosActualizados: any = {
      nombre: datos.nombre,
      sinopsis: datos.sinopsis,
      duracion: datos.duracion,
      fecha_de_estreno: datos.fechaDeEstreno,
      clasificacion_de_edad:
        datos.clasificacionDeEdad
    };

    if (imagenUrl) {
      datosActualizados.imagen = imagenUrl;
    }

    const { error: errorPelicula } =
      await this.supabaseService
        .getClient()
        .from('peliculas')
        .update(datosActualizados)
        .eq('id', peliculaId);

    if (errorPelicula) {
      console.error(
        'Error al actualizar película:',
        errorPelicula
      );
      return false;
    }

    const { error: errorEliminarGeneros } =
      await this.supabaseService
        .getClient()
        .from('peliculas_genero')
        .delete()
        .eq('pelicula_id', peliculaId);

    if (errorEliminarGeneros) {
      console.error(
        'Error al eliminar géneros:',
        errorEliminarGeneros
      );
      return false;
    }

    const relacionesGeneros =
      datos.generosSeleccionados.map(
        (generoId: number) => ({
          pelicula_id: peliculaId,
          genero_id: generoId
        })
      );

    const { error: errorInsertarGeneros } =
      await this.supabaseService
        .getClient()
        .from('peliculas_genero')
        .insert(relacionesGeneros);

    if (errorInsertarGeneros) {
      console.error(
        'Error al guardar géneros:',
        errorInsertarGeneros
      );
      return false;
    }

    const { error: errorEliminarFormatos } =
      await this.supabaseService
        .getClient()
        .from('peliculas_formatos')
        .delete()
        .eq('pelicula_id', peliculaId);

    if (errorEliminarFormatos) {
      console.error(
        'Error al eliminar formatos:',
        errorEliminarFormatos
      );
      return false;
    }

    const relacionesFormatos =
      datos.formatosSeleccionados.map(
        (formatoId: number) => ({
          pelicula_id: peliculaId,
          formato_id: formatoId
        })
      );

    const { error: errorInsertarFormatos } =
      await this.supabaseService
        .getClient()
        .from('peliculas_formatos')
        .insert(relacionesFormatos);

    if (errorInsertarFormatos) {
      console.error(
        'Error al guardar formatos:',
        errorInsertarFormatos
      );
      return false;
    }

    return true;
  }

  // Desactiva la película sin eliminarla de la base de datos.
  async desactivarPelicula(
    peliculaId: string
  ): Promise<boolean> {
    const { error } =
      await this.supabaseService
        .getClient()
        .from('peliculas')
        .update({ estado: false })
        .eq('id', peliculaId);

    if (error) {
      console.error(
        'Error al desactivar película:',
        error
      );
      return false;
    }

    return true;
  }
}