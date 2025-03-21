import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { format, startOfWeek, endOfWeek, parse } from 'date-fns';



const HistorialScreen = () => {
  const [historialViajes, setHistorialViajes] = useState([]);
  const [filtro, setFiltro] = useState('TODO');
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const [filtroFecha, setFiltroFecha] = useState('dia');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? '#141414' : '#EDF2F7',
      },
      headerTintColor: isDarkMode ? '#F5F5F5' : '#333',
    });
  }, [navigation, isDarkMode]);

  const cargarHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const historial = await tripService.getTripHistory();
      setHistorialViajes(historial);
      await AsyncStorage.setItem('historialViajes', JSON.stringify(historial));
    } catch (error) {
      console.error('Error al cargar el historial:', error);
      setError(error.message);
      const historialActual = await AsyncStorage.getItem('historialViajes');
      if (historialActual) {
        setHistorialViajes(JSON.parse(historialActual));
      } else {
        setHistorialViajes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      cargarHistorial();
    }, [])
  );

  const filtrarViajes = () => {
    if (filtro === 'TODO') return historialViajes;
    return historialViajes.filter((viaje) => viaje.plataforma === filtro);
  };

  const calcularNeto = (item) => {
    const montoCobrado = parseFloat(item.montoCobrado) || 0;
    const comision = parseFloat(item.comision) || 0;
    const costoMantPorViaje = parseFloat(item.costoMantPorViaje) || 0;
    const costoCtaPorViaje = parseFloat(item.costoCtaPorViaje) || 0;
    const costoSeguroPorViaje = parseFloat(item.costoSeguroPorViaje) || 0;
    const costoCelPorViaje = parseFloat(item.costoCelPorViaje) || 0;
    const costoGasolina = parseFloat(item.costoGasolina) || 0;
    return (
      montoCobrado -
      comision -
      costoMantPorViaje -
      costoCtaPorViaje -
      costoSeguroPorViaje -
      costoCelPorViaje -
      costoGasolina
    ).toFixed(2);
  };

  const agruparPorFecha = (viajes) => {
    return viajes.reduce((acc, viaje) => {
      const fechaFormateada = format(parse(viaje.endDate, 'dd/MM/yyyy', new Date()), 'dd/MM/yyyy');
      if (!acc[fechaFormateada]) {
        acc[fechaFormateada] = [];
      }
      acc[fechaFormateada].push(viaje);
      return acc;
    }, {});
  };

  const filtrarPorFecha = (viajes) => {
    return viajes.filter((viaje) => {
      const fechaViaje = parse(viaje.endDate, 'dd/MM/yyyy', new Date());
      const today = new Date();
      switch (filtroFecha) {
        case 'dia':
          return fechaViaje.toDateString() === today.toDateString();
        case 'semana':
          const inicioSemana = startOfWeek(today, { weekStartsOn: 1 });
          const finSemana = endOfWeek(today, { weekStartsOn: 1 });
          return fechaViaje >= inicioSemana && fechaViaje <= finSemana;
        case 'mes':
          return fechaViaje.getMonth() === today.getMonth() && fechaViaje.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('DetailScreen', { viaje: item })}>
      <View style={[styles.viajeContainer, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5' }]}>
        <View style={styles.viajeHeader}>
          <Text style={[styles.infoTitle, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
            <Text style={[styles.valorGrande, { color: isDarkMode ? '#FFA41F' : '#FFA41F' }]}>{item.id}</Text>
          </Text>
          <Text style={[styles.infoDate, { color: isDarkMode ? '#FFA41F' : '#888' }]}>
            Fecha: <Text style={styles.valorGrande}>{item.endDate}</Text>
          </Text>
        </View>
        <View style={[styles.separator, { backgroundColor: isDarkMode ? '#EDF2F7' : '#FFA41F' }]} />
        <View style={styles.viajeBody}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '45%', alignItems: 'center' }}>
              <Text style={[styles.infoSmall, { color: isDarkMode ? '#ccc' : '#555' }]}>Monto Cobrado:</Text>
              <Text style={[styles.montoText, { color: isDarkMode ? '#FFA41F' : '#FFA41F' }]}>${parseFloat(item.montoCobrado).toFixed(2)}</Text>
            </View>
            <View style={{ width: '45%', alignItems: 'center' }}>
              <Text style={[styles.infoSmall, { color: isDarkMode ? '#ccc' : '#555' }]}>Neto:</Text>
              <Text style={[styles.netoValue, { color: isDarkMode ? '#FFA41F' : '#FFA41F' }]}>${calcularNeto(item)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGroup = (fecha, viajesDelDia, index) => {
    const cantidadViajes = viajesDelDia.length;
    const sumaMontos = viajesDelDia.reduce((total, viaje) => total + parseFloat(viaje.montoCobrado || 0), 0);
    const sumaNetos = viajesDelDia.reduce((total, viaje) => total + (isNaN(calcularNeto(viaje)) ? 0 : parseFloat(calcularNeto(viaje))), 0);
    const formatoSuma = (valor) => (isNaN(valor) ? 0 : valor).toFixed(2);

    return (
      <View key={index} style={styles.groupContainer}>
        <View style={[styles.groupHeader, { backgroundColor: isDarkMode ? '#14161e' : '#e3e3e3' }]}>
          <Text style={[styles.groupHeaderText, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>{fecha}</Text>
          <Text style={[styles.groupHeaderText, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            Viajes: {cantidadViajes}
          </Text>
          <Text style={[styles.groupHeaderText, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            Cobrado: ${formatoSuma(sumaMontos)}
          </Text>
          <Text style={[styles.groupHeaderText, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            Neto: ${formatoSuma(sumaNetos)}
          </Text>
        </View>
        <FlatList
          data={viajesDelDia}
          renderItem={({ item }) => renderItem({ item })}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#141414' : '#f9f9f9' }]}>
      <LoadingError loading={loading} error={error} />
      <Text style={[styles.title, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>Historial de Viajes</Text>

      <View style={styles.filterContainer}>
        {['TODO', 'UBER', 'INDRIVE', 'LIBRE'].map((tipo) => (
          <TouchableOpacity
            key={tipo}
            style={[
              styles.filterButton,
              {
                backgroundColor: filtro === tipo ? '#FFA41F' : (isDarkMode ? '#14161e' : '#F5F5F5'),
              },
            ]}
            onPress={() => setFiltro(tipo)}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: filtro === tipo ? '#F5F5F5' : (isDarkMode ? '#F5F5F5' : '#141613'),
                },
              ]}
            >
              {tipo}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterContainer}>
        {['dia', 'semana', 'mes'].map((filtroItem) => (
          <TouchableOpacity
            key={filtroItem}
            style={[
              styles.filterButton,
              {
                backgroundColor: filtroFecha === filtroItem ? '#FFA41F' : (isDarkMode ? '#14161e' : '#F5F5F5'),
              },
            ]}
            onPress={() => setFiltroFecha(filtroItem)}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: filtroFecha === filtroItem ? '#F5F5F5' : (isDarkMode ? '#F5F5F5' : '#141613'),
                },
              ]}
            >
              {filtroItem === 'dia' ? 'Día' : filtroItem === 'semana' ? 'Semana' : 'Mes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtroFecha === 'semana' ? Object.keys(agruparPorFecha(filtrarViajes())) : filtrarPorFecha(filtrarViajes())}
        renderItem={({ item, index }) => {
          if (filtroFecha === 'semana') {
            const viajesDelDia = agruparPorFecha(filtrarViajes())[item];
            return renderGroup(item, viajesDelDia, index);
          } else {
            return renderItem({ item });
          }
        }}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>No hay registros</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  filterButton: {
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupContainer: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 5,
  },
  groupHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viajeContainer: {
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viajeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: '50%',
  },
  infoDate: {
    fontSize: 10,
    fontWeight: '400',
    maxWidth: '50%',
    textAlign: 'right',
  },
  separator: {
    height: 3,
    marginVertical: 3,
  },
  viajeBody: {
    marginTop: 10,
    paddingTop: 5,
  },
  infoSmall: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: -15,
  },
  valorGrande: {
    fontSize: 12,
    fontWeight: '600',
  },
  montoText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  netoValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default HistorialScreen;