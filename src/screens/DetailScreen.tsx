import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const DetailScreen = ({ route, navigation }) => {
  const { viaje } = route.params || {};
  const { isDarkMode } = useTheme();
  const [mapImageUri, setMapImageUri] = useState(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);

  useEffect(() => {
    if (viaje && viaje.mapImageURI) {
      setMapImageUri(viaje.mapImageURI);
    }
    setIsLoadingMap(false);
  }, [viaje]);

  const navigateToMxcBalanceScreen = () => {
    if (viaje && viaje.minedMXC) {
      navigation.navigate('MxcBalanceScreen', { mxcData: viaje.minedMXC, tripId: viaje.id });
    } else {
      console.warn('No se encontraron datos de MXC para este viaje');
    }
  };

  if (!viaje) {
    return (
      <View style={styles(isDarkMode).container}>
        <Text style={styles(isDarkMode).title}>No se encontró el viaje</Text>
      </View>
    );
  }

  // Cálculo de neto
  const neto =
    parseFloat(viaje.montoCobrado) -
    parseFloat(viaje.comision) -
    parseFloat(viaje.costoGasolina) -
    parseFloat(viaje.costoMantPorViaje) -
    parseFloat(viaje.costoCtaPorViaje) -
    parseFloat(viaje.costoCelPorViaje) -
    parseFloat(viaje.costoSeguroPorViaje);

  const dynamicStyles = styles(isDarkMode);

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>Resumen del Viaje</Text>
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        <View style={dynamicStyles.receiptContainer}>
          {isLoadingMap ? (
            <Text style={dynamicStyles.infoText}>Cargando mapa...</Text>
          ) : mapImageUri ? (
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Ruta Recorrida</Text>
              <Image source={{ uri: mapImageUri }} style={dynamicStyles.mapImage} />
            </View>
          ) : (
            <Text style={dynamicStyles.infoText}>No hay mapa disponible</Text>
          )}

          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Información General</Text>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="info-circle" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Viaje ID: {viaje.id}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="car" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Plataforma: {viaje.plataforma}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="calendar-alt" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Fecha: {viaje.endDate}</Text>
            </View>
          </View>

          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Tiempo y Distancia</Text>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="clock" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Hora Inicio: {viaje.horaInicio}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="clock" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Hora Fin: {viaje.horaFin}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="hourglass-half" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Duración: {viaje.duracion}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="road" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Distancia: {viaje.distancia} km</Text>
            </View>
          </View>

          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Costos</Text>
            <View style={dynamicStyles.highlightBox}>
              <View style={dynamicStyles.row}>
                <FontAwesome5 name="money-bill-wave" size={20} style={dynamicStyles.icon} />
                <Text style={dynamicStyles.montoText}>Monto Cobrado: ${parseFloat(viaje.montoCobrado).toFixed(2)}</Text>
              </View>
            </View>
            <View style={dynamicStyles.costContainer}>
              <View style={dynamicStyles.costRow}>
                <Text style={dynamicStyles.restaText}>Comisión:</Text>
                <Text style={dynamicStyles.restaValue}>-${parseFloat(viaje.comision).toFixed(3)}</Text>
              </View>
              <View style={dynamicStyles.costRow}>
                <Text style={dynamicStyles.restaText}>Costo Gasolina:</Text>
                <Text style={dynamicStyles.restaValue}>-${parseFloat(viaje.costoGasolina).toFixed(3)}</Text>
              </View>
              <View style={dynamicStyles.costRow}>
                <Text style={dynamicStyles.restaText}>Costo Mant./Viaje:</Text>
                <Text style={dynamicStyles.restaValue}>-${parseFloat(viaje.costoMantPorViaje).toFixed(3)}</Text>
              </View>
              <View style={dynamicStyles.costRow}>
                <Text style={dynamicStyles.restaText}>Costo Cuenta:</Text>
                <Text style={dynamicStyles.restaValue}>-${parseFloat(viaje.costoCtaPorViaje).toFixed(3)}</Text>
              </View>
              <View style={dynamicStyles.costRow}>
                <Text style={dynamicStyles.restaText}>Costo Cel./Viaje:</Text>
                <Text style={dynamicStyles.restaValue}>-${parseFloat(viaje.costoCelPorViaje).toFixed(3)}</Text>
              </View>
              <View style={dynamicStyles.costRow}>
                <Text style={dynamicStyles.restaText}>Costo Seguro/Viaje:</Text>
                <Text style={dynamicStyles.restaValue}>-${parseFloat(viaje.costoSeguroPorViaje).toFixed(3)}</Text>
              </View>
            </View>
            <View style={dynamicStyles.deductionsContainer}>
              <Text style={dynamicStyles.deductionsText}>Deducciones:</Text>
              <Text style={dynamicStyles.deductionsValue}>
                ${(
                  parseFloat(viaje.comision) +
                  parseFloat(viaje.costoGasolina) +
                  parseFloat(viaje.costoMantPorViaje) +
                  parseFloat(viaje.costoCtaPorViaje) +
                  parseFloat(viaje.costoCelPorViaje) +
                  parseFloat(viaje.costoSeguroPorViaje)
                ).toFixed(2)}
              </Text>
            </View>
            <View style={dynamicStyles.highlightBox}>
              <View style={dynamicStyles.row}>
                <FontAwesome5 name="check-circle" size={20} style={dynamicStyles.icon} />
                <Text style={dynamicStyles.netoText}>Neto: ${neto.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={navigateToMxcBalanceScreen}>
            <View style={[dynamicStyles.section, dynamicStyles.touchableSection]}>
              <Text style={dynamicStyles.sectionTitle}>MXC GANADOS</Text>
              <View style={dynamicStyles.row}>
                <FontAwesome5 name="coins" style={dynamicStyles.icon} />
                <View>
                  <Text style={dynamicStyles.infoText}>MXC Minado: {viaje.minedMXC}</Text>
                  <Text style={dynamicStyles.subInfoText}>(pendiente de validación)</Text>
                </View>
                <FontAwesome5 name="chevron-right" style={dynamicStyles.arrowIcon} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Montos Base</Text>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="gas-pump" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Precio Gasolina: {viaje.precioGasolina}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="tachometer-alt" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Consumo (L/km): {viaje.consumo}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="tools" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Costo Mantenimiento: ${parseFloat(viaje.costoMantenimiento).toFixed(2)}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="wallet" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Pago Cuenta: ${parseFloat(viaje.pagoCuentaSemana).toFixed(2)}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="mobile-alt" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Renta Celular: ${parseFloat(viaje.rentaCelular).toFixed(2)}</Text>
            </View>
            <View style={dynamicStyles.row}>
              <FontAwesome5 name="shield-alt" style={dynamicStyles.icon} />
              <Text style={dynamicStyles.infoText}>Costo Seguro: ${parseFloat(viaje.costoSeguro).toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Estilos
const styles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkMode ? '#141414' : '#EDF2F7',
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 20,
      color: isDarkMode ? '#F5F5F5' : '#333',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    receiptContainer: {
      backgroundColor: isDarkMode ? '#1c1c1c' : '#ffffff',
      borderRadius: 12,
      padding: 20,
      shadowColor: isDarkMode ? '#000' : '#ccc',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    section: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#e0e0e0',
    },
    touchableSection: {
      backgroundColor: isDarkMode ? '#252525' : '#f5f8ff',
      borderRadius: 8,
      padding: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDarkMode ? '#FFA41F' : '#333',
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    icon: {
      marginRight: 12,
      color: isDarkMode ? '#FFA41F' : '#555',
      fontSize: 18,
    },
    arrowIcon: {
      marginLeft: 'auto',
      color: isDarkMode ? '#FFA41F' : '#555',
      fontSize: 18,
    },
    infoText: {
      fontSize: 16,
      color: isDarkMode ? '#bbb' : '#444',
    },
    subInfoText: {
      fontSize: 12,
      color: isDarkMode ? '#888' : '#666',
      marginTop: 2,
    },
    mapImage: {
      width: '100%',
      height: 200,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#e0e0e0',
    },
    highlightBox: {
      padding: 16,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#222' : '#f9f9f9',
      marginBottom: 12,
      alignItems: 'center',
    },
    costContainer: {
      marginBottom: 12,
    },
    costRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    restaText: {
      fontSize: 16,
      color: isDarkMode ? '#ff6666' : '#cc0000',
    },
    restaValue: {
      fontSize: 16,
      color: isDarkMode ? '#ff6666' : '#cc0000',
      fontWeight: '500',
    },
    deductionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#333' : '#FFA41F',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    deductionsText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFA41F' : '#EDF2F7',
    },
    deductionsValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFA41F' : '#EDF2F7',
    },
    montoText: {
      fontSize: 22,
      fontWeight: '600',
      color: isDarkMode ? '#FFA41F' : '#333',
    },
    netoText: {
      fontSize: 24,
      fontWeight: '700',
      color: isDarkMode ? '#FFA41F' : '#333',
    },
  });

export default DetailScreen;