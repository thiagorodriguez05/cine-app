import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-productos-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './productos-form.html',
  styleUrl: './productos-form.css'
})
export class ProductosForm implements OnInit {

  @Input() categorias: any[] = [];

  @Input() producto: any = null;

  @Input() editando = false;

  @Output() guardar = new EventEmitter<any>();

  @Output() cerrar = new EventEmitter<void>();


  // Datos del formulario

  nombre = '';
  descripcion = '';
  categoria_id: number | null = null;
  precio: number | null = null;
  stock: number | null = null;

  // Archivo nuevo seleccionado
  imagen: File | null = null;

  // Imagen que ya tenía el producto
  imagenActual: string | null = null;


  ngOnInit() {

    if (this.producto) {

      this.nombre = this.producto.nombre;
      this.descripcion = this.producto.descripcion;
      this.categoria_id = this.producto.categoria_id;
      this.precio = this.producto.precio;
      this.stock = this.producto.stock;

      this.imagenActual = this.producto.imagen;
    }
  }


  seleccionarImagen(event: Event) {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.imagen = input.files[0];
  }


  guardarProducto() {

    if (
      !this.nombre ||
      !this.descripcion ||
      this.categoria_id === null ||
      this.precio === null ||
      this.stock === null
    ) {

      alert('Completá todos los campos.');

      return;
    }


    this.guardar.emit({

      nombre: this.nombre,

      descripcion: this.descripcion,

      categoria_id: this.categoria_id,

      precio: this.precio,

      stock: this.stock,

      imagen: this.imagen

    });
  }


  cerrarFormulario() {

    this.cerrar.emit();

  }

}