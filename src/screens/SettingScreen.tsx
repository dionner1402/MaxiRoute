import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

export default function SettingScreen({ navigation }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const { t } = useTranslation(); // Hook para traducciones

  // Función para manejar el guardado de configuraciones
  const handleSaveSettings = () => {
    Alert.alert(t('alerts.success'), t('settings.saveSuccess'));
  };

  // Ajustar el estilo del header según el modo oscuro
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? '#141414' : '#EDF2F7',
      },
      headerTintColor: isDarkMode ? '#EDF2F7' : '#333',
    });
  }, [navigation, isDarkMode]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#141414' : '#EDF2F7' }]}>
      {/* Sección: Apariencia */}
      <View style={[styles.section, { backgroundColor: isDarkMode ? '#14161e' : '#EDF2F7' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#EDF2F7' : '#333' }]}>
          {t('settings.appearance')}
        </Text>
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceTextContainer}>
            <FontAwesome5 name="moon" size={20} color={isDarkMode ? '#ccc' : '#333'} />
            <Text style={[styles.preferenceText, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t('settings.darkMode')}
            </Text>
          </View>
          <Switch value={isDarkMode} onValueChange={toggleTheme} />
        </View>
      </View>

      {/* Sección: Notificaciones */}
      <View style={[styles.section, { backgroundColor: isDarkMode ? '#14161e' : '#EDF2F7' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#EDF2F7' : '#333' }]}>
          {t('settings.notifications')}
        </Text>
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceTextContainer}>
            <FontAwesome5 name="bell" size={20} color={isDarkMode ? '#ccc' : '#333'} />
            <Text style={[styles.preferenceText, { color: isDarkMode ? '#ccc' : '#333' }]}>
              {t('settings.enableNotifications')}
            </Text>
          </View>
          <Switch value={isNotificationsEnabled} onValueChange={setIsNotificationsEnabled} />
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FFA41F' }]}
          onPress={() => Alert.alert(t('settings.customizeNotifications'), t('alerts.warning'))}
        >
          <Text style={[styles.actionButtonText, { color: isDarkMode ? '#141414' : '#EDF2F7' }]}>
            {t('settings.customizeNotifications')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sección: Seguridad */}
      <View style={[styles.section, { backgroundColor: isDarkMode ? '#14161e' : '#EDF2F7' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#EDF2F7' : '#333' }]}>
          {t('settings.security')}
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FFA41F' }]}
          onPress={() => Alert.alert(t('settings.changePassword'), t('alerts.warning'))}
        >
          <Text style={[styles.actionButtonText, { color: isDarkMode ? '#141414' : '#EDF2F7' }]}>
            {t('settings.changePassword')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sección: Cuenta */}
      <View style={[styles.section, { backgroundColor: isDarkMode ? '#14161e' : '#EDF2F7' }]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#EDF2F7' : '#333' }]}>
          {t('settings.account')}
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FFA41F' }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={[styles.actionButtonText, { color: isDarkMode ? '#141414' : '#EDF2F7' }]}>
            {t('settings.editPersonalInfo')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FFA41F' }]}
          onPress={() => Alert.alert(t('settings.managePrivacy'), t('alerts.warning'))}
        >
          <Text style={[styles.actionButtonText, { color: isDarkMode ? '#141414' : '#EDF2F7' }]}>
            {t('settings.managePrivacy')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón Guardar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#FFA41F' }]}
          onPress={handleSaveSettings}
        >
          <Text style={[styles.saveButtonText, { color: isDarkMode ? '#141414' : '#EDF2F7' }]}>
            {t('settings.saveSettings')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  preferenceTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    fontSize: 16,
    marginLeft: 10,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  saveButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});