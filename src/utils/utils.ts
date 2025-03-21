// utils.ts
import { parseISO, isSameDay, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';

interface Contenedor {
  fecha: string;
}

export const filtrarContenedoresPorFecha = (contenedores: Contenedor[], filtroFecha: string) => {
  const hoy = new Date();

  if (filtroFecha === 'DIA') {
    return contenedores.filter((contenedor) =>
      isSameDay(parseISO(contenedor.fecha), hoy)
    );
  }

  if (filtroFecha === 'SEMANA') {
    const inicioSemana = startOfWeek(hoy, { weekStartsOn: 1 });
    return contenedores.filter((contenedor) =>
      isWithinInterval(parseISO(contenedor.fecha), { start: inicioSemana, end: hoy })
    );
  }

  if (filtroFecha === 'MES') {
    const inicioMes = startOfMonth(hoy);
    return contenedores.filter((contenedor) =>
      isWithinInterval(parseISO(contenedor.fecha), { start: inicioMes, end: hoy })
    );
  }

  return contenedores;
};
