import { Injectable } from '@angular/core';
import { Supabase } from './supabase';

export interface Combo {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  estado: boolean;
}

export interface ComboProducto {
  combo_id: number;
  producto_id: number;
  cantidad: number;
}

@Injectable({   
  providedIn: 'root'
})
export class ComboService {

  constructor(
    private supabaseService: Supabase
  ) {}

  // =========================
  // OBTENER COMBOS
  // =========================

  async obtenerCombos(): Promise<Combo[]> {

    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('combos')
        .select('*')
        .order('nombre');

    if (error) {

      console.error(
        'Error al cargar combos:',
        error
      );

      return [];
    }

    return data ?? [];
  }


  // =========================
  // OBTENER PRODUCTOS DEL COMBO
  // =========================

  async obtenerProductosDeCombo(
    comboId: number
  ): Promise<ComboProducto[]> {

    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('combo_productos')
        .select('*')
        .eq('combo_id', comboId);

    if (error) {

      console.error(
        'Error al cargar productos del combo:',
        error
      );

      return [];
    }

    return data ?? [];
  }


  // =========================
  // SUBIR IMAGEN
  // =========================

  async subirImagen(
    archivo: File
  ): Promise<string | null> {

    const extension =
      archivo.name.split('.').pop();

    const nombreArchivo =
      `${crypto.randomUUID()}.${extension}`;

    const { error } =
      await this.supabaseService
        .getClient()
        .storage
        .from('combos')
        .upload(
          nombreArchivo,
          archivo
        );

    if (error) {

      console.error(
        'Error al subir imagen del combo:',
        error
      );

      return null;
    }

    const { data } =
      this.supabaseService
        .getClient()
        .storage
        .from('combos')
        .getPublicUrl(
          nombreArchivo
        );

    return data.publicUrl;
  }


  // =========================
  // CREAR COMBO
  // =========================

  async crearCombo(
    combo: {
      nombre: string;
      descripcion: string;
      precio: number;
      imagen?: File | null;
    },
    productos: ComboProducto[]
  ): Promise<boolean> {

    // URL de la imagen
    let imagenUrl: string | null = null;


    // Si se seleccionó una imagen,
    // primero la subimos a Storage
    if (combo.imagen) {

      imagenUrl =
        await this.subirImagen(
          combo.imagen
        );

      if (!imagenUrl) {
        return false;
      }
    }


    // Crear el combo
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('combos')
        .insert({
          nombre: combo.nombre,
          descripcion: combo.descripcion,
          precio: combo.precio,
          imagen: imagenUrl,
          estado: true
        })
        .select()
        .single();


    if (error) {

      console.error(
        'Error al crear combo:',
        error
      );

      return false;
    }


    // Crear relaciones con productos
    const relaciones =
      productos.map(producto => ({

        combo_id: data.id,

        producto_id:
          producto.producto_id,

        cantidad:
          producto.cantidad

      }));


    if (relaciones.length > 0) {

      const { error: errorProductos } =
        await this.supabaseService
          .getClient()
          .from('combo_productos')
          .insert(relaciones);


      if (errorProductos) {

        console.error(
          'Error al guardar productos del combo:',
          errorProductos
        );

        return false;
      }
    }

    return true;
  }

// =========================
// ACTUALIZAR COMBO
// =========================

async actualizarCombo(
  comboId: number,
  combo: {
    nombre: string;
    descripcion: string;
    precio: number;
    imagen?: File | null;
  },
  productos: ComboProducto[]
): Promise<boolean> {

  // URL de la nueva imagen
  let imagenUrl: string | null = null;


  // Si se seleccionó una nueva imagen,
  // la subimos a Storage
  if (combo.imagen) {

    imagenUrl =
      await this.subirImagen(
        combo.imagen
      );

    if (!imagenUrl) {
      return false;
    }
  }


  // Datos que vamos a actualizar
  const datosActualizar: any = {

    nombre: combo.nombre,

    descripcion: combo.descripcion,

    precio: combo.precio

  };


  // Si se seleccionó una nueva imagen,
  // actualizamos también la URL
  if (imagenUrl) {

    datosActualizar.imagen =
      imagenUrl;
  }


  // Actualizar el combo
  const { error: errorCombo } =
    await this.supabaseService
      .getClient()
      .from('combos')
      .update(datosActualizar)
      .eq('id', comboId);


  if (errorCombo) {

    console.error(
      'Error al actualizar combo:',
      errorCombo
    );

    return false;
  }


  // Eliminar los productos anteriores
  const { error: errorEliminar } =
    await this.supabaseService
      .getClient()
      .from('combo_productos')
      .delete()
      .eq('combo_id', comboId);


  if (errorEliminar) {

    console.error(
      'Error al eliminar productos del combo:',
      errorEliminar
    );

    return false;
  }


  // Crear las nuevas relaciones
  const relaciones =
    productos.map(producto => ({

      combo_id: comboId,

      producto_id:
        producto.producto_id,

      cantidad:
        producto.cantidad

    }));


  // Insertar las relaciones
  if (relaciones.length > 0) {

    const { error: errorInsertar } =
      await this.supabaseService
        .getClient()
        .from('combo_productos')
        .insert(relaciones);


    if (errorInsertar) {

      console.error(
        'Error al guardar productos del combo:',
        errorInsertar
      );

      return false;
    }
  }


  return true;
}       

  // =========================
  // DESACTIVAR COMBO
  // =========================

  async desactivarCombo(
    comboId: number
  ): Promise<boolean> {

    const { error } =
      await this.supabaseService
        .getClient()
        .from('combos')
        .update({
          estado: false
        })
        .eq('id', comboId);


    if (error) {

      console.error(
        'Error al desactivar combo:',
        error
      );

      return false;
    }

    return true;
  }

}