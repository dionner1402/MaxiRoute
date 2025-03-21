import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "../context/ThemeContext"; 
import { format, isSameDay, isSameWeek, isSameMonth, parse, aFFA41Fays, subDays, startOfWeek, endOfWeek } from 'date-fns';
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
  const [totalGastosDia, setTotalGastosDia] = useState<number>(0); // Valor inicial 0
  const colors = isDarkMode
    ? {
        text: '#F5F5F5',
        background: '#14161e',
        primary: '#FFA41F',
      }
    : {
        text: '#000000',
        background: '#F5F5F5',
        primary: '#FFA41F',
      };
	  
	  
 // Configurar la barra superior según el modo claro/oscuro
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? '#EDF2F7' : '#F5F5F5', // Cambia el fondo de la barra superior
      },
      headerTintColor: isDarkMode ? '#F5F5F5' : '#333', // Cambia el color del texto de la barra superior
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
  }, []) // Este array de dependencias se mantiene vacío para que la función se ejecute cada vez que se recibe el foco.
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
      return totales;
    },
    {
      montoCobrado: 0,
      kilometraje: 0,
      comision: 0,
      gastosFijos: 0,
      neto: 0,
      duracionTotal: 0,
    }
  );
};

// Función para convertir la duración a minutos
const convertirDuracionAMinutos = (duracion) => {
  const regex = /(\d+)\s*(h|m|min|seg)/g;
  let minutos = 0;
  
  let match;
  while ((match = regex.exec(duracion)) !== null) {
    const [ , valor, unidad ] = match;
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



// Función para organizar los viajes por fecha (incluyendo los gastos del día)
const organizarPorFecha = (viajes) => {
  const viajesPorFecha = viajes.reduce((grupos, viaje) => {
    const fecha = viaje.endDate ? viaje.endDate.split(' ')[0] : 'Fecha desconocida';
    if (!grupos[fecha]) {
      grupos[fecha] = {
        viajes: [],
        totalGastosDia: 0,  // Aquí almacenamos el total de los gastos del día
      };
    }
    grupos[fecha].viajes.push(viaje);
    return grupos;
  }, {});
  
  return Object.keys(viajesPorFecha)
    .sort((a, b) => new Date(b) - new Date(a))
    .map((fecha) => ({
      fecha,
      viajes: viajesPorFecha[fecha].viajes,
      totales: calcularTotalesPorFecha(viajesPorFecha[fecha].viajes),
      totalGastosDia: viajesPorFecha[fecha].totalGastosDia, // Mostrar el total de los gastos del día
    }));
};




  const filtrarPorFecha = (viajes, filtro) => {
    const fechaActual = fechaSeleccionada;

    switch (filtro) {
      case 'dia':
        return viajes.filter(viaje => isSameDay(parseFecha(viaje.endDate), fechaActual));
      
      default:
        return viajes;
    }
  };

  const parseFecha = (fecha: string) => {
    return parse(fecha, 'dd/MM/yyyy', new Date());
  };

 const obtenerTotalesDelDia = (fecha) => {
  const totalDelDia = totalesPorFecha.find(total => total.fecha === fecha);
  return totalDelDia ? totalDelDia.total : 0; // Devuelve el total si se encuentra, o 0 si no existe
};

  const renderItem = ({ item, fecha }) => {
  // Buscar el total de gastos para la fecha de este item
  const totalGastosDia = totalesPorFecha.find(
    (total) => total.fecha === item.fecha
  )?.total || 0;

	return (
  <View style={[styles.contenedorItem, { backgroundColor: colors.background }]}>
    {/* Ocultar la fecha */}
    <Text style={[styles.fecha, { color: colors.text, display: 'none' }]}>Fecha reg: {fecha}</Text>

    <View style={[styles.summaryContainer, { backgroundColor: colors.background }]}>
      {/* Contenedor Neto e Ingresos Netos */}
      <View style={styles.netoContainer}>
  
  
  {/* Neto */}
<View style={styles.netoContainer}>
  <Text style={[styles.netoTexto, { color: colors.text }]}>
    Neto:  
    <Text style={[styles.valorVerde, { color: "#FFA41F" }]}>
       ${calcularNetoFinal(item, totalGastosDia)}
    </Text>
  </Text>
</View>




  {/* Ingresos Netos */}
  <Text style={[styles.netoIngresosTexto, { color: colors.text }]}>Ingresos Netos</Text>
</View>

      {/* Contenedor horizontal para Viajes, Kilometraje y Costo por Km */}
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

      {/* Tiempo Total en una sola línea */}
      <View style={styles.tiempoTotalContainer}>
        <Text style={[styles.tiempoTotalLine, { color: colors.text }]}>
          Tiempo Total: {Math.floor(item.totales.duracionTotal / 60)}h {item.totales.duracionTotal % 60}m
        </Text>
      </View>

      {/* Línea de separación */}
      <View style={styles.lineaSeparacion} />

      {/* Encabezado de sección: Cobrado */}
      <View style={styles.cobradoContainer}>
        <Text style={[styles.cobradoHeader, { color: colors.text }]}>Cobrado</Text>
      </View>

      {/* Monto Cobrado */}
<View style={[styles.montoCobradoContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
  
  <Text style={[styles.montoCobradoText, { color: colors.text }]}>Tarifas</Text>
  <Text style={[styles.montoCobradoText, { color: colors.text }]}>
  <Text style={{ color: "green" }}>
 +${item.totales.montoCobrado.toFixed(2)}</Text>
  </Text>
</View>



{/* Línea de separación */}
      <View style={styles.lineaSeparacion} />
      
	  
	{/* Encabezado de sección: Pagado*/}
      <View style={styles.cobradoContainer}>
        <Text style={[styles.cobradoHeader, { color: colors.text }]}>Pagado</Text>
      </View>
	  
	  {/* Monto Pagado */}
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
  <Text style={[{ color: "red", fontSize: 18}]}>
    -${parseFloat(totalGastosDia).toFixed(2) || '0.00'}
  </Text>
</View>

	    
	  

{/* Otra Línea de Separación */}
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
    const monto = parseFloat(gasto.monto); // Convierte el monto a número
    if (!isNaN(monto)) { // Solo suma si es un número válido
      return acumulado + monto;
    }
    return acumulado; // Si no es un número válido, no lo suma
  }, 0);
  setTotalGastosDia(total);
};

useEffect(() => {
  const loadData = async () => {
    const gastosDiariosStored = await AsyncStorage.getItem("gastosDiarios");
    if (gastosDiariosStored) {
      const gastos = JSON.parse(gastosDiariosStored);
      setGastosDiarios(gastos);
      actualizarTotalGastosDia(gastos); // Actualiza el total de gastos después de cargar los gastos
    }
  };
  loadData();
}, []);

  
 // Agregar esta función para verificar si hay registros en una fecha dada
const verificarRegistrosParaFecha = (fecha) => {
  const fechaFormateada = format(fecha, 'dd/MM/yyyy', { locale: es });
  return historialViajes.some(viaje => viaje.endDate.includes(fechaFormateada));
};

const navegarFecha = (direccion) => {
  let nuevaFecha = fechaSeleccionada;

  // Lógica para avanzar o retroceder en el filtro de día, semana, o mes
  switch (filtro) {
    case 'dia':
      nuevaFecha = direccion === 'adelante' ? aFFA41Fays(fechaSeleccionada, 1) : subDays(fechaSeleccionada, 1);
      break;
    
    default:
      nuevaFecha = fechaSeleccionada;
      break;
  }

  // Función que ajusta la fecha si no hay registros
  const buscarFechaConRegistros = (fechaInicio, direccion) => {
    let fecha = fechaInicio;
    let intentos = 0;
    const MAX_INTENTOS = 2; // Número máximo de días a buscar antes de detenerse (puedes ajustar este valor)

    while (!verificarRegistrosParaFecha(fecha) && intentos < MAX_INTENTOS) {
      // Avanzar o retroceder un día según la dirección
      fecha = direccion === 'adelante' ? aFFA41Fays(fecha, 1) : subDays(fecha, 1);
      intentos++;
    }

    return fecha;
  };

  // Buscar la fecha con registros disponible
  const fechaConRegistros = buscarFechaConRegistros(nuevaFecha, direccion);

  // Actualizar la fecha solo si se encontró una con registros
  setFechaSeleccionada(fechaConRegistros);
};

// Formato de fecha según el filtro
const obtenerTituloFiltro = () => {
  switch (filtro) {
    case 'dia':
      return ` ${format(fechaSeleccionada, 'dd MMM. yyyy', { locale: es })} `;
    default:
      return '';
  }
};

return (
  <View style={[styles.container, { backgroundColor: isDarkMode ? '#EDF2F7' : '#EDF2F7' }]}>
    {/* Filtros como botones */}
    <View style={styles.filtrosContainer}>
      <TouchableOpacity
        style={[
          styles.botonFiltro,
          { backgroundColor: filtro === 'dia' ? (isDarkMode ? '#FFA41F' : '#FFA41F') : (isDarkMode ? '#444' : '#ccc') },
        ]}
        onPress={() => setFiltro('dia')}
      >
        <Text style={[styles.botonFiltroTexto, { color: filtro === 'dia' ? '#F5F5F5' : isDarkMode ? '#bbb' : '#333' }]}>
          Día
        </Text>
      </TouchableOpacity>
    </View>

    {/* Mostrar el título según el filtro */}
    <View style={styles.tituloFiltroContainer}>
      {/* Flechas de navegación */}
      <TouchableOpacity
        style={[styles.botonNavegacion, { backgroundColor: isDarkMode ? '#FFA41F' : '#FFA41F' }]}
        onPress={() => navegarFecha('atras')}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Título con fecha */}
      <Text style={[styles.tituloFiltro, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
        {obtenerTituloFiltro()}
      </Text>

      {/* Flechas de navegación */}
      <TouchableOpacity
        style={[styles.botonNavegacion, { backgroundColor: isDarkMode ? '#FFA41F' : '#FFA41F' }]}
        onPress={() => navegarFecha('adelante')}
      >
        <Ionicons name="arrow-forward" size={24} color="white" />
      </TouchableOpacity>
    </View>

    {/* Mostrar los viajes agrupados */}
    <FlatList
      data={organizarPorFecha(filtrarPorFecha(historialViajes, filtro))}
      renderItem={({ item }) => renderItem({ item, fecha: item.fecha })}
      keyExtractor={(item) => item.fecha}
      contentContainerStyle={styles.lista}
    />
  </View>
);
};

const styles = StyleSheet.create({


container: {
  flex: 1,
  padding: 12, // Reducido el padding general
},
titulo: {
  fontSize: 20, // Reducido el tamaño del título
  fontWeight: 'bold',
  marginBottom: 12, // Reducido el margen inferior
},
filtrosContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12, // Reducido el margen inferior
},
botonFiltro: {
    padding: 8, // Reducido el padding
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4, // Reducido el margen horizontal
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'#FFA41F', // Cambia el fondo según el modo
    shadowColor: '#ccc', // Cambia el color de la sombra
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // Para Android
  },
botonFiltroTexto: {
  fontSize: 14, // Reducido el tamaño de texto
  fontWeight: 'bold',
},
tituloFiltroContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 12, // Reducido el margen inferior
},
tituloFiltro: {
  fontSize: 18, // Reducido el tamaño de texto
  fontWeight: '600',
  marginHorizontal: 12, // Reducido el margen horizontal
},
lista: {
  flexGrow: 1,
},
contenedorItem: {
  padding: 8, // Reducido el padding
  marginBottom: 8, // Reducido el margen inferior
  borderRadius: 8,
  shadowColor: '#FFA41F',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 3,
},
fecha: {
  fontSize: 16, // Reducido el tamaño de texto
  fontWeight: '600',
  marginBottom: 6, // Reducido el margen inferior
},
viajeContainer: {
  marginBottom: 6, // Reducido el margen inferior
},
total: {
  fontSize: 14, // Reducido el tamaño de texto
  fontWeight: '500',
},
viajeDetalle: {
  fontSize: 12, // Reducido el tamaño de texto
},
totalesContainer: {
  marginBottom: 6, // Reducido el margen inferior
},
botonNavegacion: {
  padding: 6, // Reducido el padding
  borderRadius: 8,
},
botonAgregar: {
  position: 'absolute',
  bottom: 24, // Reducido el margen inferior
  right: 24, // Reducido el margen derecho
  padding: 12, // Reducido el padding
  borderRadius: 50,
},
summaryContainer: {
  padding: 12, // Reducido el padding
  borderRadius: 8,
},
summaryText: {
  fontSize: 14, // Reducido el tamaño de texto
  fontWeight: '500',
  marginVertical: 4, // Reducido el margen vertical
},
ingresosNetosText: {
  fontSize: 12, // Reducido el tamaño de texto
  fontStyle: 'italic',
  marginTop: 4, // Reducido el margen superior
},
netoContainer: {
  marginBottom: 24, // Reducido el margen inferior
  justifyContent: 'center',
  alignItems: 'center',
},
netoTexto: {
  fontSize: 40, // Reducido el tamaño de texto
  fontWeight: 'bold',
},
netoIngresosTexto: {
  fontSize: 12, // Reducido el tamaño de texto
  color: 'gray',
  marginTop: -16, // Reducido el margen superior
},
horizontalContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12, // Reducido el margen inferior
},
horizontalItem: {
  alignItems: 'center',
  width: '30%',
},
horizontalText: {
  fontSize: 12, // Reducido el tamaño de texto
  fontWeight: 'bold',
  marginBottom: 4, // Reducido el margen inferior
},
horizontalValue: {
  fontSize: 14, // Reducido el tamaño de texto
  fontWeight: 'bold',
},
tiempoTotalContainer: {
  alignItems: 'center',
  marginVertical: 4, // Reducido el margen vertical
},
tiempoTotalValue: {
  fontSize: 16, // Reducido el tamaño de texto
  fontWeight: 'bold',
},
tiempoTotalText: {
  fontSize: 12, // Reducido el tamaño de texto
  color: 'gray',
  marginTop: 4, // Reducido el margen superior
},
tiempoTotalLine: {
  fontSize: 14, // Reducido el tamaño de texto
  fontWeight: 'bold',
},
lineaSeparacion: {
  height: 3,
  backgroundColor: '#EDF2F7',
  marginVertical: 12, // Reducido el margen vertical
  width: '90%',
  alignSelf: 'center',
},
cobradoContainer: {
  alignItems: 'center',
  marginVertical: 4, // Reducido el margen vertical
},
cobradoHeader: {
  fontSize: 16, // Reducido el tamaño de texto
  fontWeight: 'bold',
  marginBottom: 4, // Reducido el margen inferior
},
cobradoLine: {
  fontSize: 14, // Reducido el tamaño de texto
  fontWeight: '600',
},
montoCobradoContainer: {
  alignItems: 'center',
  marginVertical: 4, // Reducido el margen vertical
},
montoCobradoText: {
  fontSize: 16, // Reducido el tamaño de texto
  fontWeight: '600',
},
montoPagadoContainer: {
  alignItems: 'center',
  marginVertical: 4, // Reducido el margen vertical
},
montoPagadoText: {
  fontSize: 16, // Reducido el tamaño de texto
  fontWeight: '600',
},
pagadoContainer: {
  alignItems: 'center',
  marginVertical: 4, // Reducido el margen vertical
},
pagadoHeader: {
  fontSize: 16, // Reducido el tamaño de texto
  fontWeight: 'bold',
},
pagadoDetailsContainer: {
  marginVertical: 4, // Reducido el margen vertical
  paddingHorizontal: 16, // Reducido el padding horizontal
},
pagadoDetail: {
  fontSize: 12, // Reducido el tamaño de texto
  marginVertical: 2, // Reducido el margen vertical
  alignItems: 'center',
},
deduccionesContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
},
deducciones: {
  fontSize: 14, // Reducido el tamaño de texto
  fontWeight: 'bold',
},
valorRojo: {
  color: 'red',
  fontWeight: 'bold',
  fontSize: 24, // Reducido el tamaño de texto
},

});




export default IngresosScreen;


 
  
  