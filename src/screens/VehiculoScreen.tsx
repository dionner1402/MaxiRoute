import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Button, Switch, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";
import { useTheme } from '../context/ThemeContext';

const VehiculoScreen = ({ navigation }) => {
  const [vehiculo, setVehiculo] = useState({
    marca: "",
    modelo: "",
    anio: "",
    consumo: "",
    costoMantenimiento: "",
    costoSeguro: "",
    kmRecorridos: "",
    pagaCuenta: false,
    montoCuenta: "",
    rentaCelular: "",
  });

  const [isEditMode, setIsEditMode] = useState(true);
  const { isDarkMode } = useTheme();

  // Configurar la barra superior según el modo claro/oscuro
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? '#141414' : '#F5F5F5',
      },
      headerTintColor: isDarkMode ? '#F5F5F5' : '#333',
    });
  }, [navigation, isDarkMode]);

  // Cargar datos desde AsyncStorage al iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedVehiculo = await AsyncStorage.getItem("vehiculo");
        const storedEditMode = await AsyncStorage.getItem("isEditMode");

        if (storedVehiculo) setVehiculo(JSON.parse(storedVehiculo));
        if (storedEditMode !== null) setIsEditMode(JSON.parse(storedEditMode));
      } catch (error) {
        console.log("Error al cargar los datos:", error);
      }
    };
    loadData();
  }, []);

  // Validar que todos los campos estén completos
  const isFormValid = () => {
    return (
      vehiculo.marca.trim() &&
      vehiculo.modelo.trim() &&
      vehiculo.anio.trim() &&
      vehiculo.consumo.trim() &&
      vehiculo.costoMantenimiento.trim() &&
      vehiculo.costoSeguro.trim() &&
      vehiculo.kmRecorridos.trim() &&
      vehiculo.rentaCelular.trim() &&
      (vehiculo.pagaCuenta ? vehiculo.montoCuenta.trim() : true)
    );
  };

  // Guardar el vehículo en AsyncStorage
  const handleSaveVehiculo = async () => {
    if (!isFormValid()) {
      Alert.alert("Error", "Todos los campos son obligatorios.");
      return;
    }
    try {
      await AsyncStorage.setItem("vehiculo", JSON.stringify(vehiculo));
      await AsyncStorage.setItem("isEditMode", JSON.stringify(false));
      setIsEditMode(false);
    } catch (error) {
      console.log("Error al guardar vehículo:", error);
    }
  };

  // Activar modo edición
  const handleEdit = () => {
    setIsEditMode(true);
    AsyncStorage.setItem("isEditMode", JSON.stringify(true));
  };

  // Eliminar el vehículo con confirmación
  const handleDelete = () => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que deseas eliminar este vehículo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("vehiculo");
              await AsyncStorage.setItem("isEditMode", JSON.stringify(true));
              setVehiculo({
                marca: "",
                modelo: "",
                anio: "",
                consumo: "",
                costoMantenimiento: "",
                costoSeguro: "",
                kmRecorridos: "",
                pagaCuenta: false,
                montoCuenta: "",
                rentaCelular: "",
              });
              setIsEditMode(true);
            } catch (error) {
              console.log("Error al eliminar vehículo:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDarkMode ? '#141414' : '#f9f9f9' }]}>
      <Text style={[styles.autoTitle, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Mi Auto</Text>

      {isEditMode ? (
        // Modo Edición
        <>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Características del Vehículo:</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Marca:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#000' }]}
              value={vehiculo.marca}
              onChangeText={(text) => setVehiculo({ ...vehiculo, marca: text })}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Modelo:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#000' }]}
              value={vehiculo.modelo}
              onChangeText={(text) => setVehiculo({ ...vehiculo, modelo: text })}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Año:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#000' }]}
              value={vehiculo.anio}
              onChangeText={(text) => setVehiculo({ ...vehiculo, anio: text })}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Consumo (L/100 km):</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#000' }]}
              value={vehiculo.consumo}
              onChangeText={(text) => setVehiculo({ ...vehiculo, consumo: text })}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Kilómetros Recorridos:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#000' }]}
              value={vehiculo.kmRecorridos}
              onChangeText={(text) => setVehiculo({ ...vehiculo, kmRecorridos: text })}
              keyboardType="numeric"
            />
          </View>

          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Gastos Fijos:</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Costo de Mantenimiento (5000km):</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#000' }]}
              value={vehiculo.costoMantenimiento}
              onChangeText={(text) => setVehiculo({ ...vehiculo, costoMantenimiento: text })}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Seguro Mensual:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#000' }]}
              value={vehiculo.costoSeguro}
              onChangeText={(text) => setVehiculo({ ...vehiculo, costoSeguro: text })}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Renta Cel. Mensual:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#000' }]}
              value={vehiculo.rentaCelular}
              onChangeText={(text) => setVehiculo({ ...vehiculo, rentaCelular: text })}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.switchGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Paga Cuenta / Letra?:</Text>
            <Switch
              value={vehiculo.pagaCuenta}
              onValueChange={(value) => setVehiculo({ ...vehiculo, pagaCuenta: value })}
              trackColor={{ true: '#FFA41F', false: '#ccc' }}
              thumbColor={vehiculo.pagaCuenta ? '#FFA41F' : (isDarkMode ? '#F5F5F5' : '#141414')}
            />
          </View>
          {vehiculo.pagaCuenta && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Monto Cuenta o Letra Mensual:</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#000' }]}
                value={vehiculo.montoCuenta}
                onChangeText={(text) => setVehiculo({ ...vehiculo, montoCuenta: text })}
                keyboardType="numeric"
              />
            </View>
          )}
          <Button title="Guardar Vehículo" onPress={handleSaveVehiculo} color={isDarkMode ? '#FFA41F' : '#141414'} />
        </>
      ) : (
        // Modo Visualización
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5' }]}>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={handleEdit} style={styles.iconButton}>
              <Icon name="pencil" size={24} color={isDarkMode ? '#FFA41F' : 'blue'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
              <Icon name="times" size={24} color={isDarkMode ? '#FFA41F' : 'red'} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>Características del Vehículo:</Text>
          <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
            <Text style={[styles.boldText, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Marca:</Text> {vehiculo.marca}
          </Text>
          <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
            <Text style={[styles.boldText, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Modelo:</Text> {vehiculo.modelo}
          </Text>
          <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
            <Text style={[styles.boldText, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Año:</Text> {vehiculo.anio}
          </Text>
          <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
            <Text style={[styles.boldText, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Consumo:</Text> {vehiculo.consumo} L/100 km
          </Text>
          <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
            <Text style={[styles.boldText, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Kilómetros Recorridos:</Text> {vehiculo.kmRecorridos} km
          </Text>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>Gastos Fijos:</Text>
          <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
            <Text style={[styles.boldText, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Costo de Mantenimiento:</Text> ${vehiculo.costoMantenimiento}
          </Text>
          <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
            <Text style={[styles.boldText, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Seguro Mensual:</Text> ${vehiculo.costoSeguro}
          </Text>
          <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
            <Text style={[styles.boldText, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Renta Celular:</Text> {vehiculo.rentaCelular ? `$${vehiculo.rentaCelular}` : "No disponible"}
          </Text>
          <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
            <Text style={[styles.boldText, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Paga Cuenta/Letra:</Text> {vehiculo.pagaCuenta ? "Sí" : "No"}
          </Text>
          {vehiculo.pagaCuenta && (
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Text style={[styles.boldText, { color: isDarkMode ? '#FFA41F' : '#000' }]}>Monto Mensual:</Text> ${vehiculo.montoCuenta}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  autoTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  switchGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
  boldText: {
    fontWeight: "bold",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  iconButton: {
    marginLeft: 10,
  },
});

export default VehiculoScreen;