import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
// Opcional: usar una librería como react-native-qrcode-svg para mostrar el QR
import QRCode from 'react-native-qrcode-svg';

const CouponQRCodeScreen = ({ route }) => {
  const { couponId } = route.params;
  const { isDarkMode } = useTheme();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQRData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await axios.get(`http://192.168.40.5:5000/api/coupons/${couponId}/qr`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQrData(response.data.data);
      } catch (error) {
        console.error('Error loading QR data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadQRData();
  }, [couponId]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a2232' : '#F5F5F5' }]}>
        <ActivityIndicator size="large" color="#FFA41F" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a2232' : '#F5F5F5' }]}>
      <Text style={[styles.title, { color: isDarkMode ? '#F5F5F5' : '#2d3436' }]}>
        Escanea este código QR
      </Text>
      {qrData ? (
        <QRCode
          value={qrData}
          size={200}
          color={isDarkMode ? '#FFFFFF' : '#000000'}
          backgroundColor={isDarkMode ? '#1a2232' : '#F5F5F5'}
        />
      ) : (
        <Text style={{ color: 'red' }}>No se pudo cargar el QR</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default CouponQRCodeScreen;