import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { Supabase } from '../../services/supabase';
import { FuncionesService } from '../../services/funciones.service';

import {
  Cupon,
  CuponesService
} from '../../services/cupones.service';

interface Funcion {
  id: number;
  pelicula_id: string;
  sala_id: number;
  fecha: string;
  hora_de_inicio: string;
  hora_de_fin: string;
  formato: string;
  idioma: string;
  precio_base: number;
}

interface Pelicula {
  id: string;
  nombre: string;
  imagen: string;
}

@Component({
  selector: 'app-compra',
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './compra.html',
  styleUrl: './compra.css'
})
export class Compra implements OnInit {

  funcion = signal<Funcion | null>(null);
  pelicula = signal<Pelicula | null>(null);
  cupones = signal<Cupon[]>([]);

  cantidadMenores = signal(0);
  cantidadAdultos = signal(0);
  cantidadMayores = signal(0);

  cuponMenor = computed(() => {
    return this.cupones().find(
      cupon => cupon.codigo === 'MENOR'
    );
  });

  cuponMayor = computed(() => {
    return this.cupones().find(
      cupon => cupon.codigo === 'MAYOR'
    );
  });

  precioMenor = computed(() => {
    const precio =
      this.funcion()?.precio_base ?? 0;

    const cupon = this.cuponMenor();

    if (!cupon) {
      return precio;
    }

    return precio * (
      1 - cupon.porcentaje_descuento / 100
    );
  });

  precioAdulto = computed(() => {
    return this.funcion()?.precio_base ?? 0;
  });

  precioMayor = computed(() => {
    const precio =
      this.funcion()?.precio_base ?? 0;

    const cupon = this.cuponMayor();

    if (!cupon) {
      return precio;
    }

    return precio * (
      1 - cupon.porcentaje_descuento / 100
    );
  });

  totalEntradas = computed(() => {
    return (
      this.cantidadMenores() +
      this.cantidadAdultos() +
      this.cantidadMayores()
    );
  });

  total = computed(() => {
    return (
      this.cantidadMenores() *
      this.precioMenor() +

      this.cantidadAdultos() *
      this.precioAdulto() +

      this.cantidadMayores() *
      this.precioMayor()
    );
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionesService: FuncionesService,
    private supabaseService: Supabase,
    private cuponesService: CuponesService
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  async cargarDatos() {
    await Promise.all([
      this.cargarFuncion(),
      this.cargarCupones()
    ]);
  }

  async cargarFuncion() {
    const id =
      this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    const funciones =
      await this.funcionesService
        .obtenerFunciones();

    const funcion =
      funciones.find(
        funcion =>
          funcion.id === Number(id)
      );

    if (!funcion) {
      return;
    }

    this.funcion.set(funcion);

    await this.cargarPelicula(
      funcion.pelicula_id
    );
  }

  async cargarPelicula(
    peliculaId: string
  ) {
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('peliculas')
        .select('id, nombre, imagen')
        .eq('id', peliculaId)
        .single();

    if (error) {
      console.error(
        'Error al cargar la película:',
        error
      );

      return;
    }

    this.pelicula.set(data);
  }

  async cargarCupones() {
    const cupones =
      await this.cuponesService
        .obtenerCupones();

    this.cupones.set(cupones);
  }

  aumentarMenores() {
    this.cantidadMenores.update(
      cantidad => cantidad + 1
    );
  }

  disminuirMenores() {
    this.cantidadMenores.update(
      cantidad => Math.max(0, cantidad - 1)
    );
  }

  aumentarAdultos() {
    this.cantidadAdultos.update(
      cantidad => cantidad + 1
    );
  }

  disminuirAdultos() {
    this.cantidadAdultos.update(
      cantidad => Math.max(0, cantidad - 1)
    );
  }

  aumentarMayores() {
    this.cantidadMayores.update(
      cantidad => cantidad + 1
    );
  }

  disminuirMayores() {
    this.cantidadMayores.update(
      cantidad => Math.max(0, cantidad - 1)
    );
  }

  continuar() {
    const funcion = this.funcion();

    if (
      !funcion ||
      this.totalEntradas() === 0
    ) {
      return;
    }

    this.router.navigate(
      [
        '/compra',
        funcion.id,
        'butacas'
      ],
      {
        queryParams: {
          cantidad: this.totalEntradas(),
          menores: this.cantidadMenores(),
          adultos: this.cantidadAdultos(),
          mayores: this.cantidadMayores()
        }
      }
    );
  }
}