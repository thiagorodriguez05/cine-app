import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Supabase } from '../../services/supabase';

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

interface MovimientoPuntos {
  id: number;
  usuario_id: string;
  cantidad: number;
  tipo: string;
  descripcion: string;
  fecha: string;
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

@Component({
  selector: 'app-mi-cuenta',
  imports: [CommonModule],
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.css'
})
export class MiCuenta implements OnInit {

  usuario =
    signal<Usuario | null>(null);

  movimientos =
    signal<MovimientoPuntos[]>([]);

  recompensas =
    signal<Recompensa[]>([]);

  puntos =
    signal(0);

  canjeando =
    signal(false);

  constructor(
    private supabaseService: Supabase,
    private location: Location
  ) {}

  async ngOnInit() {
    await this.cargarCuenta();
    await this.cargarRecompensas();
  }

  volver() {
    this.location.back();
  }

  async cargarCuenta() {

    const cliente =
      this.supabaseService.getClient();

    const {
      data: authData,
      error: authError
    } = await cliente
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
      data: usuario,
      error: usuarioError
    } = await cliente
      .from('usuarios')
      .select(
        'id, nombre, apellido, email'
      )
      .eq(
        'id',
        usuarioId
      )
      .single();

    if (usuarioError) {

      console.error(
        'Error al cargar usuario:',
        usuarioError
      );

      return;
    }

    this.usuario.set(usuario);

    const {
      data: movimientos,
      error: movimientosError
    } = await cliente
      .from('movimientos_puntos')
      .select('*')
      .eq(
        'usuario_id',
        usuarioId
      )
      .order(
        'fecha',
        {
          ascending: false
        }
      );

    if (movimientosError) {

      console.error(
        'Error al cargar movimientos:',
        movimientosError
      );

      return;
    }

    this.movimientos.set(
      movimientos ?? []
    );

    const total =
      (movimientos ?? []).reduce(
        (suma, movimiento) =>
          suma + movimiento.cantidad,
        0
      );

    this.puntos.set(total);
  }

  async cargarRecompensas() {

    const cliente =
      this.supabaseService.getClient();

    const {
      data,
      error
    } = await cliente
      .from('recompensas')
      .select('*')
      .eq(
        'estado',
        true
      )
      .order(
        'costo_puntos',
        {
          ascending: true
        }
      );

    if (error) {

      console.error(
        'Error al cargar recompensas:',
        error
      );

      return;
    }

    this.recompensas.set(
      data ?? []
    );
  }

  async canjearRecompensa(
    recompensa: Recompensa
  ) {

    if (this.canjeando()) {
      return;
    }

    if (
      this.puntos() <
      recompensa.costo_puntos
    ) {

      alert(
        'No tenés suficientes puntos para canjear esta recompensa.'
      );

      return;
    }

    const confirmar =
      confirm(
        `¿Querés canjear "${recompensa.nombre}" por ${recompensa.costo_puntos} puntos?`
      );

    if (!confirmar) {
      return;
    }

    this.canjeando.set(true);

    try {

      const cliente =
        this.supabaseService.getClient();

      const {
        data: authData,
        error: authError
      } = await cliente
        .auth
        .getUser();

      if (
        authError ||
        !authData.user
      ) {

        alert(
          'Tenés que iniciar sesión.'
        );

        return;
      }

      const usuarioId =
        authData.user.id;

      const {
        error: errorCanje
      } = await cliente
        .from('canjes')
        .insert({
          usuario_id:
            usuarioId,

          recompensa_id:
            recompensa.id,

          puntos_utilizados:
            recompensa.costo_puntos,

          fecha:
            new Date().toISOString(),

          estado:
            'DISPONIBLE'
        });

      if (errorCanje) {

        console.error(
          'Error al guardar el canje:',
          errorCanje
        );

        alert(
          'No se pudo realizar el canje.'
        );

        return;
      }

      const {
        error: errorPuntos
      } = await cliente
        .from('movimientos_puntos')
        .insert({
          usuario_id:
            usuarioId,

          cantidad:
            -recompensa.costo_puntos,

          tipo:
            'CANJE',

          descripcion:
            `Canje de recompensa: ${recompensa.nombre}`,

          fecha:
            new Date().toISOString()
        });

      if (errorPuntos) {

        console.error(
          'Error al descontar los puntos:',
          errorPuntos
        );

        alert(
          'El canje fue creado, pero no se pudieron descontar los puntos.'
        );

        return;
      }

      await this.cargarCuenta();

      alert(
        `¡Canje realizado correctamente!\n\n` +
        `Recompensa: ${recompensa.nombre}\n\n` +
        `Puntos utilizados: ${recompensa.costo_puntos}`
      );

    } finally {

      this.canjeando.set(false);

    }
  }
}