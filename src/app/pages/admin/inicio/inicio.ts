import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Supabase } from '../../../services/supabase';

interface CompraDia {
  fecha: string;
  cantidad: number;
}

interface PeliculaEstadistica {
  nombre: string;
  cantidad: number;
}

interface IngresoMes {
  mes: string;
  ingresos: number;
}

interface MetodoPago {
  metodo: string;
  cantidad: number;
}

interface SalaEstadistica {
  nombre: string;
  cantidad: number;
}

@Component({
  selector: 'app-inicio',
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {

  comprasPorDia = signal<CompraDia[]>([]);
  peliculasMasVistas = signal<PeliculaEstadistica[]>([]);
  ingresosPorMes = signal<IngresoMes[]>([]);
  metodosPago = signal<MetodoPago[]>([]);
  salasMasUsadas = signal<SalaEstadistica[]>([]);

  totalCompras = signal(0);
  ingresos = signal(0);
  entradasVendidas = signal(0);
  peliculaMasVista = signal('Sin datos');

  constructor(
    private supabaseService: Supabase
  ) {}

  ngOnInit() {
    this.cargarEstadisticas();
  }

  async cargarEstadisticas() {

    const client = this.supabaseService.getClient();

    // ==========================================
    // COMPRAS
    // ==========================================

    const { data: comprasData, error: comprasError } = await client
      .from('compras')
      .select('fecha, total, metodo_de_pago')
      .eq('estado', 'PAGADA')
      .order('fecha');

    if (comprasError) {
      console.error('Error al cargar compras:', comprasError);
      return;
    }

    const compras = comprasData ?? [];

    // Total de compras
    this.totalCompras.set(compras.length);

    // Ingresos totales
    const ingresosTotales = compras.reduce(
      (total, compra) => total + Number(compra.total),
      0
    );

    this.ingresos.set(ingresosTotales);

    // ==========================================
    // COMPRAS POR DÍA
    // ==========================================

    const dias: CompraDia[] = [];
    const hoy = new Date();

    for (let i = 6; i >= 0; i--) {

      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);

      const fechaTexto = this.formatearFecha(fecha);

      const cantidad = compras.filter(compra => {

        const fechaCompra = new Date(compra.fecha);

        return this.formatearFecha(fechaCompra) === fechaTexto;

      }).length;

      dias.push({
        fecha: fechaTexto,
        cantidad
      });
    }

    this.comprasPorDia.set(dias);

    // ==========================================
    // INGRESOS POR MES
    // ==========================================

    this.calcularIngresosPorMes(compras);

    // ==========================================
    // MÉTODOS DE PAGO
    // ==========================================

    this.calcularMetodosPago(compras);

    // ==========================================
    // ENTRADAS
    // ==========================================

    const { data: entradasData, error: entradasError } = await client
      .from('entradas')
      .select(`
        id,
        compra_id,
        funcion_id,
        compras!inner(estado),
        funciones!inner(
          peliculas!inner(nombre),
          salas!inner(nombre)
        )
      `)
      .eq('compras.estado', 'PAGADA');

    if (entradasError) {
      console.error('Error al cargar entradas:', entradasError);
      return;
    }

    const entradas = entradasData ?? [];

    // Total de entradas
    this.entradasVendidas.set(entradas.length);

    // ==========================================
    // PELÍCULAS MÁS VISTAS
    // ==========================================

    const peliculasMap = new Map<string, number>();

    entradas.forEach((entrada: any) => {

      const nombrePelicula =
        entrada.funciones?.peliculas?.nombre;

      if (!nombrePelicula) return;

      const cantidadActual =
        peliculasMap.get(nombrePelicula) ?? 0;

      peliculasMap.set(
        nombrePelicula,
        cantidadActual + 1
      );

    });

    const peliculas = Array.from(
      peliculasMap.entries()
    )
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    this.peliculasMasVistas.set(peliculas);

    if (peliculas.length > 0) {
      this.peliculaMasVista.set(peliculas[0].nombre);
    }

    // ==========================================
    // SALAS MÁS UTILIZADAS
    // ==========================================

    const salasMap = new Map<string, number>();

    entradas.forEach((entrada: any) => {

      const nombreSala =
        entrada.funciones?.salas?.nombre;

      if (!nombreSala) return;

      const cantidadActual =
        salasMap.get(nombreSala) ?? 0;

      salasMap.set(
        nombreSala,
        cantidadActual + 1
      );

    });

    const salas = Array.from(
      salasMap.entries()
    )
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    this.salasMasUsadas.set(salas);
  }

  // ==========================================
  // INGRESOS POR MES
  // ==========================================

  calcularIngresosPorMes(compras: any[]) {

    const mesesMap = new Map<string, number>();

    compras.forEach(compra => {

      const fecha = new Date(compra.fecha);

      const año = fecha.getFullYear();
      const mes = fecha.getMonth();

      const clave = `${año}-${mes}`;

      const ingresoActual =
        mesesMap.get(clave) ?? 0;

      mesesMap.set(
        clave,
        ingresoActual + Number(compra.total)
      );

    });

    const meses = Array.from(
      mesesMap.entries()
    )
      .map(([clave, ingresos]) => {

        const [año, mes] = clave.split('-');

        const fecha = new Date(
          Number(año),
          Number(mes),
          1
        );

        return {
          mes: fecha.toLocaleDateString('es-AR', {
            month: 'short',
            year: 'numeric'
          }),
          ingresos
        };

      })
      .slice(-6);

    this.ingresosPorMes.set(meses);
  }

  // ==========================================
  // MÉTODOS DE PAGO
  // ==========================================

  calcularMetodosPago(compras: any[]) {

    const metodosMap = new Map<string, number>();

    compras.forEach(compra => {

      const metodo =
        compra.metodo_de_pago || 'Sin especificar';

      const cantidadActual =
        metodosMap.get(metodo) ?? 0;

      metodosMap.set(
        metodo,
        cantidadActual + 1
      );

    });

    const metodos = Array.from(
      metodosMap.entries()
    )
      .map(([metodo, cantidad]) => ({
        metodo,
        cantidad
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    this.metodosPago.set(metodos);
  }

  // ==========================================
  // FUNCIONES AUXILIARES
  // ==========================================

  formatearFecha(fecha: Date): string {

    const año = fecha.getFullYear();

    const mes =
      String(fecha.getMonth() + 1).padStart(2, '0');

    const dia =
      String(fecha.getDate()).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  obtenerAltura(cantidad: number): number {

    const maximo = Math.max(
      ...this.comprasPorDia().map(
        dia => dia.cantidad
      ),
      1
    );

    return (cantidad / maximo) * 100;
  }

  obtenerAlturaPelicula(cantidad: number): number {

    const maximo = Math.max(
      ...this.peliculasMasVistas().map(
        pelicula => pelicula.cantidad
      ),
      1
    );

    return (cantidad / maximo) * 100;
  }

  obtenerAlturaMes(ingresos: number): number {

    const maximo = Math.max(
      ...this.ingresosPorMes().map(
        mes => mes.ingresos
      ),
      1
    );

    return (ingresos / maximo) * 100;
  }

  obtenerAlturaSala(cantidad: number): number {

    const maximo = Math.max(
      ...this.salasMasUsadas().map(
        sala => sala.cantidad
      ),
      1
    );

    return (cantidad / maximo) * 100;
  }

  formatearFechaMostrar(fecha: string): string {

    const fechaObj =
      new Date(fecha + 'T00:00:00');

    return fechaObj.toLocaleDateString(
      'es-AR',
      {
        weekday: 'short',
        day: '2-digit'
      }
    );
  }
}