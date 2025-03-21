import React, { useState, useEffect, } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Button, Switch, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider, useTheme } from "../context/ThemeContext"; // Usar el contexto de tema
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler, Alert } from 'react-native';



const VehiculoScreen = ({ navigation, route }: any) => {
  const { isDarkMode, toggleTheme } = useTheme(); // Usar el estado de tema
  const [vehiculo, setVehiculo] = useState<any>({
    marca: "",
    modelo: "",
    anio: "",
    consumo: "",
    costoMantenimiento: "",
    costoSeguro: "",
    kmRecorridos: "",
    pagaCuenta: false,
    montoCuenta: "",
    rentaCelular: "", // Nuevo campo para renta celular
  });

  const [isEditMode, setIsEditMode] = useState(true); // Controla si estamos en modo edición o visualización

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
  
    // Configurar la barra superior según el modo claro/oscuro
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? '#EDF2F7' : '#F5F5F5', // Cambia el fondo de la barra superior
      },
      headerTintColor: isDarkMode ? '#F5F5F5' : '#333', // Cambia el color del texto de la barra superior
    });
  }, [navigation, isDarkMode]);
  
  
  useEffect(() => {
  const loadVehiculoData = async () => {
    const storedVehiculo = await AsyncStorage.getItem("vehiculo");
    if (storedVehiculo) {
      setVehiculo(JSON.parse(storedVehiculo));
    }
  };

  loadVehiculoData();
}, []);

  // Guardar el vehículo y el estado de edición en AsyncStorage
  const handleSaveVehiculo = async () => {
    try {
      await AsyncStorage.setItem("vehiculo", JSON.stringify(vehiculo));
      await AsyncStorage.setItem("isEditMode", JSON.stringify(false)); // Cambiar a modo visualización
      setIsEditMode(false); // Cambiar a modo visualización
    } catch (error) {
      console.log("Error al guardar vehículo:", error);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true); // Cambiar a modo edición
    AsyncStorage.setItem("isEditMode", JSON.stringify(true)); // Guardar el estado en AsyncStorage
  };

  const handleDelete = async () => {
  try {
    await AsyncStorage.removeItem("vehiculo");
    await AsyncStorage.setItem("isEditMode", JSON.stringify(true)); // Cambiar a modo edición al eliminar
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
      rentaCelular: "", // Limpiar el campo de renta celular
    });
    setIsEditMode(true); // Cambiar a modo edición
  } catch (error) {
    console.log("Error al eliminar vehículo:", error);
  }
};
  
 
  // Verificar si hay cambios no guardados antes de salir
useFocusEffect(
  React.useCallback(() => {
    const onBackPress = async () => {
      try {
        // Obtener el vehículo guardado en AsyncStorage
        const storedVehiculo = await AsyncStorage.getItem("vehiculo");
        const parsedStoredVehiculo = storedVehiculo ? JSON.parse(storedVehiculo) : null;

        // Comparar el estado actual con el guardado
        const hasUnsavedChanges =
          JSON.stringify(parsedStoredVehiculo) !== JSON.stringify(vehiculo);

        // Solo mostrar alerta si hay cambios no guardados y estamos en modo edición
        if (isEditMode && hasUnsavedChanges) {
          Alert.alert(
            "¿Estás seguro?",
            "Tienes cambios sin guardar. ¿Estás seguro que deseas salir sin guardar?",
            [
              {
                text: "Cancelar",
                style: "cancel",
                onPress: () => setIsEditMode(true), // Regresa al modo edición
              },
              {
                text: "Guardar y Salir",
                onPress: () => {
                  handleSaveVehiculo(); // Guarda los cambios
                },
              },
            ]
          );
          return true; // Detiene la navegación por defecto
        }
      } catch (error) {
        console.log("Error al verificar cambios:", error);
      }
      return false; // Permitir navegar si no hay cambios
    };

    // Añadir el listener al botón de retroceso
    BackHandler.addEventListener("hardwareBackPress", onBackPress);

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    };
  }, [isEditMode, vehiculo, navigation])
);


  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDarkMode ? '#EDF2F7' : '#F5F5F5' }]}>
      {/* Título */}
      <Text style={[styles.autoTitle, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>Mi Vehiculo</Text>

      {/* Características del Vehículo */}
      <View style={[styles.sectionContainer, { backgroundColor: isDarkMode ? '#14161e' : '#f4f4f4' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>{/* Encabezado */}
          <Icon name="car-sport" size={20} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de coche */}
		   Características del Vehículo:
        </Text>
        {isEditMode ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>Marca:</Text>
              <TextInput
                style={[styles.input, { borderColor: isDarkMode ? '#FFA41F' : '#000', backgroundColor: isDarkMode ? '#EDF2F7' : '#f4f4f4', color: isDarkMode ? '#FFA41F' : '#000' }]}
                value={vehiculo.marca}
                onChangeText={(text) => setVehiculo({ ...vehiculo, marca: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>Modelo:</Text>
              <TextInput
style={[styles.input, { borderColor: isDarkMode ? '#FFA41F' : '#000', backgroundColor: isDarkMode ? '#EDF2F7' : '#f4f4f4', color: isDarkMode ? '#FFA41F' : '#000' }]}                
value={vehiculo.modelo}
                onChangeText={(text) => setVehiculo({ ...vehiculo, modelo: text })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>Año:</Text>
              <TextInput
style={[styles.input, { borderColor: isDarkMode ? '#FFA41F' : '#000', backgroundColor: isDarkMode ? '#EDF2F7' : '#f4f4f4', color: isDarkMode ? '#FFA41F' : '#000' }]}                
value={vehiculo.anio}
                onChangeText={(text) => setVehiculo({ ...vehiculo, anio: text })}
				keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>Consumo (L/100 km):</Text>
              <TextInput
style={[styles.input, { borderColor: isDarkMode ? '#FFA41F' : '#000', backgroundColor: isDarkMode ? '#EDF2F7' : '#f4f4f4', color: isDarkMode ? '#FFA41F' : '#000' }]}                
value={vehiculo.consumo}
                onChangeText={(text) => setVehiculo({ ...vehiculo, consumo: text })}
                keyboardType="numeric"
              />
            </View>
            
          </>
        ) : (
          <>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Icon name="layers" size={18} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de marca */}
              <Text style={styles.boldText}>Marca:</Text> {vehiculo.marca}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Icon name="layers" size={18} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de modelo */}
              <Text style={styles.boldText}>Modelo:</Text> {vehiculo.modelo}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Icon name="calendar" size={18} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de año */}
              <Text style={styles.boldText}>Año:</Text> {vehiculo.anio}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Icon name="flame" size={18} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de consumo */}
              <Text style={styles.boldText}>Consumo:</Text> {vehiculo.consumo} L/100 km
            </Text>
            
          </>
        )}
      </View>

      {/* Gastos Fijos */}
      <View style={[styles.sectionContainer, { backgroundColor: isDarkMode ? '#14161e' : '#f4f4f4' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
          <Icon name="cash" size={20} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de gastos */}
          Gastos Fijos:
        </Text>
        {isEditMode ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>Costo de Mantenimiento (5000km):</Text>
              <TextInput
style={[styles.input, { borderColor: isDarkMode ? '#FFA41F' : '#000', backgroundColor: isDarkMode ? '#EDF2F7' : '#f4f4f4', color: isDarkMode ? '#FFA41F' : '#000' }]}
                value={vehiculo.costoMantenimiento}
                onChangeText={(text) => setVehiculo({ ...vehiculo, costoMantenimiento: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>Seguro / Mes:</Text>
              <TextInput
style={[styles.input, { borderColor: isDarkMode ? '#FFA41F' : '#000', backgroundColor: isDarkMode ? '#EDF2F7' : '#f4f4f4', color: isDarkMode ? '#FFA41F' : '#000' }]}
                value={vehiculo.costoSeguro}
                onChangeText={(text) => setVehiculo({ ...vehiculo, costoSeguro: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>Renta Celular / Mes:</Text>
              <TextInput
style={[styles.input, { borderColor: isDarkMode ? '#FFA41F' : '#000', backgroundColor: isDarkMode ? '#EDF2F7' : '#f4f4f4', color: isDarkMode ? '#FFA41F' : '#000' }]}
                value={vehiculo.rentaCelular}
                onChangeText={(text) => setVehiculo({ ...vehiculo, rentaCelular: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>Paga Cuenta/Letra:</Text>
              <Switch
                value={vehiculo.pagaCuenta}
                onValueChange={(value) => setVehiculo({ ...vehiculo, pagaCuenta: value })}
                trackColor={{ false: "#767577", true: "#EDF2F7" }}
                thumbColor={vehiculo.pagaCuenta ? "#FFA41F" : "#EDF2F7"}
              />
            </View>
            {vehiculo.pagaCuenta && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>Monto / Mes:</Text>
                <TextInput
style={[styles.input, { borderColor: isDarkMode ? '#FFA41F' : '#000', backgroundColor: isDarkMode ? '#EDF2F7' : '#f4f4f4', color: isDarkMode ? '#FFA41F' : '#000' }]}
                  value={vehiculo.montoCuenta}
                  onChangeText={(text) => setVehiculo({ ...vehiculo, montoCuenta: text })}
                  keyboardType="numeric"
                />
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Icon name="pricetag" size={18} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de costo */}
              <Text style={styles.boldText}>Costo de Mantenimiento:</Text> ${vehiculo.costoMantenimiento}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Icon name="shield" size={18} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de seguro */}
              <Text style={styles.boldText}>Seguro:</Text> ${vehiculo.costoSeguro}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Icon name="phone-portrait" size={18} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de renta celular */}
              <Text style={styles.boldText}>Renta Celular:</Text> {vehiculo.rentaCelular ? $${vehiculo.rentaCelular} : "No disponible"}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Icon name="checkbox" size={18} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de paga cuenta */}
              <Text style={styles.boldText}>Paga Cuenta/Letra:</Text> {vehiculo.pagaCuenta ? "Sí" : "No"}
            </Text>
            {vehiculo.pagaCuenta && (
              <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
                <Icon name="cash" size={18} color={isDarkMode ? '#FFA41F' : '#000'} /> {/* Icono de monto semanal */}
                <Text style={styles.boldText}>Monto Semanal:</Text> ${vehiculo.montoCuenta}
              </Text>
            )}
          </>
        )}
      </View>


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
  sectionContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 0,
  },
  input: {
    height: 50,
    borderColor: "#FFA41F",
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 5,
    paddingHorizontal: 15,
    backgroundColor: "#EDF2F7",
    fontSize: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    padding: 10,
    
    marginBottom: 10,
	borderColor: "#FFA41F",
	borderWidth: 1,
	borderRadius: 20,
  },
  buttonText: {
    color: "#F5F5F5",
    textAlign: "center",
	
  },
});

export default VehiculoScreen;
