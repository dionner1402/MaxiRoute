import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import DropDownPicker from 'react-native-dropdown-picker';

const gamesData = [
  {
    id: 1,
    title: 'Dominó Clásico',
    description: 'Juega al clásico juego de fichas con amigos',
    image: 'https://images.unsplash.com/photo-1610890716171-6b1b8b69d15d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
    players: '2-4',
    difficulty: 'Media',
  },
  {
    id: 2,
    title: 'Uno Challenge',
    description: 'Diversión rápida con cartas coloridas',
    image: 'https://images.unsplash.com/photo-1612355523016-4a8b4b40f1b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
    players: '2-6',
    difficulty: 'Fácil',
  },
  {
    id: 3,
    title: 'Parchís Real',
    description: 'Carrera estratégica de fichas',
    image: 'https://images.unsplash.com/photo-1589985270825-4b7a573a5a99?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
    players: '2-4',
    difficulty: 'Baja',
  },
  {
    id: 4,
    title: 'Scrabble Pro',
    description: 'Demuestra tu vocabulario',
    image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400d7e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
    players: '2-4',
    difficulty: 'Alta',
  },
];

const EntertainmentScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState('');
  const [age, setAge] = useState('');
  const [dobText, setDobText] = useState('');
  const [gender, setGender] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [registeredId, setRegisteredId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [openGender, setOpenGender] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: 'Masculino', value: 'Masculino' },
    { label: 'Femenino', value: 'Femenino' },
    { label: 'Otro', value: 'Otro' },
  ]);

  const colors = {
    background: isDarkMode ? '#1a2232' : '#EDF2F7',
    headerBackground: isDarkMode ? '#2a3447' : '#FFA41F',
    cardBackground: isDarkMode ? '#232f3e' : '#F5F5F5',
    textPrimary: isDarkMode ? '#F5F5F5' : '#2d3436',
    textSecondary: isDarkMode ? '#bbbbbb' : '#636e72',
    accent: '#FFA41F',
    border: isDarkMode ? '#37474f' : '#dfe6e9',
  };

  const handleDobChange = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    let formatted = '';
    if (cleaned.length > 0) formatted = cleaned.slice(0, 2);
    if (cleaned.length >= 3) formatted += '/' + cleaned.slice(2, 4);
    if (cleaned.length >= 5) formatted += '/' + cleaned.slice(4, 8);
    setDobText(formatted);
    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const birthDate = new Date(year, month, day);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge.toString());
    } else {
      setAge('');
    }
  };

  const handleSubmit = async () => {
    if (!userId || !age || !dobText || !gender || !termsAccepted) {
      Alert.alert('Error', 'Todos los campos son obligatorios y debes aceptar los términos.');
      return;
    }
    if (parseInt(age, 10) < 18) {
      Alert.alert('Error', 'Debes ser mayor de 18 años para jugar.');
      return;
    }
    const suffix = '#' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const fullUserId = userId + suffix;
    try {
      const allIds = await AsyncStorage.getItem('allGameIds');
      const registeredIds = allIds ? JSON.parse(allIds) : [];
      registeredIds.push(fullUserId);
      await AsyncStorage.setItem('allGameIds', JSON.stringify(registeredIds));
      await AsyncStorage.setItem('gameUserId', fullUserId);
      await AsyncStorage.setItem('gameUserAge', age);
      await AsyncStorage.setItem('gameUserGender', gender);
      await AsyncStorage.setItem('gameUserDOB', dobText);
      setRegisteredId(fullUserId);
      setModalVisible(false);
      Alert.alert('Éxito', 'Datos registrados correctamente.');
    } catch (error) {
      console.error('Error al guardar datos:', error);
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedId = await AsyncStorage.getItem('gameUserId');
        if (storedId) {
          setRegisteredId(storedId);
          setModalVisible(false);
        } else {
          setRegisteredId(null);
          setModalVisible(true);
        }
        setIsReady(true);
      } catch (error) {
        console.error('Error al cargar ID:', error);
        setIsReady(true);
      }
    };
    initialize();
  }, []);

  if (!isReady) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {registeredId && (
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
            Bienvenido: {registeredId}
          </Text>
        </View>
      )}
      <View style={[styles.headerContainer, { backgroundColor: colors.headerBackground }]}>
        <Text style={[styles.headerText, { color: isDarkMode ? '#F5F5F5' : '#2d3436' }]}>🎮 Juegos</Text>
        <View style={styles.subHeader}>
          <MaterialIcons name="sports-esports" size={20} color={isDarkMode ? '#FFA41F' : '#2d3436'} />
          <Text style={[styles.subHeaderText, { color: isDarkMode ? '#FFA41F' : '#2d3436' }]}>
            4 juegos disponibles
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.cardContainer}>
          {gamesData.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.accent }]}
            >
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={styles.badgeText}>NUEVO</Text>
              </View>
              <Image source={{ uri: game.image }} style={styles.cardImage} resizeMode="cover" />
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{game.title}</Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  {game.description}
                </Text>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="people" size={16} color={colors.accent} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{game.players}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="star" size={16} color={colors.accent} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{game.difficulty}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} activeOpacity={0.9}>
                  <Text style={styles.buttonText}>JUGAR AHORA</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#232f3e' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Registro para Juegos</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#EDF2F7' : '#f9f9f9', color: colors.textPrimary }]}
              placeholder="ID o Nick"
              placeholderTextColor={colors.textSecondary}
              value={userId}
              onChangeText={setUserId}
            />
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#EDF2F7' : '#f9f9f9', color: colors.textPrimary }]}
              placeholder="Edad"
              placeholderTextColor={colors.textSecondary}
              value={age}
              keyboardType="numeric"
              editable={false}
            />
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#EDF2F7' : '#f9f9f9', color: colors.textPrimary }]}
              placeholder="Fecha de Nacimiento (dd/mm/yyyy)"
              placeholderTextColor={colors.textSecondary}
              value={dobText}
              onChangeText={handleDobChange}
              keyboardType="numeric"
            />
            <DropDownPicker
              open={openGender}
              value={gender}
              items={genderItems}
              setOpen={setOpenGender}
              setValue={setGender}
              setItems={setGenderItems}
              placeholder="Selecciona tu sexo"
              style={[styles.dropdown, { backgroundColor: isDarkMode ? '#EDF2F7' : '#f9f9f9', borderColor: colors.border }]}
              textStyle={{ color: colors.textPrimary }}
              dropDownContainerStyle={{ backgroundColor: isDarkMode ? '#EDF2F7' : '#f9f9f9', borderColor: colors.border }}
            />
            <View style={styles.checkboxContainer}>
              <Checkbox
                value={termsAccepted}
                onValueChange={setTermsAccepted}
                color={termsAccepted ? colors.accent : undefined}
              />
              <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>
                He leído y acepto los términos y condiciones
              </Text>
            </View>
            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.accent }]} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Registrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  welcomeContainer: { padding: 15 },
  welcomeText: { fontSize: 18, fontWeight: 'bold' },
  headerContainer: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerText: { fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  subHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  subHeaderText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  scrollContainer: { padding: 15 },
  cardContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', marginBottom: 15, borderRadius: 15, borderWidth: 2, overflow: 'hidden', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 },
  badge: { position: 'absolute', top: 10, right: -25, paddingVertical: 4, paddingHorizontal: 30, transform: [{ rotateZ: '45deg' }], zIndex: 1 },
  badgeText: { color: '#2d3436', fontWeight: '800', fontSize: 12, letterSpacing: 0.8 },
  cardImage: { width: '100%', height: 120, borderBottomWidth: 2, borderColor: '#FFA41F' },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardDescription: { fontSize: 12, lineHeight: 16, marginBottom: 10 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
  button: { borderRadius: 20, paddingVertical: 8, alignItems: 'center' },
  buttonText: { color: '#2d3436', fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '80%', padding: 20, borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { height: 50, borderWidth: 1, borderColor: '#FFA41F', borderRadius: 5, paddingHorizontal: 10, marginBottom: 15 },
  dropdown: { height: 50, borderWidth: 1, borderColor: '#FFA41F', borderRadius: 5, marginBottom: 15 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkboxLabel: { marginLeft: 8, fontSize: 14 },
  submitButton: { paddingVertical: 10, borderRadius: 5, alignItems: 'center' },
  submitButtonText: { color: '#2d3436', fontWeight: 'bold', fontSize: 16 },
});

export default EntertainmentScreen;