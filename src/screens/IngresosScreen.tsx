import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "../context/ThemeContext";
import { format, isSameDay, isSameWeek, isSameMonth, parse, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import moment from 'moment';
import { es } from 'date-fns/locale';

const IngresosScreen = () => {
  const [historialViajes, setHistorialViajes] = useState([]);
  const [totalesPorFecha, setTotalesPorFecha] = useState([]);
  const [filtro, setFiltro] = useState('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [totalGastosDia, setTotalGastosDia] = useState<number>(0);
  const colors = isDarkMode
    ? {
        text: '#f7fafc',
        background: '#14161e',
        primary: '#FFA41F',
      }
    : {
        text: '#000000',
        background: '#f7fafc',
        primary: '#FFA41F',
      };

  // Configurar la barra superior según el modo claro/oscuro
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? '#141414' : '#EDF2F7',
      },
      headerTintColor: isDarkMode ? '#f7fafc' : '#333',
    });
  }, [navigation, isDarkMode]);

  useFocusEffect(
    useCallback(() => {
      const cargarHistorial = async () => {
        try {
          const historialActual = await AsyncStorage.getItem('historialViajes');
          if (historialActual) {
            setHistorialViajes(JSON.parse(historialActual));
          }
        } catch (error) {
          console.error('Error al cargar el historial:', error);
        } finally {
          setIsLoading(false);
        }
      };
      cargarHistorial();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      const loadTotales = async () => {
        try {
          const totalesStored = await AsyncStorage.getItem("totalesDiarios");
          if (totalesStored) {
            setTotalesPorFecha(JSON.parse(totalesStored));
          }
        } catch (error) {
          console.error("Error al cargar los totales:", error);
        }
      };
      loadTotales();
    }, [])
  );

  // Función para calcular el neto
  const calcularNeto = (item) => {
    return (
      item.montoCobrado -
      item.comision -
      item.costoMantPorViaje -
      item.costoCtaPorViaje -
      item.costoSeguroPorViaje -
      item.costoCelPorViaje -
      item.costoGasolina
    ).toFixed(2);
  };

  // Función para calcular el neto final
  const calcularNetoFinal = (item, totalGastosDia) => {
    const deduccionesTotales =
      (item.totales.comision || 0) +
      (item.totales.gastosFijos || 0) +
      (parseFloat(totalGastosDia) || 0);
    return (item.totales.montoCobrado - deduccionesTotales).toFixed(2);
  };

  // Función para calcular los totales por fecha
  const calcularTotalesPorFecha = (viajes) => {
    return viajes.reduce(
      (totales, viaje) => {
        const neto = calcularNeto(viaje);
        totales.montoCobrado += parseFloat(viaje.montoCobrado);
        totales.kilometraje += parseFloat(viaje.distancia);
        totales.comision += parseFloat(viaje.comision);
        totales.gastosFijos +=
          (parseFloat(viaje.costoMantPorViaje) || 0) +
          (parseFloat(viaje.costoCtaPorViaje) || 0) +
          (parseFloat(viaje.costoCelPorViaje) || 0) +
          (parseFloat(viaje.costoGasolina) || 0);
        totales.neto += parseFloat(neto) || 0;
        totales.duracionTotal += convertirDuracionAMinutos(viaje.duracion) || 0;
        const totalGastosDia = obtenerTotalesDelDia(viaje.endDate);
        totales.gastosDiarios += parseFloat(totalGastosDia) || 0;
        return totales;
      },
      {
        montoCobrado: 0,
        kilometraje: 0,
        comision: 0,
        gastosFijos: 0,
        neto: 0,
        duracionTotal: 0,
        gastosDiarios: 0,
      }
    );
  };

  // Función para convertir la duración a minutos
  const convertirDuracionAMinutos = (duracion) => {
    const regex = /(\d+)\s*(h|m|min|seg)/g;
    let minutos = 0;
    let match;
    while ((match = regex.exec(duracion)) !== null) {
      const [, valor, unidad] = match;
      const cantidad = parseInt(valor);
      if (unidad === 'h') minutos += cantidad * 60;
      else if (unidad === 'm' || unidad === 'min') minutos += cantidad;
      else if (unidad === 'seg') minutos += Math.floor(cantidad / 60);
    }
    return minutos;
  };

  // Función para calcular el costo por kilómetro
  const calcularCostoPorKm = (totales) => {
    return totales.kilometraje ? (totales.neto / totales.kilometraje).toFixed(2) : '0.00';
  };

  // Función para organizar los viajes por fecha
  const organizarPorFecha = (viajes, filtroActivo) => {
    const viajesPorFecha = viajes.reduce((grupos, viaje) => {
      const fechaViaje = parseFecha(viaje.endDate);
      let grupoKey = '';
      switch (filtroActivo) {
        case 'dia':
          grupoKey = format(fechaViaje, 'dd/MM/yyyy');
          break;
        case 'semana':
          const inicioSemana = startOfWeek(fechaViaje, { weekStartsOn: 1, locale: es });
          grupoKey = format(inicioSemana, 'dd/MM/yyyy');
          break;
        case 'mes':
          grupoKey = format(fechaViaje, 'MM/yyyy');
          break;
        default:
          grupoKey = format(fechaViaje, 'dd/MM/yyyy');
      }
      if (!grupos[grupoKey]) {
        grupos[grupoKey] = {
          viajes: [],
          totalGastosDia: obtenerTotalesDelDia(grupoKey),
        };
      }
      grupos[grupoKey].viajes.push(viaje);
      return grupos;
    }, {});

    return Object.keys(viajesPorFecha)
      .sort((a, b) => {
        const dateA = parse(a, filtroActivo === 'mes' ? 'MM/yyyy' : 'dd/MM/yyyy', new Date());
        const dateB = parse(b, filtroActivo === 'mes' ? 'MM/yyyy' : 'dd/MM/yyyy', new Date());
        return dateB - dateA;
      })
      .map((grupoKey) => ({
        grupoKey,
        viajes: viajesPorFecha[grupoKey].viajes,
        totales: calcularTotalesPorFecha(viajesPorFecha[grupoKey].viajes),
        totalGastosDia: viajesPorFecha[grupoKey].totalGastosDia,
      }));
  };

  const filtrarPorFecha = (viajes, filtro) => {
    const fechaActual = fechaSeleccionada;
    switch (filtro) {
      case 'dia':
        return viajes.filter(viaje => isSameDay(parseFecha(viaje.endDate), fechaActual));
      case 'semana':
        return viajes.filter(viaje =>
          isSameWeek(parseFecha(viaje.endDate), fechaActual, { weekStartsOn: 1, locale: es })
        );
      case 'mes':
        return viajes.filter(viaje =>
          isSameMonth(parseFecha(viaje.endDate), fechaActual)
        );
      default:
        return viajes;
    }
  };

  const parseFecha = (fecha: string) => {
    return parse(fecha, 'dd/MM/yyyy', new Date());
  };

  const obtenerTotalesDelDia = (grupoKey: string) => {
    const fechaGrupo = parse(grupoKey, filtro === 'mes' ? 'MM/yyyy' : 'dd/MM/yyyy', new Date());
    const gastosFiltrados = totalesPorFecha.filter(total => {
      const fechaTotal = parse(total.fecha, 'dd/MM/yyyy', new Date());
      switch (filtro) {
        case 'dia':
          return isSameDay(fechaTotal, fechaGrupo);
        case 'semana':
          return isSameWeek(fechaTotal, fechaGrupo, { weekStartsOn: 1, locale: es });
        case 'mes':
          return isSameMonth(fechaTotal, fechaGrupo);
        default:
          return false;
      }
    });
    return gastosFiltrados.reduce((acumulado, gasto) => acumulado + (parseFloat(gasto.total) || 0), 0);
  };

  const renderItem = ({ item, fecha }) => {
    const totalGastosDia = item.totalGastosDia;
    return (
      <View style={[styles.contenedorItem, { backgroundColor: colors.background }]}>
        <Text style={[styles.fecha, { color: colors.text, display: 'none' }]}>Fecha reg: {fecha}</Text>
        <View style={[styles.summaryContainer, { backgroundColor: colors.background }]}>
          <View style={styles.netoContainer}>
            <View style={styles.netoContainer}>
              <Text style={[styles.netoTexto, { color: colors.text }]}>
                Neto:  
                <Text style={[styles.valorVerde, { color: "#FFA41F" }]}>
                  ${calcularNetoFinal(item, totalGastosDia)}
                </Text>
              </Text>
            </View>
            <Text style={[styles.netoIngresosTexto, { color: colors.text }]}>Ingresos Netos</Text>
          </View>
          <View style={styles.horizontalContainer}>
            <View style={styles.horizontalItem}>
              <Text style={[styles.horizontalValue, { color: colors.text }]}>{item.viajes.length}</Text>
              <Text style={[styles.horizontalText, { color: colors.text }]}>Viajes</Text>
            </View>
            <View style={styles.horizontalItem}>
              <Text style={[styles.horizontalValue, { color: colors.text }]}>{item.totales.kilometraje.toFixed(2)} km</Text>
              <Text style={[styles.horizontalText, { color: colors.text }]}>Kilometraje</Text>
            </View>
            <View style={styles.horizontalItem}>
              <Text style={[styles.horizontalValue, { color: colors.text }]}>${calcularCostoPorKm(item.totales)}</Text>
              <Text style={[styles.horizontalText, { color: colors.text }]}>Costo por Km</Text>
            </View>
          </View>
          <View style={styles.tiempoTotalContainer}>
            <Text style={[styles.tiempoTotalLine, { color: colors.text }]}>
              Tiempo Total: {Math.floor(item.totales.duracionTotal / 60)}h {item.totales.duracionTotal % 60}m
            </Text>
          </View>
          <View style={styles.lineaSeparacion} />
          <View style={styles.cobradoContainer}>
            <Text style={[styles.cobradoHeader, { color: colors.text }]}>Cobrado</Text>
          </View>
          <View style={[styles.montoCobradoContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={[styles.montoCobradoText, { color: colors.text }]}>Tarifas</Text>
            <Text style={[styles.montoCobradoText, { color: colors.text }]}>
              <Text style={{ color: "green" }}>
                +${item.totales.montoCobrado.toFixed(2)}
              </Text>
            </Text>
          </View>
          <View style={styles.lineaSeparacion} />
          <View style={styles.cobradoContainer}>
            <Text style={[styles.cobradoHeader, { color: colors.text }]}>Pagado</Text>
          </View>
          <View style={[styles.montoPagadoContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={[styles.montoPagadoText, { color: colors.text }]}>Comisión</Text>
            <Text style={[{ color: "red", fontSize: 18 }]}>
              -${item.totales.comision ? item.totales.comision.toFixed(2) : '0.00'}
            </Text>
          </View>
          <View style={[styles.montoPagadoContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={[styles.montoPagadoText, { color: colors.text }]}>Gastos Fijos</Text>
            <Text style={[{ color: "red", fontSize: 18 }]}>
              -${item.totales.gastosFijos ? item.totales.gastosFijos.toFixed(2) : '0.00'}
            </Text>
          </View>
          <View style={[styles.montoPagadoContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={[styles.montoPagadoText, { color: colors.text }]}>Gastos del Día</Text>
            <Text style={[{ color: "red", fontSize: 18 }]}>
              -${parseFloat(totalGastosDia).toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.lineaSeparacion} />
          <View style={styles.deduccionesContainer}>
            <Text style={[styles.deducciones, { color: colors.text }]}>
              Deducciones Totales: 
              <Text style={styles.valorRojo}> -${(
                (item.totales.comision || 0) +
                (item.totales.gastosFijos || 0) +
                (parseFloat(totalGastosDia) || 0)
              ).toFixed(2)}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const actualizarTotalGastosDia = (gastosDiarios) => {
    const total = gastosDiarios.reduce((acumulado, gasto) => {
      const monto = parseFloat(gasto.monto);
      if (!isNaN(monto)) {
        return acumulado + monto;
      }
      return acumulado;
    }, 0);
    setTotalGastosDia(total);
  };

  useEffect(() => {
    const loadData = async () => {
      const gastosDiariosStored = await AsyncStorage.getItem("gastosDiarios");
      if (gastosDiariosStored) {
        const gastos = JSON.parse(gastosDiariosStored);
        setGastosDiarios(gastos);
        actualizarTotalGastosDia(gastos);
      }
    };
    loadData();
  }, []);

  const verificarRegistrosParaFecha = (fecha) => {
    const fechaFormateada = format(fecha, 'dd/MM/yyyy');
    return historialViajes.some(viaje => {
      const fechaViaje = parseFecha(viaje.endDate);
      switch (filtro) {
        case 'dia':
          return isSameDay(fechaViaje, fecha);
        case 'semana':
          return isSameWeek(fechaViaje, fecha, { weekStartsOn: 1, locale: es });
        case 'mes':
          return isSameMonth(fechaViaje, fecha);
        default:
          return false;
      }
    });
  };

  const navegarFecha = (direccion) => {
    let nuevaFecha = fechaSeleccionada;
    switch (filtro) {
      case 'dia':
        nuevaFecha = direccion === 'adelante' ? addDays(fechaSeleccionada, 1) : subDays(fechaSeleccionada, 1);
        break;
      case 'semana':
        nuevaFecha = direccion === 'adelante' ? addWeeks(fechaSeleccionada, 1) : subWeeks(fechaSeleccionada, 1);
        break;
      case 'mes':
        nuevaFecha = direccion === 'adelante' ? addMonths(fechaSeleccionada, 1) : subMonths(fechaSeleccionada, 1);
        break;
      default:
        nuevaFecha = fechaSeleccionada;
    }
    const buscarFechaConRegistros = (fechaInicio, direccion) => {
      let fecha = fechaInicio;
      let intentos = 0;
      const MAX_INTENTOS = 2;
      while (!verificarRegistrosParaFecha(fecha) && intentos < MAX_INTENTOS) {
        fecha = direccion === 'adelante' ? addDays(fecha, 1) : subDays(fecha, 1);
        intentos++;
      }
      return fecha;
    };
    const fechaConRegistros = buscarFechaConRegistros(nuevaFecha, direccion);
    setFechaSeleccionada(fechaConRegistros);
  };

  const obtenerTituloFiltro = () => {
    switch (filtro) {
      case 'dia':
        return format(fechaSeleccionada, 'dd MMM. yyyy', { locale: es });
      case 'semana':
        const inicioSemana = startOfWeek(fechaSeleccionada, { weekStartsOn: 1, locale: es });
        const finSemana = endOfWeek(fechaSeleccionada, { weekStartsOn: 1, locale: es });
        return `${format(inicioSemana, 'dd MMM.', { locale: es })} - ${format(finSemana, 'dd MMM. yyyy', { locale: es })}`;
      case 'mes':
        return format(fechaSeleccionada, 'MMMM yyyy', { locale: es }).toUpperCase();
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#141414' : '#EDF2F7' }]}>
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[
            styles.botonFiltro,
            { backgroundColor: filtro === 'dia' ? (isDarkMode ? '#FFA41F' : '#FFA41F') : (isDarkMode ? '#444' : '#ccc') },
          ]}
          onPress={() => {
            setFiltro('dia');
            setFechaSeleccionada(new Date());
          }}
        >
          <Text style={[styles.botonFiltroTexto, { color: filtro === 'dia' ? '#f7fafc' : isDarkMode ? '#bbb' : '#333' }]}>
            Día
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.botonFiltro,
            { backgroundColor: filtro === 'semana' ? (isDarkMode ? '#FFA41F' : '#FFA41F') : (isDarkMode ? '#444' : '#ccc') },
          ]}
          onPress={() => {
            setFiltro('semana');
            setFechaSeleccionada(new Date());
          }}
        >
          <Text style={[styles.botonFiltroTexto, { color: filtro === 'semana' ? '#f7fafc' : isDarkMode ? '#bbb' : '#333' }]}>
            Semana
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.botonFiltro,
            { backgroundColor: filtro === 'mes' ? (isDarkMode ? '#FFA41F' : '#FFA41F') : (isDarkMode ? '#444' : '#ccc') },
          ]}
          onPress={() => {
            setFiltro('mes');
            setFechaSeleccionada(new Date());
          }}
        >
          <Text style={[styles.botonFiltroTexto, { color: filtro === 'mes' ? '#f7fafc' : isDarkMode ? '#bbb' : '#333' }]}>
            Mes
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tituloFiltroContainer}>
        <TouchableOpacity
          style={[styles.botonNavegacion, { backgroundColor: isDarkMode ? '#FFA41F' : '#FFA41F' }]}
          onPress={() => navegarFecha('atras')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.tituloFiltro, { color: isDarkMode ? '#f7fafc' : '#333' }]}>
          {obtenerTituloFiltro()}
        </Text>
        <TouchableOpacity
          style={[styles.botonNavegacion, { backgroundColor: isDarkMode ? '#FFA41F' : '#FFA41F' }]}
          onPress={() => navegarFecha('adelante')}
        >
          <Ionicons name="arrow-forward" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={organizarPorFecha(filtrarPorFecha(historialViajes, filtro), filtro)}
        renderItem={({ item }) => renderItem({ item, fecha: item.grupoKey })}
        keyExtractor={(item) => item.grupoKey}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: isDarkMode ? '#f7fafc' : '#333' }]}>
              No hay registros
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filtrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  botonFiltro: {
    padding: 8,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFA41F',
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  botonFiltroTexto: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tituloFiltroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tituloFiltro: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  lista: {
    flexGrow: 1,
  },
  contenedorItem: {
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  fecha: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  viajeContainer: {
    marginBottom: 6,
  },
  total: {
    fontSize: 14,
    fontWeight: '500',
  },
  viajeDetalle: {
    fontSize: 12,
  },
  totalesContainer: {
    marginBottom: 6,
  },
  botonNavegacion: {
    padding: 6,
    borderRadius: 8,
  },
  botonAgregar: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    padding: 12,
    borderRadius: 50,
  },
  summaryContainer: {
    padding: 12,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    marginVertical: 4,
  },
  ingresosNetosText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  netoContainer: {
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  netoTexto: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  netoIngresosTexto: {
    fontSize: 12,
    color: 'gray',
    marginTop: -16,
  },
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  horizontalItem: {
    alignItems: 'center',
    width: '30%',
  },
  horizontalText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  horizontalValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tiempoTotalContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  tiempoTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tiempoTotalText: {
    fontSize: 12,
    color: 'red',
    marginTop: 4,
  },
  tiempoTotalLine: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  lineaSeparacion: {
    height: 3,
    backgroundColor: '#FFA41F',
    marginVertical: 12,
    width: '90%',
    alignSelf: 'center',
  },
  cobradoContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  cobradoHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cobradoLine: {
    fontSize: 14,
    fontWeight: '600',
  },
  montoCobradoContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  montoCobradoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  montoPagadoContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  montoPagadoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pagadoContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  pagadoHeader: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagadoDetailsContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  pagadoDetail: {
    fontSize: 12,
    marginVertical: 2,
    alignItems: 'center',
  },
  deduccionesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  deducciones: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  valorRojo: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 24,
  },
  // Nuevos estilos para el mensaje "No hay registros"
  emptyContainer: {
    paddingTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default IngresosScreen;