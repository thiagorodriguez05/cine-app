import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { Supabase } from '../../services/supabase';
import { FuncionesService } from '../../services/funciones.service';

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

interface Butaca {
  id: number;
  sala_id: number;
  fila: string;
  numero: number;
  tipo: string;
}

@Component({
  selector: 'app-butacas',
  imports: [
    CommonModule
  ],
  templateUrl: './butacas.html',
  styleUrl: './butacas.css'
})
export class Butacas implements OnInit {

  funcion = signal<Funcion | null>(null);

  butacas = signal<Butaca[]>([]);

  // NUEVO
  butacasOcupadas = signal<number[]>([]);

  cantidadEntradas = signal(0);

  cantidadMenores = signal(0);
  cantidadAdultos = signal(0);
  cantidadMayores = signal(0);

  butacasSeleccionadas = signal<number[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: Supabase,
    private funcionesService: FuncionesService
  ) {}

  ngOnInit() {
    this.cargarDatosCompra();
    this.cargarFuncion();
  }

  cargarDatosCompra() {

    const cantidad =
      this.route.snapshot.queryParamMap.get('cantidad');

    const menores =
      this.route.snapshot.queryParamMap.get('menores');

    const adultos =
      this.route.snapshot.queryParamMap.get('adultos');

    const mayores =
      this.route.snapshot.queryParamMap.get('mayores');

    const cantidadNumerica = Number(cantidad);

    if (
      Number.isInteger(cantidadNumerica) &&
      cantidadNumerica > 0
    ) {
      this.cantidadEntradas.set(
        cantidadNumerica
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

    // Cargar butacas de la sala
    await this.cargarButacas(
      funcion.sala_id
    );

    // Cargar butacas ocupadas para ESTA función
    await this.cargarButacasOcupadas(
      funcion.id
    );
  }

  async cargarButacas(salaId: number) {

    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('butacas')
        .select('*')
        .eq('sala_id', salaId)
        .order('fila')
        .order('numero');

    if (error) {

      console.error(
        'Error al cargar butacas:',
        error
      );

      return;
    }

    this.butacas.set(data ?? []);
  }

  // NUEVO
  async cargarButacasOcupadas(funcionId: number) {

    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('entradas')
        .select('butaca_id')
        .eq('funcion_id', funcionId);

    if (error) {

      console.error(
        'Error al cargar butacas ocupadas:',
        error
      );

      return;
    }

    const idsOcupados =
      (data ?? []).map(
        entrada => entrada.butaca_id
      );

    this.butacasOcupadas.set(
      idsOcupados
    );
  }

  // NUEVO
  estaOcupada(butacaId: number): boolean {

    return this.butacasOcupadas()
      .includes(butacaId);
  }

  seleccionarButaca(butacaId: number) {

    // NO permitir seleccionar una butaca ocupada
    if (this.estaOcupada(butacaId)) {
      return;
    }

    const seleccionadas =
      this.butacasSeleccionadas();

    if (seleccionadas.includes(butacaId)) {

      this.butacasSeleccionadas.set(
        seleccionadas.filter(
          id => id !== butacaId
        )
      );

      return;
    }

    if (
      seleccionadas.length >=
      this.cantidadEntradas()
    ) {
      return;
    }

    this.butacasSeleccionadas.set([
      ...seleccionadas,
      butacaId
    ]);
  }

  estaSeleccionada(
    butacaId: number
  ): boolean {

    return this.butacasSeleccionadas()
      .includes(butacaId);
  }

  continuar() {

    if (
      this.butacasSeleccionadas().length !==
      this.cantidadEntradas()
    ) {
      return;
    }

    const funcion = this.funcion();

    if (!funcion) {
      return;
    }

    this.router.navigate(
      ['/candy-bar'],
      {
        queryParams: {
          funcion: funcion.id,
          butacas:
            this.butacasSeleccionadas().join(','),
          menores: this.cantidadMenores(),
          adultos: this.cantidadAdultos(),
          mayores: this.cantidadMayores()
        }
      }
    );
  }
}