import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const API_BASE_URL = 'http://192.168.40.5:5000/api';

type RootStackParamList = {
  OfferDetail: { offerId: string };
  Offers: { refresh?: boolean };
  Home: undefined;
  Profile: undefined;
  // Añade aquí otras rutas según sea necesario
};

type OffersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Offers'>;
type OffersScreenRouteProp = RouteProp<RootStackParamList, 'Offers'>;

interface Coupon {
  _id: string;
  title: string;
  description: string;
  image: string;
  expiry: string;
  terms?: string;
}

interface Props {
  navigation: OffersScreenNavigationProp;
}

const OffersScreen: React.FC<Props> = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const route = useRoute<OffersScreenRouteProp>();
  const [offers, setOffers] = useState<Coupon[]>([]);
  const [claimedCoupons, setClaimedCoupons] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (route.params?.refresh) {
      loadData();
    }
  }, [route.params?.refresh]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    const timer = setInterval(updateTimer, 1000);
    updateTimer();

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      console.log('Iniciando carga de datos...');
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('No se encontró token');
        return;
      }

      console.log('Token encontrado, haciendo petición a:', `${API_BASE_URL}/coupons`);
      
      const [couponsResponse, userResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/coupons`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      console.log('Respuesta de usuario:', userResponse.data);
      setClaimedCoupons(userResponse.data.claimedCoupons || []);
      setOffers(couponsResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleClaimCoupon = async (couponId: string) => {
    try {
      if (!couponId) {
        console.error('ID de cupón inválido:', couponId);
        Alert.alert('Error', 'ID de cupón no válido');
        return;
      }
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token de autenticación');
        return;
      }

      console.log('Intentando reclamar cupón con ID:', couponId);
      const data = { couponId };
      console.log('Enviando datos:', data);

      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/coupons/claim`,
        data,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del servidor:', response.data);

      if (response.data.message) {
        await loadData();
        Alert.alert('Éxito', response.data.message);
      } else {
        Alert.alert('Error', 'No se pudo reclamar el cupón');
      }
    } catch (error: any) {
      console.error('Error al reclamar cupón:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo reclamar el cupón';
      console.error('Mensaje de error:', errorMessage);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleConvertCoupon = async (couponId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post<{ success: boolean, message: string, newBalance: number }>(
        `${API_BASE_URL}/coupons/convert`,
        { couponId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadData();
      Alert.alert('Éxito', response.data.message || 'Cupón convertido exitosamente');
    } catch (error) {
      console.error('Error al convertir cupón:', error);
      Alert.alert('Error', 'No se pudo convertir el cupón');
    }
  };

  const colors = {
    background: isDarkMode ? '#1a2232' : '#f8f9fa',
    headerBackground: isDarkMode ? '#2a3447' : '#FFA41F',
    cardBackground: isDarkMode ? '#232f3e' : '#F5F5F5',
    textPrimary: isDarkMode ? '#F5F5F5' : '#2d3436',
    textSecondary: isDarkMode ? '#bbbbbb' : '#636e72',
    accent: '#FFA41F',
    border: isDarkMode ? '#37474f' : '#dfe6e9',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: colors.headerBackground }]}>
        <Text style={[styles.headerText, { color: isDarkMode ? '#F5F5F5' : '#2d3436' }]}>
          🔥 Ofertas Especiales
        </Text>
        <View style={styles.timerContainer}>
          <MaterialIcons name="timer" size={18} color={isDarkMode ? '#FFA41F' : '#2d3436'} />
          <Text style={[styles.timerText, { color: isDarkMode ? '#FFA41F' : '#2d3436' }]}>
            {timeRemaining} restante
          </Text>
        </View>
      </View>

      {offers && offers.map((offer) => (
        <TouchableOpacity
          key={offer._id}
          onPress={() => navigation.navigate('OfferDetail', { offerId: offer._id })}
          activeOpacity={0.9}
          style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.accent }]}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: offer.image }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{offer.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {offer.description}
            </Text>
            <View style={styles.footer}>
              <Text style={[styles.termsText, { color: colors.textSecondary }]}>{offer.terms}</Text>
              {claimedCoupons.includes(offer._id) ? (
                <View style={[styles.button, { backgroundColor: '#ccc' }]}>
                  <Text style={styles.buttonText}>Reclamado</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    console.log('Presionado botón OBTENER para cupón:', offer._id);
                    handleClaimCoupon(offer._id);
                  }}
                  style={[styles.button, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.buttonText}>OBTENER</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 15,
  },
  headerText: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerText: { fontSize: 15, fontWeight: '600' },
  card: {
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 15,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    borderBottomWidth: 2,
    borderColor: '#FFA41F',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 15,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 5, letterSpacing: 0.3 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  termsText: { fontSize: 12, flex: 1 },
  button: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  buttonText: { color: '#2d3436', fontWeight: '700', fontSize: 14 },
});

export default OffersScreen;