import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ComboService,
  Combo
} from '../../../../services/combo.service';

import {
  ProductosService,
  Producto
} from '../../../../services/producto.service';

@Component({
  selector: 'app-combos',
  imports: [CommonModule, FormsModule],
  templateUrl: './combos.html',
  styleUrl: './combos.css'
})
export class Combos implements OnInit {

  combos = signal<Combo[]>([]);
  productos = signal<Producto[]>([]);

  mostrarFormulario = false;

  cantidades: { [productoId: number]: number } = {};

  nombreCombo = '';
  descripcionCombo = '';

  // Imagen seleccionada
  imagenCombo: File | null = null;

  descuentoCombo = 10;

  constructor(
    private comboService: ComboService,
    private productosService: ProductosService
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {

    const combos =
      await this.comboService.obtenerCombos();

    const productos =
      await this.productosService.obtenerProductos();

    this.combos.set(combos);
    this.productos.set(productos);
  }

  abrirFormulario() {

    this.mostrarFormulario = true;

    this.cantidades = {};

    this.nombreCombo = '';
    this.descripcionCombo = '';

    this.imagenCombo = null;
  }

  cerrarFormulario() {

    this.mostrarFormulario = false;
  }

  // =========================
  // SELECCIONAR IMAGEN
  // =========================

  seleccionarImagen(event: Event) {

    const input =
      event.target as HTMLInputElement;

    if (
      input.files &&
      input.files.length > 0
    ) {

      this.imagenCombo =
        input.files[0];
    }
  }

  // =========================
  // CALCULAR SUBTOTAL
  // =========================

  calcularSubtotal(): number {

    return this.productos().reduce(
      (total, producto) => {

        const cantidad =
          this.cantidades[producto.id] || 0;

        return total +
          producto.precio * cantidad;
      },
      0
    );
  }

  // =========================
  // CALCULAR PRECIO COMBO
  // =========================

  calcularPrecioCombo(): number {

    const subtotal =
      this.calcularSubtotal();

    const descuento =
      subtotal *
      this.descuentoCombo /
      100;

    return subtotal - descuento;
  }

  // =========================
  // GUARDAR COMBO
  // =========================

  async guardarCombo() {

    // Verificar nombre
    if (!this.nombreCombo.trim()) {

      alert(
        'Ingresá un nombre para el combo'
      );

      return;
    }


    // Obtener productos seleccionados
    const productosSeleccionados =
      this.productos()
        .filter(producto => {

          const cantidad =
            this.cantidades[producto.id] || 0;

          return cantidad > 0;
        })
        .map(producto => ({

          combo_id: 0,

          producto_id:
            producto.id,

          cantidad:
            this.cantidades[producto.id]

        }));


    // Verificar productos
    if (
      productosSeleccionados.length === 0
    ) {

      alert(
        'Seleccioná al menos un producto'
      );

      return;
    }


    // Calcular precio
    const precio =
      this.calcularPrecioCombo();


    // Crear combo
    const resultado =
      await this.comboService.crearCombo(
        {

          nombre:
            this.nombreCombo.trim(),

          descripcion:
            this.descripcionCombo.trim(),

          precio:
            precio,

          imagen:
            this.imagenCombo

        },

        productosSeleccionados
      );


    // Error
    if (!resultado) {

      alert(
        'No se pudo crear el combo'
      );

      return;
    }


    // Éxito
    alert(
      'Combo creado correctamente'
    );


    // Limpiar formulario
    this.nombreCombo = '';

    this.descripcionCombo = '';

    this.cantidades = {};

    this.imagenCombo = null;


    // Cerrar formulario
    this.cerrarFormulario();


    // Recargar datos
    await this.cargarDatos();
  }


  // =========================
  // DESACTIVAR COMBO
  // =========================

  async desactivarCombo(
    combo: Combo
  ) {

    const confirmar =
      confirm(
        `¿Querés desactivar el combo "${combo.nombre}"?`
      );


    if (!confirmar) {
      return;
    }


    const resultado =
      await this.comboService
        .desactivarCombo(
          combo.id
        );


    if (resultado) {

      await this.cargarDatos();
    }
  }

}