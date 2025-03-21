import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.40.5:5000';

const MarketScreen = () => {
  const [offers, setOffers] = useState([]);
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/market/offers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las ofertas');
    }
  };

  const createOffer = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/market/offers`,
        { amount, price },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', 'Oferta creada');
      setAmount('');
      setPrice('');
      fetchOffers();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo crear la oferta');
    }
  };

  const buyOffer = async (offerId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/market/offers/buy`,
        { offerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', 'Compra realizada');
      fetchOffers();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo comprar');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Mercado P2P</Text>
      <TextInput
        placeholder="Cantidad de C-MXC"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
      />
      <TextInput
        placeholder="Precio"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
      />
      <Button title="Crear Oferta" onPress={createOffer} />
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
            <Text>{item.amount} C-MXC por {item.price}</Text>
            <Button title="Comprar" onPress={() => buyOffer(item.id)} />
          </View>
        )}
      />
    </View>
  );
};

export default MarketScreen;