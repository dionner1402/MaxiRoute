import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Button, Keyboard, TextInput, SectionList, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { format, parseISO } from 'date-fns'; // Asegúrate de tener instalado date-fns

const GastosScreen = () => {
  const [gastosFijos, setGastosFijos] = useState({ mantenimiento: "", cuenta: "", rentaCelular: "" });
  const [gastoDiario, setGastoDiario] = useState({ descripcion: "", monto: "" });
  const [gastosDiarios, setGastosDiarios] = useState([]);
  const [vehiculo, setVehiculo] = useState<any>({});
  const navigation = useNavigation();
  const [isGastosFijosVisible, setIsGastosFijosVisible] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { isDarkMode } = useTheme();
  const [showTotales, setShowTotales] = useState(true);
  const [loading, setLoading] = useState(false);

  // Configurar la barra superior según el modo claro/oscuro
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? '#141414' : '#EDF2F7',
      },
      headerTintColor: isDarkMode ? '#F5F5F5' : '#333',
    });
  }, [navigation, isDarkMode]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const gastosFijosStored = await AsyncStorage.getItem("gastosFijos");
        const gastosDiariosStored = await AsyncStorage.getItem("gastosDiarios");
        const vehiculoStored = await AsyncStorage.getItem("vehiculo");
        const totalesStored = await AsyncStorage.getItem("totalesDiarios");

        if (gastosFijosStored) setGastosFijos(JSON.parse(gastosFijosStored));
        if (gastosDiariosStored) setGastosDiarios(JSON.parse(gastosDiariosStored));
        if (vehiculoStored) setVehiculo(JSON.parse(vehiculoStored));
        if (totalesStored) {
          setTotalesPorFecha(JSON.parse(totalesStored));
        } else {
          console.log("No hay totales almacenados.");
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        Alert.alert('Error', 'Hubo un problema al cargar los datos.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const generateUniqueId = () => {
    return `${new Date().getTime()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const agregarGastoDiario = useCallback(async () => {
    if (!gastoDiario.descripcion || !gastoDiario.monto) {
      Alert.alert("Error", "Debe completar tanto la descripción como el monto del gasto.");
      return;
    }

    const nuevoGasto = {
      ...gastoDiario,
      id: generateUniqueId(),
      fecha: new Date().toISOString()
    };

    const updatedGastosDiarios = [...gastosDiarios, nuevoGasto];
    setGastosDiarios(updatedGastosDiarios);

    setGastoDiario({ descripcion: "", monto: "" });

    try {
      await AsyncStorage.setItem("gastosDiarios", JSON.stringify(updatedGastosDiarios));
      console.log("Gasto Diario Guardado:", nuevoGasto);
      guardarTotalesPorFecha(updatedGastosDiarios);
    } catch (error) {
      console.error("Error al guardar el gasto diario:", error);
      Alert.alert('Error', 'No se pudo guardar el gasto. Por favor, intenta de nuevo.');
    }
  }, [gastoDiario, gastosDiarios]);

  const eliminarGastoDiario = useCallback((id) => {
    Alert.alert("Confirmar eliminación", "¿Estás seguro de que deseas eliminar este gasto?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Eliminar",
        onPress: async () => {
          const updatedGastosDiarios = gastosDiarios.filter(item => item.id !== id);
          setGastosDiarios(updatedGastosDiarios);
          try {
            await AsyncStorage.setItem("gastosDiarios", JSON.stringify(updatedGastosDiarios));
            console.log(`Gasto con id ${id} eliminado correctamente`);
            guardarTotalesPorFecha(updatedGastosDiarios);
          } catch (error) {
            console.error("Error al eliminar el gasto diario:", error);
            Alert.alert('Error', 'No se pudo eliminar el gasto. Por favor, intenta de nuevo.');
          }
        },
      },
    ]);
  }, [gastosDiarios]);

  const gastosAgrupadosPorFecha = gastosDiarios
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .reduce((result, gasto) => {
      const fecha = format(parseISO(gasto.fecha), 'dd/MM/yyyy');
      if (!result[fecha]) {
        result[fecha] = [];
      }
      result[fecha].push(gasto);
      return result;
    }, {});

  const secciones = Object.keys(gastosAgrupadosPorFecha).map((fecha) => ({
    title: fecha,
    data: gastosAgrupadosPorFecha[fecha],
  }));

  const calcularTotalGastos = (sectionData) => {
    return sectionData.reduce((total, gasto) => total + parseFloat(gasto.monto), 0).toFixed(2);
  };

  const [totalesPorFecha, setTotalesPorFecha] = useState([]);

  const guardarTotalesPorFecha = useCallback(async (gastosActualizados) => {
    const gastosAgrupados = gastosActualizados
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .reduce((result, gasto) => {
        const fecha = format(parseISO(gasto.fecha), 'dd/MM/yyyy');
        if (!result[fecha]) {
          result[fecha] = [];
        }
        result[fecha].push(gasto);
        return result;
      }, {});

    const totales = Object.keys(gastosAgrupados).map((fecha) => {
      const total = calcularTotalGastos(gastosAgrupados[fecha]);
      return { fecha, total };
    });

    setTotalesPorFecha(totales);

    try {
      await AsyncStorage.setItem("totalesDiarios", JSON.stringify(totales));
      console.log("Totales Guardados Correctamente:", totales);
    } catch (error) {
      console.error("Error al guardar los totales:", error);
      Alert.alert('Error', 'No se pudo guardar los totales. Por favor, intenta de nuevo.');
    }
  }, []);

  const toggleSectionVisibility = useCallback((sectionTitle) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  }, []);

  const handleMontoChange = (text) => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    setGastoDiario({ ...gastoDiario, monto: numericValue });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#141414' : '#EDF2F7' }]}>
      {/* ... (el resto del código de render sigue aquí, incluyendo los nuevos cambios) ... */}
      {loading && <Text style={[styles.loadingText, { color: isDarkMode ? '#FFA41F' : '#333' }]}>Cargando...</Text>}
      {/* Gastos Fijos */}
      <View style={[styles.gastosFijosContainer, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5' }]}>
        <TouchableOpacity onPress={() => setIsGastosFijosVisible(!isGastosFijosVisible)} accessible={true} accessibilityLabel="Mostrar u ocultar detalles de gastos fijos">
          <View style={styles.gastosFijosHeader}>
            <Text style={[styles.title, { color: isDarkMode ? '#FFA41F' : '#EDF2F7' }]}>Detalles de Gastos Fijos</Text>
            <FontAwesome name={isGastosFijosVisible ? "caret-up" : "caret-down"} size={20} color={isDarkMode ? "#FFA41F" : "#EDF2F7"} />
          </View>
        </TouchableOpacity>

        {isGastosFijosVisible && (
          <View style={styles.gastosFijosDetails}>
            {/* Costo Mantenimiento */}
            <View style={styles.gastoItem}>
              <FontAwesome name="car" size={20} color="#FFA41F" />
              {vehiculo.costoMantenimiento ? (
                <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
                  <Text style={styles.boldText}>    Costo Mant. 5000km:   </Text>${vehiculo.costoMantenimiento}
                </Text>
              ) : (
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#444' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#333' }]}
                  placeholder="Costo Mant. 5000km"
                  keyboardType="numeric"
                  onChangeText={(text) => setGastosFijos({ ...gastosFijos, mantenimiento: text })}
                  value={gastosFijos.mantenimiento}
                />
              )}
            </View>

            <View style={styles.separator} />
            {/* Paga Cuenta/Letra */}
            <View style={styles.gastoItem}>
              <FontAwesome name="usd" size={20} color="#FFA41F" />
              <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
                <Text style={styles.boldText}>   Cta./Letra Mes:</Text> {vehiculo.pagaCuenta ? "" : "NO"}
              </Text>

              {vehiculo.pagaCuenta && (
                <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
                  <Text style={styles.boldText}></Text> ${vehiculo.montoCuenta}
                </Text>
              )}
            </View>

            <View style={styles.separator} />
            {/* Costo Seguro */}
            <View style={styles.gastoItem}>
              <FontAwesome name="shield" size={20} color="#FFA41F" />
              {vehiculo.costoSeguro ? (
                <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
                  <Text style={styles.boldText}>    Seguro/Mes:   </Text>${vehiculo.costoSeguro}
                </Text>
              ) : (
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#444' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#333' }]}
                  placeholder="Pago Seguro por Semana"
                  keyboardType="numeric"
                  onChangeText={(text) => setGastosFijos({ ...gastosFijos, seguro: text })}
                  value={gastosFijos.seguro}
                />
              )}
            </View>

            <View style={styles.separator} />
            {/* Renta Celular */}
            <View style={styles.gastoItem}>
              <FontAwesome name="mobile" size={20} color="#FFA41F" />
              {vehiculo.rentaCelular ? (
                <Text style={[styles.text, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
                  <Text style={styles.boldText}>    Renta Cel./Mes:   </Text>${vehiculo.rentaCelular}
                </Text>
              ) : (
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#444' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#333' }]}
                  placeholder="Pago Cel por Semana"
                  keyboardType="numeric"
                  onChangeText={(text) => setGastosFijos({ ...gastosFijos, celular: text })}
                  value={gastosFijos.celular}
                />
              )}
            </View>
          </View>
        )}
      </View>

      {/* Gastos del Día */}
      <Text style={[styles.title, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>Gastos del Día</Text>
      <View style={[styles.gastosContainer, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5' }]}>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#333' }]}
          placeholder="Descripción del Gasto"
          placeholderTextColor={isDarkMode ? '#FFA41F' : '#666'}
          onChangeText={(text) => setGastoDiario({ ...gastoDiario, descripcion: text })}
          value={gastoDiario.descripcion}
        />
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#141414' : '#F5F5F5', color: isDarkMode ? '#F5F5F5' : '#333' }]}
          placeholder="Monto del Gasto"
          placeholderTextColor={isDarkMode ? '#FFA41F' : '#666'}
          keyboardType="numeric"
          onChangeText={handleMontoChange}
          value={gastoDiario.monto}
        />
        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            agregarGastoDiario();
          }}
          style={[
            styles.addExpenseButton,
            { backgroundColor: isDarkMode ? '#FFA41F' : '#FFA41F' },
          ]}
        >
          <Text style={[styles.addExpenseButtonText, { color: isDarkMode ? '#EDF2F7' : '#F5F5F5' }]}>
            Agregar Gasto
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section List con los gastos del día */}
      <SectionList
        sections={secciones}
        keyExtractor={(item, index) => index.toString()}
        renderSectionHeader={({ section }) => {
          const totalGastosDia = calcularTotalGastos(section.data);
          const isExpanded = expandedSections[section.title];

          return (
            <TouchableOpacity onPress={() => toggleSectionVisibility(section.title)} style={[styles.sectionHeader, { backgroundColor: isDarkMode ? '#14161e' : '#f1f1f1' }]} accessible={true} accessibilityLabel={`Gastos del día ${section.title}`}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>{section.title}</Text>
              <Text style={[styles.totalGastosDia, { color: isDarkMode ? '#FFA41F' : '#14161e' }]}>Total gastos: ${totalGastosDia}</Text>
              <FontAwesome name={isExpanded ? "caret-up" : "caret-down"} size={20} color={isDarkMode ? "#FFA41F" : "#EDF2F7"} />
            </TouchableOpacity>
          );
        }}
        renderItem={({ item, index, section }) => {
          if (!expandedSections[section.title]) {
            return null;
          }
          return (
            <View style={[styles.gastoItem, { backgroundColor: isDarkMode ? '#14161e' : '#F5F5F5' }]}>
              <Text style={[styles.hora, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
                {format(parseISO(item.fecha), 'HH:mm')}
              </Text>
              <Text style={[styles.descripcion, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
                {item.descripcion}: ${item.monto}
              </Text>
              <TouchableOpacity onPress={() => eliminarGastoDiario(item.id)} accessible={true} accessibilityLabel="Eliminar gasto">
                <Text style={[styles.eliminar, { color: isDarkMode ? '#FFA41F' : '#FFA41F' }]}>X</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    padding: 20,
  },




addExpenseButton: {
  borderRadius: 20,
  paddingVertical: 14,
  alignItems: 'center',
  marginTop: 20,
  width: '100%',
},
addExpenseButtonText: {
  fontSize: 16,
  fontWeight: 'bold',
},
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  gastosFijosContainer: {
    marginTop: 20,
    marginBottom: 30,
    borderWidth: 0.5,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
  },
  gastosFijosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  gastosFijosDetails: {
    marginTop: 10,
  },
  gastoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
	paddingVertical: 5,
  },
  gastosContainer: {
  marginBottom: 30,
  marginTop: 10,
  borderRadius: 5,
  padding: 10, // Aumentado para mayor altura
  minHeight: 150, // Garantiza una altura mínima
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
    marginVertical: 5,
    flex: 1,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#FFA41F",
    marginVertical: 10,
  },
  boldText: {
    fontWeight: "bold",
	
	
  },
  sectionHeader: {
    flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 15,   // Aumenté el padding vertical
  paddingHorizontal: 20, // Aumenté el padding horizontal para más separación
  backgroundColor: "#f0f0f0",
  borderRadius: 5,
  marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalGastosDia: {
    fontSize: 17,
    fontWeight: "bold",
    marginLeft: 20,
  },
  hora: {
    fontSize: 14,
    color: "#888",
    marginLeft: 10,
  },
  descripcion: {
    flex: 1,
    fontSize: 16,
    textAlign: "right",
  },
  eliminar: {
    fontSize: 18,
    color: "red",
    paddingLeft: 20,
    marginRight: 10,
  },
  totalesContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    // Se agregan los estilos para el fondo según el tema
  },
  totalPorFecha: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default GastosScreen;
