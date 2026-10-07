import { Injectable } from '@angular/core';
import { Supabase } from './supabase';

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
  duracion: number;
}

interface Sala {
  id: number;
  nombre: string;
  formato: string;
}

export interface PeliculaProgramacion {
  peliculaId: string;
  formatos: string[];
  dias: number[];
  horaDesde: string;
  horaHasta: string;
}

export interface DatosProgramacion {
  fechaDesde: string;
  idioma: string;
  peliculas: PeliculaProgramacion[];
}

export interface FuncionPropuesta {
  peliculaId: string;
  peliculaNombre: string;
  horaInicio: string;
  horaFin: string;
}

export interface SalaPropuesta {
  salaId: number;
  salaNombre: string;
  formato: string;
  funciones: FuncionPropuesta[];
}

export interface DiaPropuesta {
  fecha: string;
  salas: SalaPropuesta[];
}

@Injectable({
  providedIn: 'root'
})
export class FuncionesService {

  constructor(
    private supabaseService: Supabase
  ) {}

  async obtenerFunciones(): Promise<Funcion[]> {
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('funciones')
        .select('*')
        .order('fecha')
        .order('hora_de_inicio');

    if (error) {
      console.error('Error al cargar funciones:', error);
      return [];
    }

    const ahora = new Date();

    return (data ?? []).filter(funcion => {
      const fechaFin = new Date(
        `${funcion.fecha}T${funcion.hora_de_fin}`
      );

      return fechaFin > ahora;
    });
  }

  async obtenerPeliculas(): Promise<Pelicula[]> {
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('peliculas')
        .select('id, nombre, duracion')
        .eq('estado', true)
        .order('nombre');

    if (error) {
      console.error('Error al cargar películas:', error);
      return [];
    }

    return data ?? [];
  }

  async obtenerSalas(): Promise<Sala[]> {
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('salas')
        .select('*')
        .order('id');

    if (error) {
      console.error('Error al cargar salas:', error);
      return [];
    }

    return data ?? [];
  }

  async obtenerFormatosPorPelicula(): Promise<{
    [peliculaId: string]: string[]
  }> {
    const { data, error } =
      await this.supabaseService
        .getClient()
        .from('peliculas_formatos')
        .select(`
          pelicula_id,
          formatos (
            nombre
          )
        `);

    if (error) {
      console.error(
        'Error al cargar formatos de películas:',
        error
      );
      return {};
    }

    const formatos: {
      [peliculaId: string]: string[]
    } = {};

    for (const item of data ?? []) {
      if (!formatos[item.pelicula_id]) {
        formatos[item.pelicula_id] = [];
      }

      const formatosRelacionados =
        Array.isArray(item.formatos)
          ? item.formatos
          : [item.formatos];

      for (const formato of formatosRelacionados) {
        if (formato?.nombre) {
          formatos[item.pelicula_id].push(
            formato.nombre
          );
        }
      }
    }

    return formatos;
  }

  async generarPropuestaProgramacion(
    datos: DatosProgramacion
  ): Promise<DiaPropuesta[]> {
    const [
      peliculas,
      salas,
      funcionesExistentes
    ] = await Promise.all([
      this.obtenerPeliculas(),
      this.obtenerSalas(),
      this.obtenerFunciones()
    ]);

    const propuestas: DiaPropuesta[] = [];

    for (let dia = 0; dia < 7; dia++) {
      const fecha = this.sumarDias(
        datos.fechaDesde,
        dia
      );

      const propuestaDia =
        this.generarPropuestaDia(
          fecha,
          dia,
          datos,
          peliculas,
          salas,
          funcionesExistentes
        );

      if (propuestaDia.salas.length > 0) {
        propuestas.push(propuestaDia);
      }
    }

    return propuestas;
  }

  private generarPropuestaDia(
    fecha: string,
    diaSemana: number,
    datos: DatosProgramacion,
    peliculas: Pelicula[],
    salas: Sala[],
    funcionesExistentes: Funcion[]
  ): DiaPropuesta {
    const salasPropuestas: SalaPropuesta[] = [];

    for (const sala of salas) {
      const funcionesPropuestas: FuncionPropuesta[] = [];

      const peliculasSala =
        datos.peliculas.filter(
          peliculaProgramacion =>
            peliculaProgramacion.dias.includes(
              diaSemana
            ) &&
            peliculaProgramacion.formatos.some(
              formato =>
                this.mismoFormato(
                  formato,
                  sala.formato
                )
            )
        );

      if (peliculasSala.length === 0) {
        continue;
      }

      const funcionesSalaExistentes =
        funcionesExistentes.filter(
          funcion =>
            funcion.fecha === fecha &&
            funcion.sala_id === sala.id
        );

      this.agregarFuncionesSala(
        peliculasSala,
        peliculas,
        funcionesSalaExistentes,
        funcionesPropuestas
      );

      if (funcionesPropuestas.length === 0) {
        continue;
      }

      funcionesPropuestas.sort(
        (a, b) =>
          this.horaAMinutos(a.horaInicio) -
          this.horaAMinutos(b.horaInicio)
      );

      salasPropuestas.push({
        salaId: sala.id,
        salaNombre: sala.nombre,
        formato: sala.formato,
        funciones: funcionesPropuestas
      });
    }

    return {
      fecha,
      salas: salasPropuestas
    };
  }

  private agregarFuncionesSala(
    peliculasSala: PeliculaProgramacion[],
    peliculas: Pelicula[],
    funcionesExistentes: Funcion[],
    funcionesPropuestas: FuncionPropuesta[]
  ): void {
    const peliculasDisponibles =
      peliculasSala
        .map(configuracion => ({
          configuracion,
          pelicula: peliculas.find(
            item =>
              item.id === configuracion.peliculaId
          )
        }))
        .filter(
          item => item.pelicula !== undefined
        ) as {
          configuracion: PeliculaProgramacion;
          pelicula: Pelicula;
        }[];

    if (peliculasDisponibles.length === 0) {
      return;
    }

    const inicioSala =
      Math.min(
        ...peliculasDisponibles.map(
          item =>
            this.horaAMinutos(
              item.configuracion.horaDesde
            )
        )
      );

    const finSala =
      Math.max(
        ...peliculasDisponibles.map(
          item =>
            this.horaAMinutos(
              item.configuracion.horaHasta
            )
        )
      );

    let horaActual = inicioSala;
    let indicePelicula = 0;

    while (horaActual < finSala) {
      let funcionAgregada = false;

      for (
        let intento = 0;
        intento < peliculasDisponibles.length;
        intento++
      ) {
        const indice =
          (indicePelicula + intento) %
          peliculasDisponibles.length;

        const item =
          peliculasDisponibles[indice];

        const inicioPelicula =
          this.horaAMinutos(
            item.configuracion.horaDesde
          );

        const finPelicula =
          this.horaAMinutos(
            item.configuracion.horaHasta
          );

        if (horaActual < inicioPelicula) {
          continue;
        }

        const horaFin =
          horaActual + item.pelicula.duracion;

        if (horaFin > finPelicula) {
          continue;
        }

        const hayConflicto =
          this.hayConflictoConFunciones(
            horaActual,
            horaFin,
            funcionesExistentes,
            funcionesPropuestas
          );

        if (hayConflicto) {
          continue;
        }

        funcionesPropuestas.push({
          peliculaId: item.pelicula.id,
          peliculaNombre: item.pelicula.nombre,
          horaInicio:
            this.minutosAHora(horaActual),
          horaFin:
            this.minutosAHora(horaFin)
        });

        indicePelicula =
          (indice + 1) %
          peliculasDisponibles.length;

        horaActual = horaFin + 30;
        funcionAgregada = true;

        break;
      }

      if (!funcionAgregada) {
        horaActual += 30;
      }
    }
  }

  private hayConflictoConFunciones(
    inicioNuevo: number,
    finNuevo: number,
    funcionesExistentes: Funcion[],
    funcionesPropuestas: FuncionPropuesta[]
  ): boolean {
    const conflictoExistente =
      funcionesExistentes.some(
        funcion =>
          this.hayConflicto(
            inicioNuevo,
            finNuevo,
            this.horaAMinutos(
              funcion.hora_de_inicio
            ),
            this.horaAMinutos(
              funcion.hora_de_fin
            )
          )
      );

    if (conflictoExistente) {
      return true;
    }

    return funcionesPropuestas.some(
      funcion =>
        this.hayConflicto(
          inicioNuevo,
          finNuevo,
          this.horaAMinutos(
            funcion.horaInicio
          ),
          this.horaAMinutos(
            funcion.horaFin
          )
        )
    );
  }

  private hayConflicto(
    inicioNuevo: number,
    finNuevo: number,
    inicioExistente: number,
    finExistente: number
  ): boolean {
    return (
      inicioNuevo < finExistente + 30 &&
      finNuevo + 30 > inicioExistente
    );
  }

  private mismoFormato(
    formato1: string,
    formato2: string
  ): boolean {
    return (
      formato1.trim().toUpperCase() ===
      formato2.trim().toUpperCase()
    );
  }

  private sumarDias(
    fecha: string,
    cantidad: number
  ): string {
    const resultado =
      new Date(`${fecha}T00:00:00`);

    resultado.setDate(
      resultado.getDate() + cantidad
    );

    const año = resultado.getFullYear();

    const mes =
      String(resultado.getMonth() + 1)
        .padStart(2, '0');

    const dia =
      String(resultado.getDate())
        .padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  private horaAMinutos(
    hora: string
  ): number {
    const [horas, minutos] =
      hora.split(':').map(Number);

    return horas * 60 + minutos;
  }

  private minutosAHora(
    minutos: number
  ): string {
    const horas =
      Math.floor(minutos / 60);

    const minutosRestantes =
      minutos % 60;

    return (
      `${String(horas).padStart(2, '0')}:` +
      `${String(minutosRestantes).padStart(2, '0')}`
    );
  }

  async crearFuncion(
    datos: {
      pelicula_id: string;
      sala_id: number;
      fecha: string;
      hora_de_inicio: string;
      hora_de_fin: string;
      formato: string;
      idioma: string;
      precio_base: number;
    }
  ): Promise<boolean> {
    const { error } =
      await this.supabaseService
        .getClient()
        .from('funciones')
        .insert({
          pelicula_id: datos.pelicula_id,
          sala_id: datos.sala_id,
          fecha: datos.fecha,
          hora_de_inicio: datos.hora_de_inicio,
          hora_de_fin: datos.hora_de_fin,
          formato: datos.formato,
          idioma: datos.idioma,
          precio_base: datos.precio_base
        });

    if (error) {
      console.error(
        'Error al crear función:',
        error
      );
      return false;
    }

    return true;
  }
}