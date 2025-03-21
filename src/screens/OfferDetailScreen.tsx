import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Tipos para los parámetros de navegación
type RootStackParamList = {
  Offers: { refresh?: boolean };
  CouponQRCodeScreen: { couponId: string };
  OfferDetail: { offerId: string; justClaimed?: boolean };
};

// Tipos para las props del componente
type OfferDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OfferDetail'>;
type OfferDetailScreenRouteProp = RouteProp<RootStackParamList, 'OfferDetail'>;

interface Props {
  navigation: OfferDetailScreenNavigationProp;
  route: OfferDetailScreenRouteProp;
}

// Tipos para el cupón (basado en tu modelo Coupon.js)
interface Coupon {
  _id: string;
  title: string;
  description: string;
  image: string;
  expiry: string;
  quantity: number;
  terms?: string;
  benefitType: string;
  cMxcValue: number;
  conversionFee: number;
  value?: number; // Campo opcional usado en el frontend
  category?: string; // Campo opcional usado en el frontend
  rating?: number; // Campo opcional usado en el frontend
  ratingCount?: number; // Campo opcional usado en el frontend
}

// Tipos para la respuesta del usuario
interface UserResponse {
  claimedCoupons: { _id: string }[];
  convertedCoupons: { _id: string }[];
}

const OfferDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { isDarkMode } = useTheme();
  const [offer, setOffer] = useState<Coupon | null>(null);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
  const [isConverted, setIsConverted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { offerId, justClaimed } = route.params;

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { 
        backgroundColor: isDarkMode ? '#1a2232' : '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: isDarkMode ? '#FFA41F' : '#333333',
      headerTitle: "",
      headerTransparent: true,
    });

    if (justClaimed) {
      setIsClaimed(true);
    }

    loadCouponDetails();
  }, [offerId, navigation, isDarkMode, justClaimed]);

  const loadCouponDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token de autenticación');
        return;
      }

      console.log('Cargando detalles del cupón:', offerId);
      const API_BASE_URL = 'http://192.168.40.5:5000/api';
      const response = await axios.get(`${API_BASE_URL}/coupons/${offerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del servidor:', response.data);
      setOffer(response.data);

      const tokenUser = await AsyncStorage.getItem('token');
      if (!tokenUser) {
        Alert.alert('Error', 'No se encontró el token de autenticación');
        navigation.goBack();
        return;
      }

      const userResponse = await axios.get<UserResponse>(`${API_BASE_URL}/users/me`, {
        headers: { 
          'Authorization': `Bearer ${tokenUser}`,
          'Content-Type': 'application/json'
        }
      });

      const claimedCoupons = userResponse.data.claimedCoupons || [];
      const convertedCoupons = userResponse.data.convertedCoupons || [];

      setIsClaimed(claimedCoupons.some(c => c._id === offerId));
      setIsConverted(convertedCoupons.some(c => c._id === offerId));

    } catch (error: any) {
      console.error('Error al cargar detalles del cupón:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar detalles del cupón';
      Alert.alert('Error', errorMessage);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimCoupon = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !offer) return;

      const API_BASE_URL = 'http://192.168.40.5:5000/api';

      const response = await axios.post(
        `${API_BASE_URL}/coupons/claim`,
        { couponId: offer._id },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.message) {
        Alert.alert('Éxito', response.data.message);
        setIsClaimed(true);
        loadCouponDetails();
      }
    } catch (error: any) {
      console.error('Error al reclamar cupón:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo reclamar el cupón';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleConvertCoupon = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !offer) return;

      const API_BASE_URL = 'http://192.168.40.5:5000/api';

      const response = await axios.post(
        `${API_BASE_URL}/coupons/convert`,
        { couponId: offer._id },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.message) {
        Alert.alert('Éxito', response.data.message);
        setIsConverted(true);
        loadCouponDetails();
      }
    } catch (error: any) {
      console.error('Error al convertir cupón:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo convertir el cupón';
      Alert.alert('Error', errorMessage);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
        <ActivityIndicator size="large" color="#FFA41F" />
        <Text style={{ color: isDarkMode ? '#FFFFFF' : '#333333', marginTop: 15 }}>
          Cargando oferta...
        </Text>
      </View>
    );
  }

  if (!offer) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
        <Ionicons name="alert-circle-outline" size={60} color="#FFA41F" />
        <Text style={{ color: isDarkMode ? '#FFFFFF' : '#333333', marginTop: 15 }}>
          No se pudo cargar la oferta
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const colors = {
    background: isDarkMode ? '#1a2232' : '#F5F5F5',
    cardBackground: isDarkMode ? '#232f3e' : '#FFFFFF',
    textPrimary: isDarkMode ? '#F5F5F5' : '#2d3436',
    textSecondary: isDarkMode ? '#bbbbbb' : '#636e72',
    accent: '#FFA41F',
    border: isDarkMode ? '#37474f' : '#dfe6e9',
  };

  const getButtonGradient = (type: string): string[] => {
    switch (type) {
      case 'claim':
        return ['#FFA41F', '#FF8C00'];
      case 'convert':
        return ['#4CAF50', '#2E7D32'];
      case 'disabled':
        return ['#9E9E9E', '#757575'];
      default:
        return ['#FFA41F', '#FF8C00'];
    }
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: offer.image }} style={styles.image} resizeMode="cover" />
          <LinearGradient colors={['transparent', colors.background]} style={styles.imageGradient} />
        </View>

        <View style={styles.contentWrapper}>
          <View style={[styles.content, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{offer.title}</Text>
              {offer.category && (
                <View style={[styles.categoryBadge, { backgroundColor: `${colors.accent}20` }]}>
                  <Text style={[styles.categoryText, { color: colors.accent }]}>{offer.category}</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesome5
                    key={star}
                    name="star"
                    size={14}
                    color={star <= (offer.rating || 5) ? colors.accent : '#D1D1D1'}
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>
                ({offer.ratingCount || '124'} valoraciones)
              </Text>
            </View>

            <View style={styles.infoCardsContainer}>
              <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#2a3446' : '#F9F9F9' }]}>
                <MaterialIcons name="access-time" size={20} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.textPrimary }]}>Válido hasta</Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{offer.expiry}</Text>
              </View>
              <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#2a3446' : '#F9F9F9' }]}>
                <MaterialIcons name="label-outline" size={20} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.textPrimary }]}>Valor</Text>
                <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
                  {offer.value} MXC
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={[styles.descriptionTitle, { color: colors.textPrimary }]}>Descripción</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{offer.description}</Text>

            <View style={styles.divider} />

            <Text style={[styles.termsTitle, { color: colors.textPrimary }]}>Términos y Condiciones</Text>
            <Text style={[styles.terms, { color: colors.textSecondary }]}>
              {offer.terms ||
                '• Esta oferta está sujeta a disponibilidad.\n• No acumulable con otras promociones.\n• Válido sólo en los establecimientos participantes.\n• Sólo puedes reclamar este cupón una vez.'}
            </Text>

            <View style={styles.actionsContainer}>
              {isConverted ? (
                <View style={styles.convertedContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={styles.convertedText}>Cupón convertido a C-MXC</Text>
                </View>
              ) : isClaimed ? (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('CouponQRCodeScreen', { couponId: offerId })}
                    style={styles.primaryButton}
                  >
                    <LinearGradient colors={getButtonGradient('claim')} style={styles.buttonGradient}>
                      <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Mostrar Código QR</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleConvertCoupon} style={styles.secondaryButton}>
                    <LinearGradient colors={getButtonGradient('convert')} style={styles.buttonGradient}>
                      <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Convertir a C-MXC</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity onPress={handleClaimCoupon} style={styles.fullWidthButton}>
                    <LinearGradient colors={getButtonGradient('claim')} style={styles.buttonGradient}>
                      <Ionicons name="ticket-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Reclamar Cupón</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFA41F',
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  imageContainer: {
    height: 280,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  contentWrapper: {
    marginTop: -40,
    paddingBottom: 30,
  },
  content: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  titleContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  ratingCount: {
    fontSize: 14,
  },
  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginVertical: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginVertical: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  terms: {
    fontSize: 14,
    lineHeight: 22,
  },
  actionsContainer: {
    marginTop: 30,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  secondaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullWidthButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  convertedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 15,
    borderRadius: 12,
  },
  convertedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 8,
  },
});

export default OfferDetailScreen;