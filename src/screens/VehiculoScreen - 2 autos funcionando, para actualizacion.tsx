import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Button, Switch, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";
import { useTheme } from '../context/ThemeContext';

const VehiculoScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();

  // Plantilla inicial para un vehículo vacío
  const initialVehiculo = {
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
  };

  const [vehiculos, setVehiculos] = useState([]); // Lista de vehículos
  const [isAdding, setIsAdding] = useState(false); // Controla la visibilidad del formulario
  const [newVehiculo, setNewVehiculo] = useState(initialVehiculo); // Estado del formulario
  const [selectedIndex, setSelectedIndex] = useState(null); // Índice del vehículo seleccionado

  // Configura la barra superior según el modo oscuro/claro
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? '#141414' : '#F5F5F5',
      },
      headerTintColor: isDarkMode ? '#F5F5F5' : '#333',
    });
  }, [navigation, isDarkMode]);

  // Carga datos desde AsyncStorage al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedVehiculos = await AsyncStorage.getItem("vehiculos");
        const storedSelectedIndex = await AsyncStorage.getItem("selectedVehiculoIndex");
        if (storedVehiculos) {
          setVehiculos(JSON.parse(storedVehiculos));
        }
        if (storedSelectedIndex !== null) {
          setSelectedIndex(parseInt(storedSelectedIndex, 10));
        }
      } catch (error) {
        console.log("Error al cargar datos:", error);
      }
    };
    loadData();
  }, []);

  // Valida que todos los campos estén completos
  const isFormValid = () => {
    return (
      newVehiculo.marca.trim() &&
      newVehiculo.modelo.trim() &&
      newVehiculo.anio.trim() &&
      newVehiculo.consumo.trim() &&
      newVehiculo.costoMantenimiento.trim() &&
      newVehiculo.costoSeguro.trim() &&
      newVehiculo.kmRecorridos.trim() &&
      newVehiculo.rentaCelular.trim() &&
      (newVehiculo.pagaCuenta ? newVehiculo.montoCuenta.trim() : true)
    );
  };

  // Guarda un nuevo vehículo
  const handleSaveVehiculo = async () => {
    if (!isFormValid()) {
      Alert.alert("Error", "Por favor, completa todos los campos requeridos.");
      return;
    }
    if (vehiculos.length >= 2) return; // Máximo 2 vehículos
    const updatedVehiculos = [...vehiculos, { ...newVehiculo }];
    setVehiculos(updatedVehiculos);
    setIsAdding(false);
    setNewVehiculo(initialVehiculo); // Resetea el formulario
    setSelectedIndex(updatedVehiculos.length - 1); // Selecciona el nuevo vehículo

    try {
      await AsyncStorage.setItem("vehiculos", JSON.stringify(updatedVehiculos));
      await AsyncStorage.setItem("selectedVehiculoIndex", (updatedVehiculos.length - 1).toString());
      await AsyncStorage.setItem("vehiculo", JSON.stringify(updatedVehiculos[updatedVehiculos.length - 1])); // Vinculación con otras pantallas
    } catch (error) {
      console.log("Error al guardar vehículo:", error);
    }
  };

  // Edita un vehículo existente
  const handleEdit = (index) => {
    setIsAdding(true);
    setNewVehiculo({ ...vehiculos[index] });
    setVehiculos(vehiculos.filter((_, i) => i !== index)); // Remueve temporalmente para edición
  };

  // Elimina un vehículo con confirmación
  const handleDelete = (index) => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que deseas eliminar este vehículo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const updatedVehiculos = vehiculos.filter((_, i) => i !== index);
            let newSelectedIndex = selectedIndex;

            if (index === selectedIndex) {
              newSelectedIndex = updatedVehiculos.length > 0 ? 0 : null; // Selecciona el primero si hay vehículos
            } else if (index < selectedIndex) {
              newSelectedIndex -= 1; // Ajusta el índice si el eliminado estaba antes del seleccionado
            }

            setVehiculos(updatedVehiculos);
            setSelectedIndex(newSelectedIndex);

            try {
              await AsyncStorage.setItem("vehiculos", JSON.stringify(updatedVehiculos));
              await AsyncStorage.setItem("selectedVehiculoIndex", newSelectedIndex !== null ? newSelectedIndex.toString() : null);
              await AsyncStorage.setItem("vehiculo", JSON.stringify(updatedVehiculos.length > 0 ? updatedVehiculos[newSelectedIndex || 0] : {}));
            } catch (error) {
              console.log("Error al eliminar vehículo:", error);
            }
          },
        },
      ]
    );
  };

  // Selecciona un vehículo (despliega o colapsa)
  const handleSelect = async (index) => {
    let newSelectedIndex = index;
    if (selectedIndex === index) {
      newSelectedIndex = null; // Colapsa si ya está seleccionado
    }
    setSelectedIndex(newSelectedIndex);
    try {
      await AsyncStorage.setItem("selectedVehiculoIndex", newSelectedIndex !== null ? newSelectedIndex.toString() : null);
      await AsyncStorage.setItem("vehiculo", JSON.stringify(newSelectedIndex !== null ? vehiculos[newSelectedIndex] : {}));
    } catch (error) {
      console.log("Error al seleccionar vehículo:", error);
    }
  };

  // Renderiza el formulario para agregar/editar un vehículo
  const renderForm = () => (
    <View style={[styles.formContainer, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5' }]}>
      <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Agregar Vehículo</Text>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Marca:</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#fff', color: isDarkMode ? '#F5F5F5' : '#000' }]}
          value={newVehiculo.marca}
          onChangeText={(text) => setNewVehiculo({ ...newVehiculo, marca: text })}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Modelo:</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#fff', color: isDarkMode ? '#F5F5F5' : '#000' }]}
          value={newVehiculo.modelo}
          onChangeText={(text) => setNewVehiculo({ ...newVehiculo, modelo: text })}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Año:</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#fff', color: isDarkMode ? '#F5F5F5' : '#000' }]}
          value={newVehiculo.anio}
          onChangeText={(text) => setNewVehiculo({ ...newVehiculo, anio: text })}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Consumo (L/100 km):</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#fff', color: isDarkMode ? '#F5F5F5' : '#000' }]}
          value={newVehiculo.consumo}
          onChangeText={(text) => setNewVehiculo({ ...newVehiculo, consumo: text })}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Kilómetros Recorridos:</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#fff', color: isDarkMode ? '#F5F5F5' : '#000' }]}
          value={newVehiculo.kmRecorridos}
          onChangeText={(text) => setNewVehiculo({ ...newVehiculo, kmRecorridos: text })}
          keyboardType="numeric"
        />
      </View>
      <Text style={[styles.subSectionTitle, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Gastos Fijos:</Text>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Costo de Mantenimiento (5000km):</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#fff', color: isDarkMode ? '#F5F5F5' : '#000' }]}
          value={newVehiculo.costoMantenimiento}
          onChangeText={(text) => setNewVehiculo({ ...newVehiculo, costoMantenimiento: text })}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Seguro Mensual:</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#fff', color: isDarkMode ? '#F5F5F5' : '#000' }]}
          value={newVehiculo.costoSeguro}
          onChangeText={(text) => setNewVehiculo({ ...newVehiculo, costoSeguro: text })}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Renta Cel. Mensual:</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#fff', color: isDarkMode ? '#F5F5F5' : '#000' }]}
          value={newVehiculo.rentaCelular}
          onChangeText={(text) => setNewVehiculo({ ...newVehiculo, rentaCelular: text })}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Paga Cuenta / Letra?:</Text>
        <Switch
          value={newVehiculo.pagaCuenta}
          onValueChange={(value) => setNewVehiculo({ ...newVehiculo, pagaCuenta: value })}
          trackColor={{ true: '#FF7F50', false: '#14161e' }}
          thumbColor={isDarkMode ? '#F5F5F5' : '#141414'}
        />
      </View>
      {newVehiculo.pagaCuenta && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: isDarkMode ? '#FF7F50' : '#333' }]}>Monto Cuenta o Letra Mensual:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#fff', color: isDarkMode ? '#F5F5F5' : '#000' }]}
            value={newVehiculo.montoCuenta}
            onChangeText={(text) => setNewVehiculo({ ...newVehiculo, montoCuenta: text })}
            keyboardType="numeric"
          />
        </View>
      )}
      <Button title="Registrar Vehículo" onPress={handleSaveVehiculo} color={isDarkMode ? '#FF7F50' : '#141414'} />
    </View>
  );

  // Renderiza un vehículo en modo visualización (colapsable)
  const renderVehiculo = (vehiculo, index) => (
    <View
      key={index}
      style={[
        styles.card,
        { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5' },
        selectedIndex === index ? styles.selectedCard : null,
      ]}
    >
      <TouchableOpacity onPress={() => handleSelect(index)} style={styles.headerContainer}>
        <Icon name="car" size={24} color={isDarkMode ? '#FF7F50' : '#333'} style={styles.icon} />
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>Vehículo {index + 1}</Text>
      </TouchableOpacity>
      {selectedIndex === index && (
        <>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={() => handleEdit(index)} style={styles.iconButton}>
              <Icon name="pencil" size={24} color={isDarkMode ? '#FF7F50' : 'blue'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(index)} style={styles.iconButton}>
              <Icon name="times" size={24} color={isDarkMode ? '#FF7F50' : 'red'} />
            </TouchableOpacity>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Text style={[styles.boldText, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Marca:</Text> {vehiculo.marca || "No definido"}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Text style={[styles.boldText, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Modelo:</Text> {vehiculo.modelo || "No definido"}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Text style={[styles.boldText, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Año:</Text> {vehiculo.anio || "No definido"}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Text style={[styles.boldText, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Consumo:</Text> {vehiculo.consumo ? `${vehiculo.consumo} L/100 km` : "No definido"}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Text style={[styles.boldText, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Kilómetros Recorridos:</Text> {vehiculo.kmRecorridos ? `${vehiculo.kmRecorridos} km` : "No definido"}
            </Text>
            <Text style={[styles.subSectionTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>Gastos Fijos:</Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Text style={[styles.boldText, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Costo de Mantenimiento:</Text> {vehiculo.costoMantenimiento ? `$${vehiculo.costoMantenimiento}` : "No definido"}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Text style={[styles.boldText, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Seguro Mensual:</Text> {vehiculo.costoSeguro ? `$${vehiculo.costoSeguro}` : "No definido"}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Text style={[styles.boldText, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Renta Celular:</Text> {vehiculo.rentaCelular ? `$${vehiculo.rentaCelular}` : "No definido"}
            </Text>
            <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
              <Text style={[styles.boldText, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Paga Cuenta/Letra:</Text> {vehiculo.pagaCuenta ? "Sí" : "No"}
            </Text>
            {vehiculo.pagaCuenta && (
              <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#000' }]}>
                <Text style={[styles.boldText, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Monto Mensual:</Text> {vehiculo.montoCuenta ? `$${vehiculo.montoCuenta}` : "No definido"}
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDarkMode ? '#141414' : '#f9f9f9' }]}>
      <Text style={[styles.autoTitle, { color: isDarkMode ? '#FF7F50' : '#000' }]}>Mis Vehículos</Text>

      {vehiculos.length === 0 && !isAdding ? (
        <Button
          title="Agregar Vehículo"
          onPress={() => setIsAdding(true)}
          color={isDarkMode ? '#FF7F50' : '#141414'}
        />
      ) : (
        <>
          {vehiculos.map((vehiculo, index) => renderVehiculo(vehiculo, index))}
          {vehiculos.length < 2 && !isAdding && (
            <Button
              title="Agregar Nuevo Vehículo"
              onPress={() => setIsAdding(true)}
              color={isDarkMode ? '#FF7F50' : '#141414'}
            />
          )}
        </>
      )}

      {isAdding && renderForm()}
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
  formContainer: {
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  inputGroup: {
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
  selectedCard: {
    borderWidth: 2,
    borderColor: "#FF7F50",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    marginRight: 10,
  },
  detailsContainer: {
    marginTop: 10,
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