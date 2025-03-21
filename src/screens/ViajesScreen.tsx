import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ViajesScreen = () => {
  const [totalesPorFecha, setTotalesPorFecha] = useState<any[]>([]);  // Para almacenar los totales de gastos por fecha

  // Cargar los totales de gastos por fecha desde AsyncStorage
  useEffect(() => {
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
  }, []);

  // Función para organizar los datos por fecha
  const organizarPorFecha = (datos) => {
    return datos.reduce((result, item) => {
      const fecha = item.fecha;
      if (!result[fecha]) {
        result[fecha] = { fecha, viajes: [], totales: {} };
      }
      result[fecha].viajes.push(item);
      return result;
    }, {});
  };

  // Filtrar los viajes (aquí puedes agregar cualquier filtro que necesites)
  const filtrarViajes = () => {
    // Aquí podrías añadir lógica para filtrar los viajes si es necesario
    return viajesData;  // 'viajesData' debe ser un array de objetos de viajes
  };

  // Encontrar el total de los gastos para cada fecha
  const obtenerTotalGastosDia = (fecha) => {
    const totalGastos = totalesPorFecha.find((totales) => totales.fecha === fecha);
    return totalGastos ? totalGastos.total : 0;  // Devolver el total de la fecha o 0 si no se encuentra
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={organizarPorFecha(filtrarViajes())}
        renderItem={({ item }) => (
          <View style={styles.fechaContainer}>
            {/* Título de la fecha */}
            <Text style={styles.fechaTitle}>
              {item.fecha} - Viajes: {item.viajes.length} - Neto: ${item.totales.neto.toFixed(2)}
            </Text>

            {/* Contenedor de totales */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>Monto Cobrado: ${item.totales.montoCobrado.toFixed(2)}</Text>
              <Text style={styles.summaryText}>Kilometraje: {item.totales.kilometraje.toFixed(2)} km</Text>
              <Text style={styles.summaryText}>Comisión: ${item.totales.comision.toFixed(2)}</Text>
              <Text style={styles.summaryText}>Gastos Fijos: ${item.totales.gastosFijos.toFixed(2)}</Text>
              <Text style={styles.summaryText}>Tiempo Total: {Math.floor(item.totales.duracionTotal / 60)}h {item.totales.duracionTotal % 60}m</Text>
              <Text style={styles.summaryText}>Costo por Km: ${calcularCostoPorKm(item.totales)}</Text>
              <Text style={styles.summaryText}>Gastos del Día: ${obtenerTotalGastosDia(item.fecha)}</Text> {/* Mostrar el total de gastos del día */}
            </View>

            {/* Lista de Detalles del Viaje */}
            <FlatList
              data={item.viajes}
              renderItem={renderItem}
              keyExtractor={(viaje) => viaje.id}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        )}
        keyExtractor={(item) => item.fecha}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  fechaContainer: {
    marginBottom: 20,
  },
  fechaTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  summaryContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  summaryText: {
    fontSize: 16,
    marginVertical: 5,
  },
  listContainer: {
    marginTop: 10,
  },
});

export default ViajesScreen;
