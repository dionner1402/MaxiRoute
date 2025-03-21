import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import DropDownPicker from 'react-native-dropdown-picker';
import { useTheme } from '../context/ThemeContext';

const EntertainmentLoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDarkMode } = useTheme();

  const [userId, setUserId] = useState('');
  const [age, setAge] = useState('');
  const [dobText, setDobText] = useState(''); // Formato dd/mm/yyyy
  const [gender, setGender] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [openGender, setOpenGender] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: 'Masculino', value: 'Masculino' },
    { label: 'Femenino', value: 'Femenino' },
    { label: 'Otro', value: 'Otro' },
  ]);

  // Colores adaptados al tema
  const colors = {
    background: isDarkMode ? '#1a2232' : '#EDF2F7',
    textPrimary: isDarkMode ? '#F5F5F5' : '#2d3436',
    textSecondary: isDarkMode ? '#bbbbbb' : '#636e72',
    accent: '#FFA41F',
    border: isDarkMode ? '#37474f' : '#dfe6e9',
    inputBackground: isDarkMode ? '#232f3e' : '#ffffff',
  };

  // Función para formatear la fecha al escribir (dd/mm/yyyy)
  const handleDobChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    let formatted = '';
    if (cleaned.length > 0) formatted = cleaned.slice(0, 2);
    if (cleaned.length >= 3) formatted += '/' + cleaned.slice(2, 4);
    if (cleaned.length >= 5) formatted += '/' + cleaned.slice(4, 8);
    setDobText(formatted);
    // Si se completan 10 caracteres, se calcula la edad automáticamente
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
    if (age === '' || parseInt(age, 10) < 18) {
      Alert.alert('Error', 'Debes ser mayor de 18 años para jugar.');
      return;
    }
    // Genera un sufijo único de 4 dígitos y arma el identificador completo
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
      navigation.replace('Entertainment');
    } catch (error) {
      console.error('Error al guardar datos:', error);
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Registro para Entretenimiento
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
        placeholder="ID o Nick"
        placeholderTextColor={colors.textSecondary}
        value={userId}
        onChangeText={setUserId}
      />
      <TextInput
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
        placeholder="Fecha de Nacimiento (dd/mm/yyyy)"
        placeholderTextColor={colors.textSecondary}
        value={dobText}
        onChangeText={handleDobChange}
        keyboardType="numeric"
      />
      <TextInput
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
        placeholder="Edad"
        placeholderTextColor={colors.textSecondary}
        value={age}
        keyboardType="numeric"
        editable={false}
      />
      <DropDownPicker
        open={openGender}
        value={gender}
        items={genderItems}
        setOpen={setOpenGender}
        setValue={setGender}
        setItems={setGenderItems}
        placeholder="Selecciona tu sexo"
        style={[
          styles.dropdown,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
        textStyle={{ color: colors.textPrimary }}
        dropDownContainerStyle={{
          backgroundColor: colors.inputBackground,
          borderColor: colors.border,
        }}
        placeholderStyle={{ color: colors.textSecondary }}
        arrowIconStyle={{ tintColor: colors.textPrimary }}
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
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.accent }]}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Registrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  submitButton: {
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#2d3436',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EntertainmentLoginScreen;