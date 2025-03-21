import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Button } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons"; // Usando MaterialIcons
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext"; // Importar el contexto de tema

const ControlScreen = ({ navigation }: any) => {
  const { isDarkMode } = useTheme(); // Obtener el valor de isDarkMode desde el contexto

  const preciosGasolina = {
    "91": "$0.85",
    "95": "$0.88",
    "diésel": "$0.79",
  };

  const [plataforma, setPlataforma] = useState("UBER");
  const [tipoGasolina, setTipoGasolina] = useState("91");
  const [precioGasolina, setPrecioGasolina] = useState<string>("$0.85");
  const [vehiculo, setVehiculo] = useState<any>(null);
  const [lastTripDistance, setLastTripDistance] = useState<number>(0); // Inicializamos en 0
  const comisiones = {
    UBER: 10.0,
    INDRIVE: 12.99,
    Libre: 0.0,
  };


  
   // Configurar la barra superior según el modo claro/oscuro
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? '#141414' : '#EDF2F7', // Cambia el fondo de la barra superior
      },
      headerTintColor: isDarkMode ? '#FFA41F' : '#333', // Cambia el color del texto de la barra superior
    });
  }, [navigation, isDarkMode]);
  
  // Función para cargar datos desde AsyncStorage
  const loadData = async () => {
    try {
      const storedTipoGasolina = await AsyncStorage.getItem("tipoGasolina");
      const storedPlataforma = await AsyncStorage.getItem("plataforma");
      const storedVehiculo = await AsyncStorage.getItem("vehiculo");
      const storedLastTripDistance = await AsyncStorage.getItem("lastTripDistance");

      if (storedTipoGasolina) {
        setTipoGasolina(storedTipoGasolina);
        setPrecioGasolina(preciosGasolina[storedTipoGasolina]);
      } else {
        setTipoGasolina("91");
        setPrecioGasolina(preciosGasolina["91"]);
      }

      if (storedPlataforma) {
        setPlataforma(storedPlataforma);
      }

      if (storedVehiculo) {
        setVehiculo(JSON.parse(storedVehiculo));
      }
    } catch (error) {
      console.log("Error al recuperar datos:", error);
    }
  };

  const handleNavigateToVehiculo = () => {
    navigation.navigate('Vehiculo');  // Asegúrate de que 'Vehiculo' sea el nombre correcto de la pantalla
  };

  // Manejar el cambio de tipo de gasolina
  const handleGasolinaChange = (tipo: string) => {
    setTipoGasolina(tipo);
    setPrecioGasolina(preciosGasolina[tipo]);

    // Guardar el tipo de gasolina seleccionado en AsyncStorage
    AsyncStorage.setItem("tipoGasolina", tipo);
    AsyncStorage.setItem("precioGasolina", preciosGasolina[tipo]);
  };

  // Función para manejar el cambio de plataforma
  const handlePlataformaChange = async (itemValue: string) => {
    setPlataforma(itemValue);
    try {
      await AsyncStorage.setItem("plataforma", itemValue);
    } catch (error) {
      console.log("Error al guardar la plataforma:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      navigation.setOptions({
        title: "Area de Control", // O cualquier otra palabra que elijas
      });
    }, [])
  );

  // Sumar los kilómetros del último viaje
  const totalKmRecorridos = vehiculo ? vehiculo.kmRecorridos + lastTripDistance : lastTripDistance;

  const displayValue = (value: any) => {
    if (typeof value === "string" && value.trim() !== "") {
      return value; // Devuelve la cadena si no está vacía
    } else if (typeof value === "number" && !isNaN(value)) {
      return value; // Devuelve el número si es válido
    } else {
      return "-"; // Valor predeterminado si no es válido
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDarkMode ? '#141414' : '#EDF2F7' }]}>
      {/* Plataforma */}
      <View style={[styles.cardContainer, { backgroundColor: isDarkMode ? '#14161e' : '#f0f0f0' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
          <Icon name="business" size={18} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
          Selecciona la Plataforma
        </Text>
        <Picker
  selectedValue={plataforma}
  style={[
    styles.picker, 
    { 
      backgroundColor: isDarkMode ? '#141414' : '#EDF2F7', 
      color: isDarkMode ? '#FFA41F' : '#333' 
    }
  ]}
  onValueChange={handlePlataformaChange}
  dropdownIconColor={isDarkMode ? '#FFA41F' : '#333'}  // Aquí ajustamos el color de la flecha
>
  <Picker.Item label="Uber" value="UBER" />
  <Picker.Item label="InDrive" value="INDRIVE" />
  <Picker.Item label="Libre" value="LIBRE" />
</Picker>

        <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
          Comisión: <Text style={styles.value}>{comisiones[plataforma] ?? "0"}%</Text>
        </Text>
      </View>

      {/* Precios Promedio de Gasolina */}
      <View style={[styles.cardContainer, { backgroundColor: isDarkMode ? '#14161e' : '#f0f0f0' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
          <Icon name="local-gas-station" size={18} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
          Precios Promedio de Gasolina
        </Text>
        <Picker
          selectedValue={tipoGasolina}
          style={[styles.picker, { backgroundColor: isDarkMode ? '#141414' : '#EDF2F7', color: isDarkMode ? '#FFA41F' : '#333' }]}
          onValueChange={handleGasolinaChange}
		  dropdownIconColor={isDarkMode ? '#FFA41F' : '#333'}  // Aquí ajustamos el color de la flecha
        >
          <Picker.Item label="Gasolina | 91" value="91" />
          <Picker.Item label="Gasolina | 95" value="95" />
          <Picker.Item label="Diésel" value="diésel" />
        </Picker>

        <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
          Precio: <Text style={styles.value}>{precioGasolina} por litro</Text>
        </Text>
      </View>

      {/* Características del Vehículo */}
      <View style={[styles.cardContainer, { backgroundColor: isDarkMode ? '#14161e' : '#f0f0f0' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
          <Icon name="directions-car" size={18} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
          Características del Vehículo
        </Text>
        {vehiculo ? (
          <View>
  <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
    <Text style={styles.boldText}>Marca:</Text> 
    <Text style={{ color: '#F5F5F5' }}>  {displayValue(vehiculo.marca)}</Text>
  </Text>
  <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
    <Text style={styles.boldText}>Modelo:</Text> 
    <Text style={{ color: '#F5F5F5' }}>  {displayValue(vehiculo.modelo)}</Text>
  </Text>
  <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
    <Text style={styles.boldText}>Año:</Text> 
    <Text style={{ color: '#F5F5F5' }}>  {displayValue(vehiculo.anio)}</Text>
  </Text>
  <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
    <Text style={styles.boldText}>Consumo:</Text> 
    <Text style={{ color: '#F5F5F5' }}>  {displayValue(vehiculo.consumo)} L/100 km</Text>
  </Text>
  <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
    <Text style={styles.boldText}>Km Recorridos:</Text> 
    <Text style={{ color: '#F5F5F5' }}>  {displayValue(vehiculo.kmRecorridos)} km</Text>
  </Text>
  <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
    <Text style={styles.boldText}>Mantenimiento:</Text> 
    <Text style={{ color: '#F5F5F5' }}>  {displayValue(5000 - parseInt(vehiculo.kmRecorridos))} km</Text>
  </Text>
  <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
    <Text style={styles.boldText}>Plataforma:</Text> 
    <Text style={{ color: '#F5F5F5' }}>  {plataforma}</Text>
  </Text>
  <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
    <Text style={styles.boldText}>Tipo de Gasolina:</Text> 
    <Text style={{ color: '#F5F5F5' }}>  {tipoGasolina}</Text>
  </Text>
  <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
    <Text style={styles.boldText}>Precio:</Text> 
    <Text style={{ color: '#F5F5F5' }}>  {precioGasolina}</Text>
  </Text>
</View>

        ) : (
          <View>
            <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>No tienes un vehículo guardado. ¡Añade uno!</Text>
            <Button title="Añadir Vehículo" onPress={handleNavigateToVehiculo} />
          </View>
        )}
      </View>

      {/* Gastos del Vehículo */}
<View style={[styles.cardContainer, { backgroundColor: isDarkMode ? '#14161e' : '#f0f0f0' }]}>
  <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
    <Icon name="money" size={18} color={isDarkMode ? '#FFA41F' : '#333'} style={styles.icon} />
    Gastos del Vehículo
  </Text>
  {vehiculo ? (
    <View>
      <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
        <Text style={styles.boldText}>Costo de Mantenimiento:  </Text> 
        <Text style={{ color: '#F5F5F5' }}>
            ${displayValue(vehiculo.costoMantenimiento)}
        </Text>
        <Text>  </Text> {/* Dos espacios adicionales */}
      </Text>
      <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
        <Text style={styles.boldText}>Seguro:  </Text> 
        <Text style={{ color: '#F5F5F5' }}>
            ${displayValue(vehiculo.costoSeguro)}
        </Text>
        <Text>  </Text> {/* Dos espacios adicionales */}
      </Text>
      <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
        <Text style={styles.boldText}>Renta Celular:  </Text> 
        <Text style={{ color: '#F5F5F5' }}>
            ${displayValue(vehiculo.rentaCelular)}
        </Text>
        <Text>  </Text> {/* Dos espacios adicionales */}
      </Text>
      <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>
        <Text style={styles.boldText}>Cuenta/Letra:  </Text> 
        <Text style={{ color: '#F5F5F5' }}>
            {vehiculo.pagaCuenta ? `$${displayValue(vehiculo.montoCuenta)}` : "No"}
        </Text>
        <Text>  </Text> {/* Dos espacios adicionales */}
      </Text>
    </View>
  ) : (
    <Text style={[styles.text, { color: isDarkMode ? '#FFA41F' : '#333' }]}>No tienes gastos registrados. ¡Añádelos!</Text>
  )}
</View>

{/* Botón para gestionar vehículo */}
<View style={styles.section}>
  <TouchableOpacity
    style={[
      styles.button,
      { backgroundColor: isDarkMode ? '#FFA41F' : '#FFA41F' }, // Fondo dinámico
    ]}
    onPress={handleNavigateToVehiculo}
  >
    <Text style={[styles.buttonText, { color: isDarkMode ? '#EDF2F7' : '#F5F5F5' }]}>
      Gestionar Vehículo
    </Text>
  </TouchableOpacity>
</View>
</ScrollView>
);
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "gray",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "left",
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: "left",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  cardContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 5,
  },
  icon: {
    marginRight: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
export default ControlScreen;
