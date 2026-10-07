import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  ProductosService,
  Producto
} from '../../../../services/producto.service';

import { ProductosForm } from './productos-form/productos-form';

@Component({
  selector: 'app-productos',
  imports: [CommonModule, ProductosForm],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos implements OnInit {

  productos = signal<Producto[]>([]);
  categorias: any[] = [];

  mostrarFormulario = false;
  editando = false;
  productoSeleccionado: Producto | null = null;

  constructor(
    private productosService: ProductosService
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    const productos =
      await this.productosService.obtenerProductos();

    const categorias =
      await this.productosService.obtenerCategorias();

    this.productos.set(productos);
    this.categorias = categorias;
  }

  abrirFormulario() {
    this.editando = false;
    this.productoSeleccionado = null;
    this.mostrarFormulario = true;
  }

  editarProducto(producto: Producto) {
    this.editando = true;
    this.productoSeleccionado = producto;
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.editando = false;
    this.productoSeleccionado = null;
  }

  async guardarProducto(datos: any) {

    let resultado = false;

    if (this.editando && this.productoSeleccionado) {

      resultado =
        await this.productosService.actualizarProducto(
          this.productoSeleccionado.id,
          datos
        );

    } else {

      resultado =
        await this.productosService.crearProducto(datos);
    }

    if (!resultado) {
      alert('No se pudo guardar el producto. Revisá la consola.');
      return;
    }

    this.cerrarFormulario();
    await this.cargarDatos();
  }

  async desactivarProducto(producto: Producto) {

    const confirmar = confirm(
      `¿Querés desactivar el producto "${producto.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    const resultado =
      await this.productosService.desactivarProducto(
        producto.id
      );

    if (resultado) {
      await this.cargarDatos();
    }
  }

  obtenerNombreCategoria(categoriaId: number): string {

    const categoria = this.categorias.find(
      categoria => categoria.id === categoriaId
    );

    return categoria?.nombre ?? 'Sin categoría';
  }
}