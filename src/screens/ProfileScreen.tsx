import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { MaterialIcons, Feather, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";

export default function ProfileScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const [userData, setUserData] = useState({ name: "", email: "", phone: "" });
  const [totalDistance, setTotalDistance] = useState("0.00");
  const [claimedCoupons, setClaimedCoupons] = useState([]);
  const [convertedCoupons, setConvertedCoupons] = useState([]);
  const [gameUserId, setGameUserId] = useState("");
  const [dob, setDob] = useState("");
  const [mxcBalance, setMxcBalance] = useState("0.00");
  const [cMxcBalance, setCMxcBalance] = useState("0.00");
  const [loginMethod, setLoginMethod] = useState("");
  const [couponFilter, setCouponFilter] = useState("available");
  const { t } = useTranslation();

  // Función reutilizable para formatear cupones
  const formatCoupons = (coupons, status) => {
    if (coupons && Array.isArray(coupons)) {
      return coupons.map((coupon) => ({
        _id: coupon._id || "",
        title: coupon.title || "Cupón",
        description: coupon.description || "Detalles no disponibles",
        image: coupon.image || "https://via.placeholder.com/80",
        cMxcValue: coupon.cMxcValue || 0,
        status,
      }));
    }
    return [];
  };

  // Cargar datos iniciales
  useEffect(() => {
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Usuario no autenticado");
        navigation.navigate("Login");
        return;
      }
        const response = await axios.get("http://192.168.40.5:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
        console.log("Respuesta inicial:", response.status); // Depuración
        if (response.status === 200) {
          const data = response.data;
          setUserData(data);
          setMxcBalance(data.mxcBalance.toFixed(2));
          setCMxcBalance(data.cMxcBalance.toFixed(2));

          setClaimedCoupons(formatCoupons(data.claimedCoupons, "available"));
          setConvertedCoupons(formatCoupons(data.convertedCoupons, "converted"));

          await AsyncStorage.setItem("userName", data.name);

          if (data.email && data.email.trim() !== "") {
            setLoginMethod("email");
          } else if (data.phone && data.phone.trim() !== "") {
            setLoginMethod("phone");
          }
        } else {
          Alert.alert("Error", response.data.message || "Error al obtener los datos del usuario");
          navigation.navigate("Login");
        }
      } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
        Alert.alert("Error", error.response?.data.message || "Error al obtener los datos del usuario");
        navigation.navigate("Login");
      }
    };
    fetchUserData();
  }, [navigation]);

  // Recargar datos al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          console.log("Token en focus:", token); // Depuración
          if (!token) {
            Alert.alert("Error", "Usuario no autenticado");
            navigation.navigate("Login");
            return;
          }
          const response = await axios.get("http://192.168.40.5:5000/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Respuesta en focus:", response.status); // Depuración
          if (response.status === 200) {
            const data = response.data;
            setUserData(data);
            setMxcBalance(data.mxcBalance.toFixed(2));
            setCMxcBalance(data.cMxcBalance.toFixed(2));

            setClaimedCoupons(formatCoupons(data.claimedCoupons, "available"));
            setConvertedCoupons(formatCoupons(data.convertedCoupons, "converted"));

            await AsyncStorage.setItem("userName", data.name);

            const storedDistance = await AsyncStorage.getItem("totalDistance");
            setTotalDistance(storedDistance ? parseFloat(storedDistance).toFixed(2) : "0.00");

            const storedGameId = await AsyncStorage.getItem("gameUserId");
            setGameUserId(storedGameId || "No registrado");

            const storedDOB = await AsyncStorage.getItem("gameUserDOB");
            setDob(storedDOB || "");
          } else {
            Alert.alert("Error", response.data.message || "Error al obtener los datos del usuario");
          }
        } catch (error) {
          console.error("Error al cargar datos del usuario:", error);
          Alert.alert("Error", "No se pudieron cargar los datos del usuario");
        }
      };
      loadData();
    }, [navigation])
  );

  const handleConvertCoupon = async (couponId) => {
    Alert.alert(
      "Confirmar Conversión",
      "¿Deseas convertir este cupón a C-MXC? Se aplicará una comisión del 30%.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Convertir",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) {
                Alert.alert("Error", "Usuario no autenticado");
                return;
              }
              await axios.post(
                "http://192.168.40.5:5000/api/coupons/convert",
                { couponId },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              const userResponse = await axios.get("http://192.168.40.5:5000/api/users/me", {
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = userResponse.data;
              setUserData(data);
              setMxcBalance(data.mxcBalance.toFixed(2));
              setCMxcBalance(data.cMxcBalance.toFixed(2));
              setClaimedCoupons(formatCoupons(data.claimedCoupons, "available"));
              setConvertedCoupons(formatCoupons(data.convertedCoupons, "converted"));

              Alert.alert(
                "Éxito",
                `Cupón convertido exitosamente. Nuevo balance: ${data.cMxcBalance.toFixed(2)} C-MXC`
              );
            } catch (error) {
              console.error("Error al convertir cupón:", error);
              Alert.alert("Error", error.response?.data.message || "No se pudo convertir el cupón");
            }
          },
        },
      ]
    );
  };

  const handleResetCoupons = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No se encontró el token de autenticación");
        return;
      }
      await axios.post(
        "http://192.168.40.5:5000/api/users/coupons/reset",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await AsyncStorage.removeItem("claimedCoupons");
      setClaimedCoupons([]);
      setConvertedCoupons([]);
      Alert.alert("Éxito", "Los cupones han sido reiniciados");
    } catch (error) {
      console.error("Error al reiniciar cupones:", error);
      Alert.alert("Error", error.response?.data.message || "No se pudieron reiniciar los cupones");
    }
  };

  const filteredCoupons = [...claimedCoupons, ...convertedCoupons].filter(
    (coupon) => coupon.status === couponFilter
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? "#141414" : "#f4f4f4" }]}>
      {/* Encabezado del perfil */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5" }]}>
        <View style={styles.profileBadge}>
          <Image source={{ uri: "https://via.placeholder.com/100" }} style={styles.profileImage} />
          <View style={styles.badgeIcon}>
            <MaterialIcons name="verified" size={24} color="#FFA41F" />
          </View>
        </View>
        <Text style={[styles.username, { color: isDarkMode ? "#F5F5F5" : "#333" }]}>
          {userData.name}
        </Text>
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("EditProfile")}>
          <Text style={styles.editButtonText}>Editar Perfil</Text>
          <Feather name="edit-2" size={16} color="#FFFFFF" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>

      {/* Tarjeta de balance */}
      <View style={[styles.balanceCard, { backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5" }]}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>MXC Balance</Text>
            <Text style={styles.balanceValue}>{mxcBalance}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>C-MXC Balance</Text>
            <Text style={styles.balanceValue}>{cMxcBalance}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.balanceButton}
          onPress={() => navigation.navigate("MxcBalanceScreen")}
        >
          <Text style={styles.balanceButtonText}>Ver detalles del balance</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>

      {/* Sección de información del perfil */}
      <View style={[styles.infoSection, { backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5" }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="person" size={22} color="#FFA41F" />
          <Text style={[styles.sectionTitle, { color: "#FFA41F" }]}>Información del Perfil</Text>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIconContainer, { backgroundColor: isDarkMode ? "#262833" : "#f2f2f2" }]}>
              <MaterialIcons
                name={loginMethod === "phone" ? "phone" : "email"}
                size={20}
                color="#FFA41F"
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? "#aaa" : "#666" }]}>
                {loginMethod === "phone" ? "Teléfono" : "Correo"}
              </Text>
              <Text style={[styles.infoValue, { color: isDarkMode ? "#F5F5F5" : "#333" }]}>
                {loginMethod === "phone" ? userData.phone : userData.email}
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoIconContainer, { backgroundColor: isDarkMode ? "#262833" : "#f2f2f2" }]}>
              <MaterialIcons name="gamepad" size={20} color="#FFA41F" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? "#aaa" : "#666" }]}>ID de Juego</Text>
              <Text style={[styles.infoValue, { color: isDarkMode ? "#F5F5F5" : "#333" }]}>
                {gameUserId}
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoIconContainer, { backgroundColor: isDarkMode ? "#262833" : "#f2f2f2" }]}>
              <MaterialIcons name="calendar-today" size={20} color="#FFA41F" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? "#aaa" : "#666" }]}>
                Fecha de Nacimiento
              </Text>
              <Text style={[styles.infoValue, { color: isDarkMode ? "#F5F5F5" : "#333" }]}>
                {dob || "No registrado"}
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoIconContainer, { backgroundColor: isDarkMode ? "#262833" : "#f2f2f2" }]}>
              <MaterialIcons name="directions-car" size={20} color="#FFA41F" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: isDarkMode ? "#aaa" : "#666" }]}>
                Distancia Total
              </Text>
              <Text style={[styles.infoValue, { color: isDarkMode ? "#F5F5F5" : "#333" }]}>
                {totalDistance} km
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sección de referidos */}
      <View style={[styles.referralSection, { backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5" }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="share" size={22} color="#FFA41F" />
          <Text style={[styles.sectionTitle, { color: "#FFA41F" }]}>Tu Enlace de Referido</Text>
        </View>
        <View style={[styles.referralContainer, { backgroundColor: isDarkMode ? "#1a1c27" : "#f9f9f9" }]}>
          <Text
            selectable
            style={[styles.referralLink, { color: isDarkMode ? "#F5F5F5" : "#141414" }]}
          >
            {`https://miapp.com/register?ref=${userData._id || gameUserId}`}
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => {
              const referralCode = userData._id || gameUserId;
              const referralLink = `https://miapp.com/register?ref=${referralCode}`;
              Clipboard.setString(referralLink);
              Alert.alert("Copiado", "El enlace de referido ha sido copiado al portapapeles.");
            }}
          >
            <Feather name="copy" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.referralStats}>
          <View style={styles.referralStat}>
            <Text style={styles.referralStatValue}>0</Text>
            <Text style={[styles.referralStatLabel, { color: isDarkMode ? "#aaa" : "#666" }]}>
              Invitaciones
            </Text>
          </View>
          <View style={styles.referralStat}>
            <Text style={styles.referralStatValue}>0.0000</Text>
            <Text style={[styles.referralStatLabel, { color: isDarkMode ? "#aaa" : "#666" }]}>
              MXC Ganado
            </Text>
          </View>
        </View>
      </View>

      {/* Sección de cupones */}
      <View style={[styles.couponsSection, { backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5" }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="card-giftcard" size={22} color="#FFA41F" />
          <Text style={[styles.sectionTitle, { color: "#FFA41F" }]}>Mis Cupones</Text>
        </View>
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, couponFilter === "available" && styles.activeFilterTab]}
            onPress={() => setCouponFilter("available")}
          >
            <Text
              style={[
                styles.filterTabText,
                couponFilter === "available" && styles.activeFilterTabText,
              ]}
            >
              Disponibles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, couponFilter === "converted" && styles.activeFilterTab]}
            onPress={() => setCouponFilter("converted")}
          >
            <Text
              style={[
                styles.filterTabText,
                couponFilter === "converted" && styles.activeFilterTabText,
              ]}
            >
              Convertidos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, couponFilter === "expired" && styles.activeFilterTab]}
            onPress={() => setCouponFilter("expired")}
          >
            <Text
              style={[
                styles.filterTabText,
                couponFilter === "expired" && styles.activeFilterTabText,
              ]}
            >
              Caducados
            </Text>
          </TouchableOpacity>
        </View>
        {filteredCoupons.length > 0 ? (
          filteredCoupons.map((coupon, index) => (
            <View
              key={coupon._id || `coupon-${index}`}
              style={[
                styles.couponItem,
                { backgroundColor: isDarkMode ? "#1a1c27" : "#FFFFFF" },
                index === filteredCoupons.length - 1 && { marginBottom: 0 },
              ]}
            >
              <Image source={{ uri: coupon.image }} style={styles.couponImage} />
              <View style={styles.couponDetails}>
                <Text style={[styles.couponTitle, { color: isDarkMode ? "#F5F5F5" : "#333" }]}>
                  {coupon.title}
                </Text>
                <Text style={[styles.couponDescription, { color: isDarkMode ? "#aaa" : "#666" }]}>
                  {coupon.description}
                </Text>
                <View style={styles.couponFooter}>
                  <Text style={styles.couponValue}>
                    {coupon.cMxcValue ? `${coupon.cMxcValue} C-MXC` : "N/A"}
                  </Text>
                  {coupon.status === "available" ? (
                    <View style={styles.couponActions}>
                      <TouchableOpacity
                        style={styles.couponAction}
                        onPress={() => navigation.navigate("OfferDetail", { offerId: coupon._id })}
                      >
                        <Feather name="eye" size={16} color="#FFA41F" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.couponAction}
                        onPress={() => handleConvertCoupon(coupon._id)}
                      >
                        <MaterialIcons name="attach-money" size={16} color="#4CAF50" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {coupon.status === "converted" ? "Convertido" : "Caducado"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyCoupons, { backgroundColor: isDarkMode ? "#1a1c27" : "#FFFFFF" }]}>
            <Feather name="inbox" size={40} color={isDarkMode ? "#333" : "#ccc"} />
            <Text style={[styles.emptyCouponsText, { color: isDarkMode ? "#aaa" : "#666" }]}>
              {couponFilter === "available"
                ? "No tienes cupones disponibles"
                : couponFilter === "converted"
                ? "No tienes cupones convertidos"
                : "No tienes cupones caducados"}
            </Text>
          </View>
        )}
      </View>

      {/* Sección de administración */}
      <View style={[styles.adminSection, { backgroundColor: isDarkMode ? "#14161e" : "#F5F5F5" }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="settings" size={22} color="#FFA41F" />
          <Text style={[styles.sectionTitle, { color: "#FFA41F" }]}>Administración</Text>
        </View>
        <Text style={[styles.adminNote, { color: isDarkMode ? "#aaa" : "#666" }]}>
          Herramientas para pruebas y desarrollo
        </Text>
        <View style={styles.adminButtons}>
          <TouchableOpacity
            style={[styles.adminButton, { backgroundColor: isDarkMode ? "#262833" : "#f9f9f9" }]}
            onPress={handleResetCoupons}
          >
            <MaterialIcons name="refresh" size={20} color="#FFA41F" />
            <Text style={[styles.adminButtonText, { color: isDarkMode ? "#F5F5F5" : "#333" }]}>
              Reiniciar Cupones
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminButton, { backgroundColor: isDarkMode ? "#262833" : "#f9f9f9" }]}
            onPress={async () => {
              try {
                await AsyncStorage.removeItem("gameUserId");
                await AsyncStorage.removeItem("gameUserAge");
                await AsyncStorage.removeItem("gameUserGender");
                await AsyncStorage.removeItem("gameUserDOB");
                await AsyncStorage.removeItem("allGameIds");
                setGameUserId("No registrado");
                setDob("");
                Alert.alert("Éxito", "El registro de entretenimiento ha sido reiniciado");
              } catch (error) {
                console.error("Error al reiniciar registro de entretenimiento:", error);
                Alert.alert("Error", "No se pudo reiniciar el registro de entretenimiento");
              }
            }}
          >
            <MaterialIcons name="games" size={20} color="#FFA41F" />
            <Text style={[styles.adminButtonText, { color: isDarkMode ? "#F5F5F5" : "#333" }]}>
              Reiniciar Entretenimiento
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminButton, { backgroundColor: isDarkMode ? "#262833" : "#f9f9f9" }]}
            onPress={async () => {
              try {
                await AsyncStorage.removeItem("mxcMinedList");
                setMxcBalance("0.00");
                const token = await AsyncStorage.getItem("token");
                if (token) {
                  try {
                    await axios.post(
                      "http://192.168.40.5:5000/api/users/mxc/reset",
                      {},
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                  } catch (serverError) {
                    console.log("Reset en servidor fallido, continuando con reset local:", serverError);
                  }
                }
                Alert.alert("Éxito", "Se han reiniciado los datos de MXC");
              } catch (error) {
                console.error("Error al reiniciar datos MXC:", error);
                Alert.alert("Error", "No se pudieron reiniciar los datos MXC");
              }
            }}
          >
            <MaterialIcons name="account-balance-wallet" size={20} color="#FFA41F" />
            <Text style={[styles.adminButtonText, { color: isDarkMode ? "#F5F5F5" : "#333" }]}>
              Reiniciar MXC
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminButton, styles.dangerButton]}
            onPress={() => {
              Alert.alert(
                "Reiniciar Todo",
                "¿Estás seguro de que deseas reiniciar todos los datos?",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Confirmar",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await handleResetCoupons();
                        await AsyncStorage.removeItem("gameUserId");
                        await AsyncStorage.removeItem("gameUserAge");
                        await AsyncStorage.removeItem("gameUserGender");
                        await AsyncStorage.removeItem("gameUserDOB");
                        await AsyncStorage.removeItem("allGameIds");
                        await AsyncStorage.removeItem("mxcMinedList");
                        setGameUserId("No registrado");
                        setDob("");
                        setMxcBalance("0.00");
                        Alert.alert("Éxito", "Todos los datos han sido reiniciados");
                      } catch (error) {
                        console.error("Error al reiniciar todos los datos:", error);
                        Alert.alert("Error", "No se pudieron reiniciar todos los datos");
                      }
                    },
                  },
                ]
              );
            }}
          >
            <MaterialIcons name="delete-forever" size={20} color="#FFFFFF" />
            <Text style={[styles.adminButtonText, { color: "#FFFFFF" }]}>
              Reiniciar Todo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    alignItems: "center",
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileBadge: { position: "relative", marginBottom: 16 },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFA41F",
  },
  badgeIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
  },
  username: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFA41F",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  balanceItem: { flex: 1, alignItems: "center" },
  balanceLabel: { fontSize: 14, color: "#666", marginBottom: 4 },
  balanceValue: { fontSize: 18, fontWeight: "bold", color: "#333" },
  balanceDivider: { width: 1, backgroundColor: "#E0E0E0", marginHorizontal: 16 },
  balanceButton: {
    backgroundColor: "#FFA41F",
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  infoSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 8 },
  infoGrid: { flexDirection: "column", gap: 12 },
  infoItem: { flexDirection: "row", alignItems: "center" },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 14, marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: "500" },
  referralSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  referralContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  referralLink: { fontSize: 14, flex: 1, marginRight: 8 },
  copyButton: { backgroundColor: "#FFA41F", padding: 8, borderRadius: 8 },
  referralStats: { flexDirection: "row", justifyContent: "space-around" },
  referralStat: { alignItems: "center" },
  referralStatValue: { fontSize: 18, fontWeight: "bold", color: "#FFA41F" },
  referralStatLabel: { fontSize: 12 },
  couponsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabs: { flexDirection: "row", marginBottom: 16 },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f2f2f2",
  },
  activeFilterTab: { backgroundColor: "#FFA41F" },
  filterTabText: { color: "#333", fontSize: 14 },
  activeFilterTabText: { color: "#FFFFFF", fontWeight: "bold" },
  couponItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  couponImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  couponDetails: { flex: 1 },
  couponTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  couponDescription: { fontSize: 14, marginBottom: 8 },
  couponFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  couponValue: { fontSize: 14, color: "#FFA41F", fontWeight: "bold" },
  couponActions: { flexDirection: "row", gap: 8 },
  couponAction: { padding: 8, backgroundColor: "#f2f2f2", borderRadius: 8 },
  statusBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  emptyCoupons: { alignItems: "center", padding: 20, borderRadius: 8 },
  emptyCouponsText: { marginTop: 8, fontSize: 16 },
  adminSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminNote: { fontSize: 14, marginBottom: 16, textAlign: "center" },
  adminButtons: { flexDirection: "column", gap: 12 },
  adminButton: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8 },
  adminButtonText: { marginLeft: 12, fontSize: 16 },
  dangerButton: { backgroundColor: "#E74C3C" },
});