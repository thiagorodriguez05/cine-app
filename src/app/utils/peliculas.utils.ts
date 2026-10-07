export function formatearDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (horas === 0) {
    return `${minutosRestantes} minutos`;
  }

  if (minutosRestantes === 0) {
    return horas === 1
      ? '1 hora'
      : `${horas} horas`;
  }

  return horas === 1
    ? `1 hora ${minutosRestantes} minutos`
    : `${horas} horas ${minutosRestantes} minutos`;
}