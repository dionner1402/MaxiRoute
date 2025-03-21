import { React, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native"; // Navegación
import { Ionicons } from '@expo/vector-icons'; // Iconos
import { useTheme } from "../context/ThemeContext";

const HistorialScreen = () => {
  const [historialViajes, setHistorialViajes] = useState([]);
  const [filtro, setFiltro] = useState('TODO');
  const [expandedDates, setExpandedDates] = useState({}); // Estado para manejar las fechas expandidas
  const [viajesSeleccionados, setViajesSeleccionados] = useState<string[]>([]); // Mantener los viajes seleccionados
  const navigation = useNavigation(); // Hook para navegar
  const { isDarkMode } = useTheme(); // Obtener el estado del modo oscuro

  // Función para manejar la selección de un viaje
  const seleccionarViaje = (id: string) => {
    setViajesSeleccionados((prevState) => {
      if (prevState.includes(id)) {
        return prevState.filter(viajeId => viajeId !== id); // Desmarcar si ya está seleccionado
      } else {
        return [...prevState, id]; // Marcar como seleccionado
      }
    });
  };

  // Función para eliminar los viajes seleccionados
  const eliminarViajesSeleccionados = async () => {
    try {
      const viajesActualizados = historialViajes.filter(viaje => !viajesSeleccionados.includes(viaje.id));
      await AsyncStorage.setItem('historialViajes', JSON.stringify(viajesActualizados));
      setHistorialViajes(viajesActualizados);
      setViajesSeleccionados([]); // Limpiar selección
      console.log('Viajes seleccionados eliminados');
    } catch (error) {
      console.error('Error al eliminar los viajes seleccionados:', error);
    }
  };

  // Función para eliminar todo el historial
  const eliminarHistorial = async () => {
    try {
      await AsyncStorage.removeItem('historialViajes');
      setHistorialViajes([]); // Limpia el estado local también
      console.log('Historial eliminado');
    } catch (error) {
      console.error('Error al eliminar el historial:', error);
    }
  };

  // Cargar historial desde AsyncStorage
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const historialActual = await AsyncStorage.getItem('historialViajes');
        if (historialActual) {
          setHistorialViajes(JSON.parse(historialActual));
        }
      } catch (error) {
        console.error('Error al cargar el historial:', error);
      }
    };

    cargarHistorial();
  }, []);

  const filtrarViajes = () => {
    if (filtro === 'TODO') return historialViajes;
    return historialViajes.filter((viaje) => viaje.plataforma === filtro);
  };

  const calcularNeto = (item) => {
    return (
      item.montoCobrado -
      item.comision -
      item.costoMantPorViaje -
      item.costoCtaPorViaje -
      item.costoSeguroPorViaje -
      item.costoCelPorViaje -
      item.costoGasolina
    ).toFixed(2); // Devuelve el neto con dos decimales
  };

  const organizarPorFecha = (viajes) => {
    const viajesPorFecha = viajes.reduce((grupos, viaje) => {
      const fecha = viaje.endDate ? viaje.endDate.split(' ')[0] : 'Fecha desconocida';
      if (!grupos[fecha]) {
        grupos[fecha] = {
          viajes: [],
          netoTotal: 0,
        };
      }
      
      // Calcular el neto para el viaje y agregarlo al neto total de esa fecha
      const netoViaje = calcularNeto(viaje);
      grupos[fecha].viajes.push(viaje);
      grupos[fecha].netoTotal += parseFloat(netoViaje);
      return grupos;
    }, {});

    // Convertir el objeto en un array para poder ordenarlo por fecha
    return Object.keys(viajesPorFecha)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((fecha) => ({
        fecha,
        viajes: viajesPorFecha[fecha].viajes,
        netoTotal: viajesPorFecha[fecha].netoTotal.toFixed(2),
      }));
  };

  const toggleDateVisibility = (fecha) => {
    setExpandedDates((prev) => ({
      ...prev,
      [fecha]: !prev[fecha], // Cambiar la visibilidad de la fecha seleccionada
    }));
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('DetailScreen', { viaje: item })}
      onLongPress={() => seleccionarViaje(item.id)} // Agregar opción de seleccionar/deseleccionar
    >
      <View style={[styles.viajeContainer, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]}>
        <View style={styles.viajeHeader}>
          <Text style={[styles.infoTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            Viaje ID: {item.id}
          </Text>
          <Text style={[styles.infoDate, { color: isDarkMode ? '#bbb' : '#888' }]}>
            {item.endDate}
          </Text>
        </View>
        <View style={[styles.separator, { backgroundColor: isDarkMode ? '#555' : '#FFA41F' }]} />
        <View style={styles.viajeBody}>
          <Text style={[styles.infoText, { color: isDarkMode ? '#ccc' : '#555' }]}>Hora Inicio: {item.horaInicio}</Text>
          <Text style={[styles.infoText, { color: isDarkMode ? '#ccc' : '#555' }]}>Hora Fin: {item.HoraFin}</Text>
          <Text style={[styles.montoText, { color: isDarkMode ? '#4caf50' : '#FFA41F' }]}>Monto Cobrado: ${parseFloat(item.montoCobrado).toFixed(2)}</Text>
          {/* Indicador de viaje seleccionado */}
          {viajesSeleccionados.includes(item.id) && <Text style={styles.selectedText}>Seleccionado</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f9f9f9' }]}>
      <Text style={[styles.title, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
        Historial de Viajes
      </Text>

      {/* Botón para eliminar los viajes seleccionados */}
      <View style={{ marginBottom: 16 }}>
        <TouchableOpacity
          onPress={eliminarViajesSeleccionados}
          style={{
            backgroundColor: '#e74c3c',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#F5F5F5', fontWeight: 'bold', fontSize: 16 }}>
            Eliminar Viajes Seleccionados
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón para eliminar todo el historial */}
      <View style={{ marginBottom: 16 }}>
        <TouchableOpacity
          onPress={eliminarHistorial}
          style={{
            backgroundColor: '#e74c3c',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#F5F5F5', fontWeight: 'bold', fontSize: 16 }}>
            Eliminar Historial (TODO)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botones de filtro */}
      <View style={styles.filterContainer}>
        {['TODO', 'UBER', 'INDRIVE', 'LIBRE'].map((tipo) => (
          <TouchableOpacity
            key={tipo}
            style={[
              styles.filterButton,
              filtro === tipo && styles.filterButtonActive,
              { backgroundColor: isDarkMode ? '#444' : '#e3e3e3' },
            ]}
            onPress={() => setFiltro(tipo)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filtro === tipo && styles.filterButtonTextActive,
                { color: isDarkMode ? '#F5F5F5' : '#333' },
              ]}
            >
              {tipo}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de viajes agrupados por fecha */}
      {organizarPorFecha(filtrarViajes()).length === 0 ? (
        <Text style={[styles.noTrips, { color: isDarkMode ? '#ccc' : '#888' }]}>
          No hay viajes registrados.
        </Text>
      ) : (
        <FlatList
          data={organizarPorFecha(filtrarViajes())}
          keyExtractor={(item) => item.fecha}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity onPress={() => toggleDateVisibility(item.fecha)}>
                <Text style={[styles.dateHeader, { color: isDarkMode ? '#bbb' : '#555' }]}>
                  {item.fecha} - Neto Total: ${item.netoTotal}
                </Text>
              </TouchableOpacity>
              {expandedDates[item.fecha] && (
                <FlatList
                  data={item.viajes}
                  keyExtractor={(viaje) => viaje.id}
                  renderItem={renderItem}
                />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  viajeContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  viajeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoDate: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  separator: {
    height: 1,
    marginVertical: 8,
  },
  viajeBody: {
    paddingTop: 8,
  },
  infoText: {
    fontSize: 14,
  },
  montoText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1abc9c',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: '#F5F5F5',
  },
  noTrips: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HistorialScreen;
