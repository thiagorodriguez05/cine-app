import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  Categoria,
  Producto,
  ProductosService
} from '../../services/producto.service';

interface ProductoPedido {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-candy-bar',
  imports: [
    CommonModule
  ],
  templateUrl: './candy-bar.html',
  styleUrl: './candy-bar.css'
})
export class CandyBar implements OnInit {

  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);

  categoriaSeleccionada =
    signal<number | null>(null);

  pedido = signal<ProductoPedido[]>([]);

  funcionId = signal<number | null>(null);
  butacasSeleccionadas = signal<number[]>([]);

  cantidadMenores = signal(0);
  cantidadAdultos = signal(0);
  cantidadMayores = signal(0);

  productosFiltrados = computed(() => {
    const categoriaId =
      this.categoriaSeleccionada();

    if (categoriaId === null) {
      return this.productos();
    }

    return this.productos().filter(
      producto =>
        producto.categoria_id === categoriaId
    );
  });

  cantidadPedido = computed(() => {
    return this.pedido().reduce(
      (total, item) =>
        total + item.cantidad,
      0
    );
  });

  totalPedido = computed(() => {
    return this.pedido().reduce(
      (total, item) =>
        total +
        item.producto.precio * item.cantidad,
      0
    );
  });

  constructor(
    private productosService: ProductosService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarDatos();
    this.cargarDatosCompra();
  }

  cargarDatosCompra() {
    const funcion =
      this.route.snapshot.queryParamMap.get('funcion');

    const butacas =
      this.route.snapshot.queryParamMap.get('butacas');

    const menores =
      this.route.snapshot.queryParamMap.get('menores');

    const adultos =
      this.route.snapshot.queryParamMap.get('adultos');

    const mayores =
      this.route.snapshot.queryParamMap.get('mayores');

    if (funcion) {
      this.funcionId.set(
        Number(funcion)
      );
    }

    if (butacas) {
      this.butacasSeleccionadas.set(
        butacas
          .split(',')
          .map(id => Number(id))
      );
    }

    this.cantidadMenores.set(
      Number(menores) || 0
    );

    this.cantidadAdultos.set(
      Number(adultos) || 0
    );

    this.cantidadMayores.set(
      Number(mayores) || 0
    );
  }

  async cargarDatos() {
    const [
      productos,
      categorias
    ] = await Promise.all([
      this.productosService.obtenerProductos(),
      this.productosService.obtenerCategorias()
    ]);

    this.productos.set(
      productos.filter(
        producto =>
          producto.estado &&
          producto.stock > 0
      )
    );

    this.categorias.set(
      categorias
    );
  }

  seleccionarCategoria(
    categoriaId: number | null
  ) {
    this.categoriaSeleccionada.set(
      categoriaId
    );
  }

  agregarProducto(producto: Producto) {
    const pedidoActual =
      this.pedido();

    const productoExistente =
      pedidoActual.find(
        item =>
          item.producto.id === producto.id
      );

    if (productoExistente) {
      this.pedido.set(
        pedidoActual.map(item =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1
              }
            : item
        )
      );

      return;
    }

    this.pedido.set([
      ...pedidoActual,
      {
        producto,
        cantidad: 1
      }
    ]);
  }

  continuar() {
    const funcion =
      this.funcionId();

    const butacas =
      this.butacasSeleccionadas();

    if (
      !funcion ||
      butacas.length === 0
    ) {
      return;
    }

    const productos =
      this.pedido()
        .map(item =>
          `${item.producto.id}:${item.cantidad}`
        )
        .join(',');

    this.router.navigate(
      ['/resumen-compra'],
      {
        queryParams: {
          funcion,
          butacas: butacas.join(','),
          menores: this.cantidadMenores(),
          adultos: this.cantidadAdultos(),
          mayores: this.cantidadMayores(),
          productos
        }
      }
    );
  }
}