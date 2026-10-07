import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { Supabase } from '../../services/supabase';
import { ProductosService } from '../../services/producto.service';
import { CuponesService } from '../../services/cupones.service';
import { PdfService } from '../../services/pdf.service';

interface Funcion {
  id: number;
  pelicula_id: string;
  sala_id: number;
  fecha: string;
  hora_de_inicio: string;
  formato: string;
  idioma: string;
  precio_base: number;
}

interface Pelicula {
  id: string;
  nombre: string;
  imagen: string;
}

interface Butaca {
  id: number;
  sala_id: number;
  fila: string;
  numero: number;
  tipo: string;
}

interface ProductoResumen {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface EntradaCreada {
  id: number;
  codigo_qr: string;
  precio: number;
  fila: string;
  numero: number;
  tipo: string;
}

interface Recompensa {
  id: number;
  nombre: string;
  descripcion: string;
  costo_puntos: number;
  tipo: string;
  estado: boolean;
  imagen: string | null;
  combo_id: number | null;
  porcentaje_descuento: number | null;
}

interface CanjeDescuento {
  id: number;
  recompensa_id: number;
  puntos_utilizados: number;
  estado: string;
  recompensas: Recompensa | null;
}

@Component({
  selector: 'app-resumen-compra',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resumen-compra.html',
  styleUrl: './resumen-compra.css'
})
export class ResumenCompra implements OnInit {

  funcion = signal<Funcion | null>(null);

  pelicula = signal<Pelicula | null>(null);

  cupones = signal<any[]>([]);

  butacas = signal<Butaca[]>([]);

  productos = signal<ProductoResumen[]>([]);

  cantidadMenores = signal(0);

  cantidadAdultos = signal(0);

  cantidadMayores = signal(0);

  procesandoCompra = signal(false);

  entradasCreadas =
    signal<EntradaCreada[]>([]);

  recompensaDescuento =
    signal<CanjeDescuento | null>(null);

  porcentajeDescuento = computed(() =>
    this.recompensaDescuento()
      ?.recompensas
      ?.porcentaje_descuento ?? 0
  );

  cuponMenor = computed(() =>
    this.cupones().find(
      cupon => cupon.codigo === 'MENOR'
    )
  );

  cuponMayor = computed(() =>
    this.cupones().find(
      cupon => cupon.codigo === 'MAYOR'
    )
  );

  precioMenor = computed(() => {

    const precio =
      this.funcion()?.precio_base ?? 0;

    const descuento =
      this.cuponMenor()
        ?.porcentaje_descuento ?? 0;

    return precio * (1 - descuento / 100);
  });

  precioAdulto = computed(() =>
    this.funcion()?.precio_base ?? 0
  );

  precioMayor = computed(() => {

    const precio =
      this.funcion()?.precio_base ?? 0;

    const descuento =
      this.cuponMayor()
        ?.porcentaje_descuento ?? 0;

    return precio * (1 - descuento / 100);
  });

  totalProductos = computed(() =>
    this.productos().reduce(
      (total, producto) =>
        total +
        producto.precio *
        producto.cantidad,
      0
    )
  );

  cantidadEntradas = computed(() =>
    this.butacas().length
  );

  totalEntradas = computed(() =>
    this.cantidadMenores() *
      this.precioMenor() +

    this.cantidadAdultos() *
      this.precioAdulto() +

    this.cantidadMayores() *
      this.precioMayor()
  );

  subtotalCompra = computed(() =>
    this.totalEntradas() +
    this.totalProductos()
  );

  montoDescuento = computed(() =>
    this.subtotalCompra() *
    this.porcentajeDescuento() /
    100
  );

  totalCompra = computed(() =>
    this.subtotalCompra() -
    this.montoDescuento()
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: Supabase,
    private productosService: ProductosService,
    private cuponesService: CuponesService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.cargarDatosCompra();
    this.cargarFuncion();
    this.cargarCupones();
    this.cargarProductos();
    this.cargarRecompensaDescuento();
  }

  cargarDatosCompra(): void {

    const params =
      this.route.snapshot.queryParams;

    this.cantidadMenores.set(
      Number(params['menores']) || 0
    );

    this.cantidadAdultos.set(
      Number(params['adultos']) || 0
    );

    this.cantidadMayores.set(
      Number(params['mayores']) || 0
    );

    const butacasIds =
      params['butacas']
        ? params['butacas']
            .split(',')
            .map(Number)
        : [];

    this.cargarButacas(butacasIds);
  }

  async cargarButacas(
    ids: number[]
  ): Promise<void> {

    if (ids.length === 0) {
      return;
    }

    const {
      data,
      error
    } = await this.supabaseService
      .getClient()
      .from('butacas')
      .select(
        'id, sala_id, fila, numero, tipo'
      )
      .in('id', ids);

    if (error) {

      console.error(
        'Error al cargar las butacas:',
        error
      );

      return;
    }

    this.butacas.set(data ?? []);
  }

  async cargarFuncion(): Promise<void> {

    const funcionId =
      Number(
        this.route.snapshot
          .queryParamMap
          .get('funcion')
      );

    if (!funcionId) {
      return;
    }

    const {
      data,
      error
    } = await this.supabaseService
      .getClient()
      .from('funciones')
      .select('*')
      .eq('id', funcionId)
      .single();

    if (error) {

      console.error(
        'Error al cargar la función:',
        error
      );

      return;
    }

    this.funcion.set(data);

    const {
      data: pelicula,
      error: errorPelicula
    } = await this.supabaseService
      .getClient()
      .from('peliculas')
      .select(
        'id, nombre, imagen'
      )
      .eq(
        'id',
        data.pelicula_id
      )
      .single();

    if (errorPelicula) {

      console.error(
        'Error al cargar la película:',
        errorPelicula
      );

      return;
    }

    this.pelicula.set(pelicula);
  }

  async cargarCupones(): Promise<void> {

    const cupones =
      await this.cuponesService
        .obtenerCupones();

    this.cupones.set(cupones);
  }

  async cargarProductos(): Promise<void> {

    const productosParam =
      this.route.snapshot
        .queryParamMap
        .get('productos');

    if (!productosParam) {
      return;
    }

    const productos =
      await this.productosService
        .obtenerProductos();

    const resumen:
      ProductoResumen[] = [];

    productosParam
      .split(',')
      .forEach(item => {

        const [
          id,
          cantidad
        ] = item.split(':');

        const producto =
          productos.find(
            p => p.id === Number(id)
          );

        if (!producto) {
          return;
        }

        resumen.push({
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: Number(cantidad)
        });
      });

    this.productos.set(resumen);
  }

  async cargarRecompensaDescuento(): Promise<void> {

    const {
      data: authData,
      error: authError
    } = await this.supabaseService
      .getClient()
      .auth
      .getUser();

    if (
      authError ||
      !authData.user
    ) {
      return;
    }

    const usuarioId =
      authData.user.id;

    const {
      data,
      error
    } = await this.supabaseService
      .getClient()
      .from('canjes')
      .select(`
        id,
        recompensa_id,
        puntos_utilizados,
        estado,
        recompensas (
          id,
          nombre,
          descripcion,
          costo_puntos,
          tipo,
          estado,
          imagen,
          combo_id,
          porcentaje_descuento
        )
      `)
      .eq(
        'usuario_id',
        usuarioId
      )
      .eq(
        'estado',
        'DISPONIBLE'
      );

    if (error) {

      console.error(
        'Error al cargar recompensa:',
        error
      );

      return;
    }

    const canjes =
      (data ?? []) as unknown as CanjeDescuento[];

    const canjeDescuento =
      canjes.find(
        canje =>
          canje.recompensas?.tipo ===
          'DESCUENTO'
      );

    if (!canjeDescuento) {
      return;
    }

    this.recompensaDescuento.set(
      canjeDescuento
    );
  }

  async continuarAlPago(): Promise<void> {

    if (this.procesandoCompra()) {
      return;
    }

    const funcion =
      this.funcion();

    if (
      !funcion ||
      this.butacas().length === 0
    ) {
      return;
    }

    this.procesandoCompra.set(true);

    try {

      const {
        data: {
          user
        },
        error: errorUsuario
      } = await this.supabaseService
        .getClient()
        .auth
        .getUser();

      if (
        errorUsuario ||
        !user
      ) {

        alert(
          'Tenés que iniciar sesión para realizar la compra.'
        );

        return;
      }

      const {
        data: compra,
        error: errorCompra
      } = await this.supabaseService
        .getClient()
        .from('compras')
        .insert({
          usuario_id: user.id,
          total: this.totalCompra(),
          estado: 'PAGADA',
          metodo_de_pago: 'TARJETA'
        })
        .select()
        .single();

      if (
        errorCompra ||
        !compra
      ) {

        console.error(
          'Error al crear la compra:',
          errorCompra
        );

        alert(
          'No se pudo crear la compra.'
        );

        return;
      }

      const entradas =
        this.butacas().map(
          (butaca, index) => ({
            compra_id: compra.id,
            funcion_id: funcion.id,
            butaca_id: butaca.id,
            codigo_qr:
              crypto.randomUUID(),
            precio:
              this.obtenerPrecioEntrada(index),
            estado: 'ACTIVA'
          })
        );

      const {
        data: entradasCreadas,
        error: errorEntradas
      } = await this.supabaseService
        .getClient()
        .from('entradas')
        .insert(entradas)
        .select(
          'id, codigo_qr, precio, butaca_id'
        );

      if (errorEntradas) {

        console.error(
          'Error al crear las entradas:',
          errorEntradas
        );

        alert(
          'La compra fue creada, pero no se pudieron crear las entradas.'
        );

        return;
      }

      const entradasConDatos:
        EntradaCreada[] =
        (entradasCreadas ?? [])
          .map(entrada => {

            const butaca =
              this.butacas().find(
                item =>
                  item.id ===
                  entrada.butaca_id
              );

            return {
              id: entrada.id,
              codigo_qr:
                entrada.codigo_qr,
              precio:
                entrada.precio,
              fila:
                butaca?.fila ?? '',
              numero:
                butaca?.numero ?? 0,
              tipo:
                butaca?.tipo ?? ''
            };
          });

      this.entradasCreadas.set(
        entradasConDatos
      );

      const puntosGanados =
        Math.floor(
          this.totalCompra()
        );

      const {
        error: errorPuntos
      } = await this.supabaseService
        .getClient()
        .from('movimientos_puntos')
        .insert({
          usuario_id: user.id,
          cantidad: puntosGanados,
          tipo: 'GANADO',
          descripcion:
            'Puntos obtenidos por compra',
          fecha:
            new Date().toISOString()
        });

      if (errorPuntos) {

        console.error(
          'Error al registrar los puntos:',
          errorPuntos
        );
      }

      const canje =
        this.recompensaDescuento();

      if (canje) {

        const {
          error: errorActualizarCanje
        } = await this.supabaseService
          .getClient()
          .from('canjes')
          .update({
            estado: 'USADO'
          })
          .eq(
            'id',
            canje.id
          );

        if (errorActualizarCanje) {

          console.error(
            'Error al marcar el canje como usado:',
            errorActualizarCanje
          );
        }
      }

      alert(
        'Compra realizada correctamente.'
      );

    } finally {

      this.procesandoCompra.set(false);
    }
  }

  obtenerPrecioEntrada(
    index: number
  ): number {

    let precio: number;

    if (
      index <
      this.cantidadMenores()
    ) {

      precio =
        this.precioMenor();

    } else if (
      index <
      this.cantidadMenores() +
      this.cantidadAdultos()
    ) {

      precio =
        this.precioAdulto();

    } else {

      precio =
        this.precioMayor();
    }

    return precio *
      (1 - this.porcentajeDescuento() / 100);
  }

  async descargarPdf(): Promise<void> {

    const pelicula =
      this.pelicula();

    const funcion =
      this.funcion();

    if (
      !pelicula ||
      !funcion ||
      this.entradasCreadas()
        .length === 0
    ) {
      return;
    }

    await this.pdfService
      .generarEntradasPdf(
        pelicula.nombre,
        funcion.fecha,
        funcion.hora_de_inicio,
        String(funcion.sala_id),
        funcion.formato,
        funcion.idioma,
        this.entradasCreadas()
      );
  }

  volver(): void {

    const funcion =
      this.funcion();

    this.router.navigate(
      ['/candy-bar'],
      {
        queryParams: {
          funcion:
            funcion?.id,
          butacas:
            this.butacas()
              .map(
                butaca =>
                  butaca.id
              )
              .join(','),
          menores:
            this.cantidadMenores(),
          adultos:
            this.cantidadAdultos(),
          mayores:
            this.cantidadMayores()
        }
      }
    );
  }
}