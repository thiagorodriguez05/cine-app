import { Injectable } from '@angular/core';
import { Supabase } from './supabase';

export interface Producto {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string | null;
  estado: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  constructor(
    private supabaseService: Supabase
  ) {}

  async obtenerProductos(): Promise<Producto[]> {
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('productos')
        .select('*')
        .order('nombre');

    if (error) {
      console.error('Error al cargar productos:', error);
      return [];
    }

    return data ?? [];
  }

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
async subirImagen(archivo: File): Promise<string | null> {

  const extension = archivo.name.split('.').pop() || 'png';

  const nombreArchivo =
    `${Date.now()}.${extension}`;

  const { error } =
    await this.supabaseService
      .getClient()
      .storage
      .from('productos')
      .upload(nombreArchivo, archivo, {
        contentType: archivo.type,
        upsert: false
      });

  if (error) {
    console.error('Error al subir imagen:', error);
    console.error('Código:', error.statusCode);
    console.error('Mensaje:', error.message);

    return null;
  }

  const { data } =
    this.supabaseService
      .getClient()
      .storage
      .from('productos')
      .getPublicUrl(nombreArchivo);

  return data.publicUrl;
}

  async crearProducto(producto: {
    categoria_id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    imagen: File | null;
  }): Promise<boolean> {

    let imagenUrl: string | null = null;

    if (producto.imagen) {
      imagenUrl = await this.subirImagen(producto.imagen);

      if (!imagenUrl) {
        console.error('No se pudo obtener la URL de la imagen.');
        return false;
      }
    }

    const { error } =
      await this.supabaseService
        .getClient()
        .from('productos')
        .insert({
          categoria_id: producto.categoria_id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          stock: producto.stock,
          imagen: imagenUrl,
          estado: true
        });

    if (error) {
      console.error('Error al crear producto:', error);
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      console.error('Hint:', error.hint);

      return false;
    }

    return true;
  }

  async actualizarProducto(
    id: number,
    producto: {
      categoria_id: number;
      nombre: string;
      descripcion: string;
      precio: number;
      stock: number;
      imagen: File | null;
    }
  ): Promise<boolean> {

    let imagenUrl: string | null = null;

    if (producto.imagen) {
      imagenUrl = await this.subirImagen(producto.imagen);

      if (!imagenUrl) {
        return false;
      }
    }

    const datosActualizar: {
      categoria_id: number;
      nombre: string;
      descripcion: string;
      precio: number;
      stock: number;
      imagen?: string;
    } = {
      categoria_id: producto.categoria_id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock
    };

    if (imagenUrl) {
      datosActualizar.imagen = imagenUrl;
    }

    const { error } =
      await this.supabaseService
        .getClient()
        .from('productos')
        .update(datosActualizar)
        .eq('id', id);

    if (error) {
      console.error('Error al actualizar producto:', error);
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      console.error('Hint:', error.hint);

      return false;
    }

    return true;
  }

  async desactivarProducto(id: number): Promise<boolean> {
    const { error } =
      await this.supabaseService
        .getClient()
        .from('productos')
        .update({
          estado: false
        })
        .eq('id', id);

    if (error) {
      console.error('Error al desactivar producto:', error);
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      console.error('Hint:', error.hint);

      return false;
    }

    return true;
  }
}