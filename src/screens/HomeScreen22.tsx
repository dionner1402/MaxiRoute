import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  AppState,
  FlatList,
  Animated,
  Image,
  Keyboard,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import { captureRef } from "react-native-view-shot"; // Importar para captura de pantalla

const HomeScreen = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [price, setPrice] = useState("");
  const [tripEnded, setTripEnded] = useState(false);
  const [showPriceInput, setShowPriceInput] = useState(true);
  const lastLocation = useRef(null);
  const timerRef = useRef(null);
  const [plataforma, setPlataforma] = useState("UBER");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [costoMantenimiento, setCostoMantenimiento] = useState("");
  const [mantenimientoParcial, setMantenimientoParcial] = useState("");
  const [pagoCuentaSemana, setPagoCuentaSemana] = useState("");
  const [rentaCelular, setRentaCelular] = useState("");
  const [precioGasolina, setPrecioGasolina] = useState("0");
  const [consumo, setConsumo] = useState(0);
  const [seguroParcial, setSeguroParcial] = useState("");
  const [costoSeguro, setCostoSeguro] = useState(0);
  const [kmRecorridos, setKmRecorridos] = useState(0);
  const [lastTrip, setLastTrip] = useState(null);
  const [consumoL100km, setConsumoL100km] = useState("");
  const [consumoLkm, setConsumoLkm] = useState("");
  const [costoGasolina, setCostoGasolina] = useState("0.00");
  const [totalGastosDia, setTotalGastosDia] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [showLastTrip, setShowLastTrip] = useState(true);
  const [minedMXC, setMinedMXC] = useState(0);

  const mapRef = useRef(null);
  const flatListRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const MXC_PER_KM = 0.1; // 0.1 MXC por kilómetro recorrido

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: isDarkMode ? "#EDF2F7" : "#F5F5F5" },
      headerTintColor: isDarkMode ? "#FFA41F" : "#EDF2F7",
    });
  }, [navigation, isDarkMode]);

  const loadData = async () => {
    try {
      const storedPlataforma = await AsyncStorage.getItem("plataforma");
      const storedVehiculo = await AsyncStorage.getItem("vehiculo");
      const storedTipoGasolina = await AsyncStorage.getItem("tipoGasolina");
      const storedGastosDiarios = await AsyncStorage.getItem("gastosDiarios");
      const fechaHoy = new Date().toLocaleDateString();

      if (storedPlataforma) setPlataforma(storedPlataforma);
      if (storedVehiculo) {
        const vehiculo = JSON.parse(storedVehiculo);
        setCostoMantenimiento(vehiculo.costoMantenimiento || "0");
        setPagoCuentaSemana(vehiculo.montoCuenta || "0");
        setRentaCelular(vehiculo.rentaCelular || "0");
        setCostoSeguro(vehiculo.costoSeguro || "0");
        setConsumo(vehiculo.consumo || 0);
        setKmRecorridos(vehiculo.kmRecorridos || 0);
        setConsumoL100km(vehiculo.consumo || "No disponible");
      }
      if (storedTipoGasolina) {
        const precio = preciosGasolina[storedTipoGasolina];
        setPrecioGasolina(`$${precio}`);
      }
      if (storedGastosDiarios) {
        const gastosDiarios = JSON.parse(storedGastosDiarios);
        const gastosHoy = gastosDiarios.filter(
          (gasto) => new Date(gasto.fecha).toLocaleDateString() === fechaHoy
        );
        const totalHoy = gastosHoy.reduce(
          (acc, gasto) => acc + parseFloat(gasto.monto),
          0
        );
        setTotalGastosDia(totalHoy.toFixed(2));
      }
    } catch (error) {
      console.log("Error al recuperar datos:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setShowLastTrip(false);
      loadData();
      const requestLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setLocation(currentLocation);
        }
      };
      requestLocation();
    }, [])
  );

  const preciosGasolina = { 91: 0.85, 95: 0.88, diésel: 0.79 };

  const startTracking = async () => {
    Keyboard.dismiss();
    if (!price) {
      Alert.alert(
        "Error",
        "Por favor, ingrese el monto cobrado antes de iniciar el viaje."
      );
      return;
    }

    setIsTracking(true);
    setDistance(0);
    setTime(0);
    setTripEnded(false);
    setMinedMXC(0);
    setShowPriceInput(false);

    const currentTime = new Date();
    setStartTime(formatTime(currentTime));
    setEndTime(formatTime(currentTime));
    setEndDate(formatDate(currentTime));

    lastLocation.current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const watch = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (newLocation) => {
        if (lastLocation.current) {
          const coords1 = lastLocation.current.coords;
          const coords2 = newLocation.coords;
          if (
            typeof coords1.latitude === "number" &&
            typeof coords1.longitude === "number" &&
            typeof coords2.latitude === "number" &&
            typeof coords2.longitude === "number"
          ) {
            const dist = getDistance(coords1, coords2);
            if (!isNaN(dist)) {
              setDistance((prevDistance) => {
                const newDistance = isNaN(prevDistance)
                  ? dist
                  : prevDistance + dist;
                setMinedMXC(newDistance * MXC_PER_KM); // Calcular MXC minados
                return newDistance;
              });
            } else {
              console.log("Distancia NaN:", coords1, coords2);
            }
          } else {
            console.log("Coordenadas inválidas:", coords1, coords2);
          }
        }
        setRouteCoordinates((prev) => [...prev, newLocation.coords]);
        lastLocation.current = newLocation;
        setLocation(newLocation);
      }
    );
    setWatchId(watch);
    startTimer();
  };

  const stopTracking = async () => {
    if (watchId) watchId.remove();
    setIsTracking(false);
    setTripEnded(true);
    setShowLastTrip(true);

    const currentTime = new Date();
    setEndTime(formatTime(currentTime));
    setEndDate(formatDate(currentTime));

    stopTimer();
    await captureMapScreenshot(); // Capturar pantalla del mapa
    await saveTrip(); // Guardar el viaje
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => setTime((prev) => prev + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const captureMapScreenshot = async () => {
    try {
      const uri = await captureRef(mapRef.current, {
        format: "jpg",
        quality: 0.8,
      });
      const tripId = generateId();
      await AsyncStorage.setItem(`tripMap_${tripId}`, uri); // Guardar imagen en AsyncStorage
      return `tripMap_${tripId}`; // Devolver la clave para asociarla al viaje
    } catch (error) {
      console.error("Error al capturar la pantalla del mapa:", error);
      return null;
    }
  };

  const saveTrip = async () => {
    const tripId = generateId();
    const mapScreenshotKey = await captureMapScreenshot(); // Obtener la clave de la captura
    const nuevoViaje = {
      id: tripId,
      horaInicio: startTime || "",
      horaFin: endTime || "",
      endDate: endDate || "",
      distancia: distance.toFixed(2) || "0.00",
      montoCobrado: price || "0",
      plataforma: plataforma || "UBER",
      comision: calculateComision().toFixed(2) || "0.00",
      duracion: convertTime(time) || "0 min 0 seg",
      costoMantenimiento: costoMantenimiento || "0",
      costoMantPorViaje: mantenimientoParcial || "0.0000",
      costoSeguro: costoSeguro || "0",
      costoSeguroPorViaje: calculateSeguroHora().toFixed(4) || "0.0000",
      totalGastosDia: totalGastosDia || "0",
      pagoCuentaSemana: pagoCuentaSemana || "0",
      costoCtaPorViaje: calculateCtaHora().toFixed(4) || "0.0000",
      rentaCelular: rentaCelular || "0",
      costoCelPorViaje: calculateDatosHora().toFixed(4) || "0.0000",
      consumo: (consumo / 100).toFixed(4) || "0.0000",
      precioGasolina: precioGasolina || "0",
      costoGasolina: costoGasolina || "0.00",
      kmRecorridos: kmRecorridos || "0",
      minedMXC: minedMXC.toFixed(4) || "0.0000", // Guardar MXC minados
      mapScreenshot: mapScreenshotKey, // Asociar la captura al viaje
    };

    const historialActual = await AsyncStorage.getItem("historialViajes");
    const historial = historialActual ? JSON.parse(historialActual) : [];
    historial.unshift(nuevoViaje);
    await AsyncStorage.setItem("historialViajes", JSON.stringify(historial));
  };

  const calculateComision = () => {
    const comisiones = { UBER: 0.1, INDRIVE: 0.129, LIBRE: 0 };
    return parseFloat(price) * comisiones[plataforma];
  };

  const generateId = () => {
    const platformInitials =
      plataforma === "UBER" ? "UB" : plataforma === "INDRIVE" ? "IN" : "LI";
    const timestamp = Date.now();
    return `${platformInitials}-${timestamp}`;
  };

  const calculateCtaHora = () =>
    time > 0 ? (pagoCuentaSemana / (30 * 24)) * (time / 3600) : 0;

  const calculateDatosHora = () =>
    time > 0 ? (rentaCelular / (30 * 24)) * (time / 3600) : 0;

  const calculateSeguroHora = () =>
    time > 0 ? (costoSeguro / (30 * 24)) * (time / 3600) : 0;

  const calcularMantenimientoParcial = () => {
    if (costoMantenimiento && distance > 0) {
      const costo = parseFloat(costoMantenimiento);
      return (costo / 5000) * distance;
    }
    return 0;
  };

  useEffect(() => {
    const parcial = calcularMantenimientoParcial();
    setMantenimientoParcial(parcial.toFixed(4));
    if (consumo > 0 && precioGasolina && distance > 0) {
      setCostoGasolina(
        (
          (consumo / 100) *
          distance *
          parseFloat(precioGasolina.replace("$", ""))
        ).toFixed(4)
      );
    }
  }, [costoMantenimiento, distance, consumo, precioGasolina]);

  const convertTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${minutes} min ${sec} seg`;
  };

  const startNewTrip = () => {
    setDistance(0);
    setTime(0);
    setPrice("");
    setTripEnded(false);
    setIsTracking(false);
    setStartTime(null);
    setEndTime(null);
    setEndDate(null);
    lastLocation.current = null;
    setRouteCoordinates([]);
    setShowLastTrip(false);
    setMinedMXC(0);
    setShowPriceInput(true);
  };

  const images = [
    { id: "1", src: require("../../assets/ad1.png") },
    { id: "2", src: require("../../assets/ad2.png") },
    { id: "3", src: require("../../assets/ad3.png") },
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const imageWidth = screenWidth;
  const containerHeight = 175;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: currentIndex,
        animated: true,
      });
    }
  }, [currentIndex]);

  const getDistance = (coords1, coords2) => {
    const rad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Radio de la Tierra en km
    const dLat = rad(coords2.latitude - coords1.latitude);
    const dLon = rad(coords2.longitude - coords1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(coords1.latitude)) *
        Math.cos(rad(coords2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  return (
    <View
      style={[
        { flex: 1 },
        { backgroundColor: isDarkMode ? "#EDF2F7" : "#F5F5F5" },
      ]}
    >
      {location ? (
        <>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: containerHeight,
              zIndex: 10,
              backgroundColor: "#EDF2F7",
              padding: 1,
              alignItems: "center",
            }}
          >
            <FlatList
              ref={flatListRef}
              data={images}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Image
                  source={item.src}
                  style={{
                    width: imageWidth,
                    height: containerHeight,
                    borderRadius: 10,
                  }}
                  resizeMode="contain"
                />
              )}
              snapToInterval={imageWidth}
              decelerationRate="fast"
            />
          </View>
          <MapView
            ref={mapRef}
            style={{
              position: "absolute",
              bottom: 200,
              left: 0,
              right: 0,
              width: "100%",
              height: 400,
            }}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            customMapStyle={mapStyle}
          >
            {isTracking && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#FFA41F"
                strokeWidth={5}
              />
            )}
            {routeCoordinates.length > 0 && (
              <Marker
                coordinate={routeCoordinates[0]}
                title="Inicio"
                pinColor="green"
              />
            )}
            {routeCoordinates.length > 1 && (
              <Marker
                coordinate={routeCoordinates[routeCoordinates.length - 1]}
                title="Fin"
                pinColor="red"
              />
            )}
          </MapView>
        </>
      ) : (
        <ActivityIndicator size="large" color="#FFA41F" />
      )}
      <View
        style={[
          styles.bottomContainer,
          { backgroundColor: isDarkMode ? "#EDF2F7" : "#f9f9f9" },
        ]}
      >
        {!tripEnded ? (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkMode ? "#FFA41F" : "#FFA41F" },
              ]}
            >
              Registrar Monto del Viaje
            </Text>
            {showPriceInput && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5",
                    color: isDarkMode ? "#F5F5F5" : "#000",
                  },
                ]}
                placeholder="Ingresa el monto cobrado"
                placeholderTextColor={isDarkMode ? "#FFA41F" : "#666"}
                keyboardType="numeric"
                onChangeText={setPrice}
                value={price}
              />
            )}
            <View
              style={[
                styles.buttonContainer,
                { backgroundColor: isTracking ? "#14161e" : "#FFA41F" },
              ]}
            >
              <TouchableOpacity
                onPress={
                  isTracking
                    ? () =>
                        Alert.alert(
                          "Finalizar Viaje",
                          `¿El monto final sigue igual?\n\nMonto final cobrado: $${parseFloat(
                            price || "0"
                          ).toFixed(2)}`,
                          [
                            { text: "Modificar", style: "cancel" },
                            { text: "Sí, finalizar", onPress: stopTracking },
                          ]
                        )
                    : startTracking
                }
              >
                <Text style={styles.buttonText}>
                  {isTracking
                    ? `Finalizar Viaje | $${parseFloat(price || "0").toFixed(2)}`
                    : "Iniciar Viaje"}
                </Text>
              </TouchableOpacity>
            </View>
            {isTracking && (
              <View
                style={[
                  styles.infoContainer,
                  { backgroundColor: isDarkMode ? "#FFA41F" : "#FFA41F" },
                ]}
              >
                <View
                  style={{ flexDirection: "row", justifyContent: "space-between" }}
                >
                  <View
                    style={[
                      styles.infoBox,
                      {
                        backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5",
                        flex: 1,
                        marginRight: 5,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: isDarkMode ? "#FFA41F" : "#333" },
                      ]}
                    >
                      Distancia:
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: isDarkMode ? "#F5F5F5" : "#FFA41F" },
                      ]}
                    >
                      {isNaN(distance) ? "0.00" : distance.toFixed(2)} km
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.infoBox,
                      {
                        backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5",
                        flex: 1,
                        marginLeft: 5,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: isDarkMode ? "#FFA41F" : "#333" },
                      ]}
                    >
                      Tiempo:
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: isDarkMode ? "#F5F5F5" : "#FFA41F" },
                      ]}
                    >
                      {convertTime(time)}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.infoBox,
                    {
                      backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5",
                      marginTop: 10,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 10,
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: isDarkMode ? "#F5F5F5" : "#333" },
                      ]}
                    >
                      MXC Minado:
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: isDarkMode ? "#FFA41F" : "#FFA41F" },
                      ]}
                    >
                      {isNaN(minedMXC) ? "0.0000" : minedMXC.toFixed(4)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: isDarkMode ? "#FFA41F" : "#333" },
                    ]}
                  >
                    ({MXC_PER_KM} MXC/km)
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <Text
              style={[
                styles.tripStatus,
                { color: isDarkMode ? "#FFA41F" : "#000" },
              ]}
            >
              ÚLTIMO VIAJE REGISTRADO
            </Text>
            <TouchableOpacity
              style={[
                styles.lastTripContainer,
                { backgroundColor: isDarkMode ? "#14161e" : "#f9f9f9" },
              ]}
            >
              <View
                style={[
                  styles.mainContainer,
                  { backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5" },
                ]}
              >
                <View
                  style={[
                    styles.centeredView,
                    { backgroundColor: isDarkMode ? "#EDF2F7" : "#e9e9e9" },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate("Historial");
                      setShowLastTrip(false);
                    }}
                    style={[
                      styles.idContainer,
                      {
                        backgroundColor: isDarkMode ? "#EDF2F7" : "#e9e9e9",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.infoText,
                        { color: isDarkMode ? "#FFA41F" : "#000" },
                      ]}
                    >
                      Ver Detalles
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.amountWrapper,
                    { backgroundColor: isDarkMode ? "#EDF2F7" : "#e9e9e9" },
                  ]}
                >
                  <Text
                    style={[
                      styles.infoTextvalue,
                      { color: isDarkMode ? "#F5F5F5" : "#000" },
                    ]}
                  >
                    Cobrado: ${parseFloat(price || "0").toFixed(2)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.amountWrapper,
                    { backgroundColor: isDarkMode ? "#EDF2F7" : "#e9e9e9" },
                  ]}
                >
                  <Text
                    style={[
                      styles.infoTextvalue,
                      { color: isDarkMode ? "#F5F5F5" : "#000" },
                    ]}
                  >
                    Neto: $
                    {(
                      parseFloat(price || 0) -
                      parseFloat(calculateComision().toFixed(2) || 0) -
                      parseFloat(mantenimientoParcial || 0) -
                      parseFloat(calculateCtaHora().toFixed(4) || 0) -
                      parseFloat(calculateDatosHora().toFixed(4) || 0) -
                      parseFloat(calculateSeguroHora().toFixed(4) || 0) -
                      parseFloat(costoGasolina || 0)
                    ).toFixed(2)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailsContainer,
                    { backgroundColor: isDarkMode ? "#EDF2F7" : "#e9e9e9" },
                  ]}
                >
                  <Text
                    style={[
                      styles.infoTextcons,
                      { color: isDarkMode ? "#F5F5F5" : "#000" },
                    ]}
                  >
                    Duración: {convertTime(time)}
                  </Text>
                  <Text
                    style={[
                      styles.infoTextcons,
                      { color: isDarkMode ? "#F5F5F5" : "#000" },
                    ]}
                  >
                    Distancia: {isNaN(distance) ? "0.00" : distance.toFixed(2)} km
                  </Text>
                  <Text
                    style={[
                      styles.infoTextcons,
                      { color: isDarkMode ? "#F5F5F5" : "#000" },
                    ]}
                  >
                    MXC Minado: {isNaN(minedMXC) ? "0.0000" : minedMXC.toFixed(4)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={startNewTrip}
              style={[
                styles.buttonN,
                { backgroundColor: isDarkMode ? "#FFA41F" : "#FFA41F" },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isDarkMode ? "#F5F5F5" : "#F5F5F5" },
                ]}
              >
                Volver
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#EDF2F7" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "on" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212121" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
];

const styles = StyleSheet.create({
  bottomContainer: {
    padding: 20,
    backgroundColor: "#E0E0E0",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderColor: "#FFA41F",
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 5,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 10,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonN: {
    marginVertical: 10,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    color: "#F5F5F5",
    textAlign: "center",
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "bold",
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    width: "100%",
    borderRadius: 20,
    elevation: 5,
  },
  infoBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFA41F",
  },
  tripStatus: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#FFA41F",
  },
  lastTripContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FFA41F",
    borderRadius: 10,
  },
  mainContainer: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  centeredView: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    borderRadius: 10,
  },
  idContainer: {
    marginBottom: 5,
    padding: 10,
    borderRadius: 8,
  },
  amountWrapper: {
    width: "100%",
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFA41F",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  detailsContainer: {
    width: "100%",
    paddingRight: 0,
    textAlign: "center",
    borderRadius: 10,
  },
  infoText: {
    fontSize: 20,
    marginBottom: 0,
  },
  infoTextvalue: {
    fontSize: 20,
    marginBottom: 0,
    textAlign: "center",
  },
  infoTextcons: {
    fontSize: 14,
    marginBottom: 5,
    alignItems: "center",
    textAlign: "center",
  },
});

export default HomeScreen;