import React, { useState, useEffect } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from "react-native";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import './src/screens/i18n'; 

// Importaciones de pantallas
import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import ControlScreen from "./src/screens/ControlScreen";
import VehiculoScreen from "./src/screens/VehiculoScreen";
import HistorialScreen from "./src/screens/HistorialScreen";
import GastosScreen from "./src/screens/GastosScreen";
import IngresosScreen from "./src/screens/IngresosScreen";
import SettingScreen from "./src/screens/SettingScreen";
import OffersScreen from "./src/screens/OffersScreen";
import EntertainmentScreen from "./src/screens/EntertainmentScreen";
import EntertainmentLoginScreen from "./src/screens/EntertainmentLoginScreen";
import DetailScreen from "./src/screens/DetailScreen";
import MapTest from "./src/screens/MapTest";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
import CouponQRCodeScreen from "./src/screens/CouponQRCodeScreen";
import VerifyCodeScreen from "./src/screens/VerifyCodeScreen";
import OfferDetailScreen from "./src/screens/OfferDetailScreen";
import MxcBalanceScreen from './src/screens/MxcBalanceScreen';
import StoreScreen from './src/screens/StoreScreen';
import WalletScreen from './src/screens/WalletScreen';
import WalletCreationScreen from './src/screens/WalletCreationScreen';
import WalletLoginScreen from './src/screens/WalletLoginScreen';
import WalletEntryScreen from './src/screens/WalletEntryScreen';
import MarketScreen from './src/screens/MarketScreen';
import MigrateScreen from './src/screens/MigrateScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const { width, height } = Dimensions.get("window");

// Contenido personalizado del Drawer
const DrawerContent = (props) => {
  const { isDarkMode } = useTheme();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const getUserName = async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        setUserName(storedName || 'Usuario');
      } catch (error) {
        console.error('Error al obtener el nombre de usuario:', error);
      }
    };
    getUserName();
    const unsubscribe = props.navigation.addListener('focus', getUserName);
    return unsubscribe;
  }, [props.navigation]);

  return (
    <DrawerContentScrollView
      {...props}
      style={[styles.drawerContent, { backgroundColor: isDarkMode ? '#141414' : '#F5F5F5' }]}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={[styles.drawerHeader, { backgroundColor: isDarkMode ? '#14161e' : '#FFA41F' }]}>
        <FontAwesome5 name="user-circle" size={40} color={isDarkMode ? '#FFA41F' : '#f7fafc'} />
        <Text style={[styles.userName, { color: isDarkMode ? '#FFA41F' : '#f7fafc' }]}>
          ¡Hola, {userName}!
        </Text>
      </View>
      <DrawerItemList {...props} />  
      <View>
        <View style={styles.separator} />
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => Alert.alert('Redirección', 'Ir a Instagram')}
          >
            <FontAwesome5 name="instagram" size={24} color={isDarkMode ? '#FFA41F' : '#f7fafc'} />
            <Text style={[styles.socialText, { color: isDarkMode ? '#FFA41F' : '#f7fafc' }]}>
              Instagram
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => Alert.alert('Redirección', 'Ir a TikTok')}
          >
            <FontAwesome5 name="tiktok" size={24} color={isDarkMode ? '#FFA41F' : '#f7fafc'} />
            <Text style={[styles.socialText, { color: isDarkMode ? '#FFA41F' : '#f7fafc' }]}>
              TikTok
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() =>
            Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Cerrar Sesión',
                onPress: async () => {
                  await AsyncStorage.removeItem('token');
                  props.navigation.navigate('Login');
                },
              },
            ])
          }
        >
          <MaterialIcons name="logout" size={24} color={isDarkMode ? '#ff0000' : 'red'} />
          <Text style={[styles.logoutText, { color: isDarkMode ? '#F5F5F5' : 'red' }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

// Stack para la sección de entretenimiento
const EntertainmentStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="EntertainmentLogin" component={EntertainmentLoginScreen} />
    <Stack.Screen name="Entertainment" component={EntertainmentScreen} />
  </Stack.Navigator>
);

// Configuración del Drawer con tema
const HomeWithDrawer = () => {
  const { isDarkMode } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: isDarkMode ? "#f7fafc" : "#F5F5F5",
          width: width * 0.8,
        },
        drawerActiveTintColor: "#FFA41F",
        drawerInactiveTintColor: isDarkMode ? "#FFA41F" : "#555",
        drawerLabelStyle: {
          fontSize: 14,
          marginVertical: 5,
          color: isDarkMode ? "#F5F5F5" : "#000",
        },
        drawerContentScrollEnabled: true,
      }}
    >
      <Drawer.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ drawerIcon: ({ color }) => <FontAwesome5 name="home" size={20} color={color} /> }}
      />
      <Drawer.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ drawerIcon: ({ color }) => <FontAwesome5 name="user" size={20} color={color} /> }}
      />
      <Drawer.Screen
        name="Control"
        component={ControlScreen}
        options={{ drawerIcon: ({ color }) => <FontAwesome5 name="cogs" size={20} color={color} /> }}
      />
      <Drawer.Screen
        name="Vehiculo"
        component={VehiculoScreen}
        options={{ drawerIcon: ({ color }) => <FontAwesome5 name="car" size={20} color={color} /> }}
      />
      <Drawer.Screen
        name="Historial"
        component={HistorialScreen}
        options={{ drawerIcon: ({ color }) => <FontAwesome5 name="history" size={20} color={color} /> }}
      />
      <Drawer.Screen
        name="Gastos"
        component={GastosScreen}
        options={{ drawerIcon: () => <FontAwesome5 name="money-bill-wave" size={20} color="#FF0000" /> }}
      />
      <Drawer.Screen
        name="Ingresos"
        component={IngresosScreen}
        options={{ drawerIcon: () => <FontAwesome5 name="money-bill-wave" size={20} color="#77A345" /> }}
      />
      <Drawer.Screen
        name="Ajustes"
        component={SettingScreen}
        options={{ drawerIcon: ({ color }) => <FontAwesome5 name="wrench" size={20} color={color} /> }}
      />
      <Drawer.Screen
        name="Tienda"
        component={StoreScreen}
        options={{ drawerIcon: ({ color }) => <FontAwesome5 name="store" size={20} color={color} /> }}
      />
      <Drawer.Screen
        name="P2P"
        component={MarketScreen}
        options={{ drawerIcon: ({ color }) => <FontAwesome5 name="exchange-alt" size={20} color={color} /> }}
      />
      <Drawer.Screen
        name="Wallet"
        component={WalletEntryScreen}
        options={{ drawerIcon: ({ color }) => <FontAwesome5 name="wallet" size={20} color={color} /> }}
      />
      <Drawer.Screen
        name="Promo y Cupones"
        component={OffersScreen}
        options={{
          drawerIcon: ({ color }) => <FontAwesome5 name="gift" size={20} color={color} />,
          drawerLabel: () => (
            <Text style={{ color: isDarkMode ? "#F5F5F5" : "#000", fontSize: 16 }}>
              Promo y Cupones <Text style={{ color: '#FFA41F', fontSize: 12 }}>(Próximamente)</Text>
            </Text>
          ),
        }}
      />
      <Drawer.Screen
        name="Entretenimiento"
        component={EntertainmentStack}
        options={{
          drawerIcon: ({ color }) => <FontAwesome5 name="gamepad" size={20} color={color} />,
          drawerLabel: () => (
            <Text style={{ color: isDarkMode ? "#F5F5F5" : "#000", fontSize: 16 }}>
              Entretenimiento <Text style={{ color: '#FFA41F', fontSize: 12 }}>(Próximamente)</Text>
            </Text>
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// App Principal con manejo de tema y notificaciones push
export default function App() {
  const { isDarkMode } = useTheme();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);

  useEffect(() => {
    const getPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de notificación denegado');
        return;
      }
      const token = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(token.data);
      console.log('Token de notificación:', token.data);
    };
    getPermission();

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('Notificación recibida:', notification);
    });

    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Respuesta a la notificación:', response);
    });

    return () => {
      subscription.remove();
      backgroundSubscription.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerStyle: { backgroundColor: isDarkMode ? "#141414" : "#FFA41F" },
            headerTintColor: isDarkMode ? "#FFA41F" : "#000",
            headerTitleStyle: { fontWeight: "bold" },
            headerShown: false
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={HomeWithDrawer} />
          <Stack.Screen name="Vehiculo" component={VehiculoScreen} />
          <Stack.Screen name="DetailScreen" component={DetailScreen} />
          <Stack.Screen name="EntertainmentScreen" component={EntertainmentScreen} />
          <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyCodeScreen" component={VerifyCodeScreen} />
          <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
          <Stack.Screen name="CouponQRCode" component={CouponQRCodeScreen} />
          <Stack.Screen name="OfferDetail" component={OfferDetailScreen} />
          <Stack.Screen name="MxcBalanceScreen" component={MxcBalanceScreen} />
          <Stack.Screen name="StoreScreen" component={StoreScreen} />
          <Stack.Screen name="WalletScreen" component={WalletScreen} />
          <Stack.Screen name="WalletCreationScreen" component={WalletCreationScreen} />
          <Stack.Screen name="WalletLoginScreen" component={WalletLoginScreen} />
          <Stack.Screen name="WalletEntryScreen" component={WalletEntryScreen} />
          <Stack.Screen name="MarketScreen" component={MarketScreen} />
		  <Stack.Screen name="MigrateScreen" component={MigrateScreen} options={{ title: 'Migrar Tokens' }} />

        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  socialButtons: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 10, gap: 20 },
  socialButton: { alignItems: "center", justifyContent: "center", padding: 10 },
  socialText: { marginTop: 5, fontSize: 12, fontWeight: "bold", textAlign: "center" },
  drawerContent: { flex: 1, paddingTop: 0 },
  separator: { height: 1, backgroundColor: "#FFA41F", marginVertical: 10 },
  drawerHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
    marginTop: -50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  userName: { fontSize: 20, fontWeight: "bold", marginTop: 10, textAlign: "center" },
  footer: { paddingHorizontal: 0 },
  logoutButton: { flexDirection: "row", alignItems: "center", marginTop: 40 },
  logoutText: { marginLeft: 10, fontSize: 16 },
});