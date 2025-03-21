import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  TextInput, 
  Animated, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const API_URL = 'http://192.168.40.5:5000';

const getWalletColors = (isDarkMode: boolean) => ({
  primary: '#FFA41F',
  background: isDarkMode ? '#141414' : '#f7fafc',
  textPrimary: isDarkMode ? '#e2e8f0' : '#f7fafc',
  textSecondary: isDarkMode ? '#94a3b8' : '#cbd5e0',
  borders: isDarkMode ? '#2d3748' : '#334155',
  cardBackground: isDarkMode ? '#1e1e1e' : '#1e1e1e',
  success: isDarkMode ? '#34d399' : '#48bb78',
  error: isDarkMode ? '#ef4444' : '#f56565',
  warning: isDarkMode ? '#f59e0b' : '#f5a623',
  inputBackground: isDarkMode ? '#252525' : '#252525',
});

const TokenOption = ({ title, balance, selected, onSelect, icon }) => {
  const { isDarkMode } = useTheme();
  const colors = getWalletColors(isDarkMode);
  return (
    <TouchableOpacity 
      style={[
        styles.tokenOption, 
        selected && { ...styles.tokenOptionSelected, borderColor: colors.primary },
        { backgroundColor: colors.inputBackground }
      ]} 
      onPress={onSelect}
    >
      <View style={[styles.tokenIconContainer, { backgroundColor: selected ? colors.primary : colors.cardBackground }]}>
        <Icon name={icon} size={22} color={selected ? '#141414' : colors.textSecondary} />
      </View>
      <View style={styles.tokenInfo}>
        <Text style={[styles.tokenTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.tokenBalance, { color: colors.textSecondary }]}>{balance}</Text>
      </View>
      <View style={styles.radioContainer}>
        <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.textSecondary }]}>
          {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MigrateScreen = ({ navigation }) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [mxcBalance, setMxcBalance] = useState('0.0000');
  const [cMxcBalance, setCMxcBalance] = useState('0.0000');
  const [selectedToken, setSelectedToken] = useState('MXC');
  const [amount, setAmount] = useState('');
  const [amountFocused, setAmountFocused] = useState(false);
  const animatedValue = useState(new Animated.Value(0))[0];
  const { isDarkMode } = useTheme();
  const colors = getWalletColors(isDarkMode);

  const loadBalances = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          // Obtener saldo de C-MXC
          const userResponse = await axios.get(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCMxcBalance(userResponse.data.cMxcBalance.toFixed(4));

          // Obtener saldo de MXC disponible (solo los validados)
          const mxcResponse = await axios.get(`${API_URL}/api/users/mxc/transactions`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const availableMxcBalance = mxcResponse.data
            .filter((item) => item.status === 'Validado')
            .reduce((sum, item) => sum + parseFloat(item.mxcAmount || 0), 0)
            .toFixed(4);

          setMxcBalance(availableMxcBalance);
        } catch (error) {
          console.error('Error al obtener saldos:', error);
          if (error.response) {
            Alert.alert('Error', `Error del servidor: ${error.response.status}`);
          } else if (error.request) {
            Alert.alert('Error', 'No se pudo conectar al servidor. Verifica tu conexión a internet.');
          } else {
            Alert.alert('Error', 'Ocurrió un error inesperado');
          }
        }
      } else {
        const storedMxcMinedList = await AsyncStorage.getItem('mxcMinedList');
        if (storedMxcMinedList) {
          const parsedData = JSON.parse(storedMxcMinedList);
          const availableMxcBalance = parsedData
            .filter((item) => item.status === 'Validado')
            .reduce((sum, item) => sum + parseFloat(item.mxcAmount || 0), 0)
            .toFixed(4);
          setMxcBalance(availableMxcBalance);
        } else {
          setMxcBalance('0.0000');
          setCMxcBalance('0.0000');
        }
      }
    } catch (error) {
      console.error('Error al cargar saldos:', error);
      Alert.alert('Error', 'No se pudieron cargar los saldos');
    }
  };

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    loadBalances();
  }, []);

  const requestMigration = async () => {
    if (!amount) {
      Alert.alert("Error", "Ingresa una cantidad para migrar");
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (selectedToken === 'MXC' && amountValue > parseFloat(mxcBalance)) {
      Alert.alert("Error", "No tienes suficiente saldo MXC disponible");
      return;
    } else if (selectedToken === 'C-MXC' && amountValue > parseFloat(cMxcBalance)) {
      Alert.alert("Error", "No tienes suficiente saldo C-MXC");
      return;
    }
    
    setIsMigrating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "Debes iniciar sesión");
        setIsMigrating(false);
        return;
      }
      // Llama a la API para migrar tokens
      const response = await axios.post(
        `${API_URL}/api/users/migrate-mxc`,
        { amount, tokenType: selectedToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        Alert.alert("Éxito", "Migración realizada correctamente");
        loadBalances();
        setAmount('');
      } else {
        Alert.alert("Error", response.data.error || "Error en la migración");
      }
    } catch (error) {
      console.error('Error en la migración:', error);
      Alert.alert("Error", "No se pudo realizar la migración");
    } finally {
      setIsMigrating(false);
    }
  };

  const setMaxAmount = () => {
    if (selectedToken === 'MXC') {
      setAmount(mxcBalance);
    } else {
      setAmount(cMxcBalance);
    }
  };

  const openTermsAndConditions = () => {
    Linking.openURL('https://example.com/terms-migration');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView}>
          <Animated.View 
            style={[
              styles.container, 
              {
                opacity: animatedValue,
                transform: [{
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.header}>
              <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: colors.inputBackground }]} 
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Migrar Tokens</Text>
              <TouchableOpacity 
                style={[styles.helpButton, { backgroundColor: colors.inputBackground }]} 
                onPress={() => Alert.alert(
                  "Información", 
                  "La migración de tokens te permite convertir entre MXC y C-MXC. Los C-MXC se usarán para servicios internos y, tras migrar, aparecerán como disponibles en tu wallet."
                )}
              >
                <Icon name="help-circle-outline" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Selecciona el Token</Text>
              <TokenOption 
                title="MXC Token" 
                balance={mxcBalance} 
                selected={selectedToken === 'MXC'} 
                onSelect={() => setSelectedToken('MXC')} 
                icon="wallet-outline" 
              />
              <TokenOption 
                title="C-MXC Token" 
                balance={cMxcBalance} 
                selected={selectedToken === 'C-MXC'} 
                onSelect={() => setSelectedToken('C-MXC')} 
                icon="card-outline" 
              />
              
              <View style={styles.amountContainer}>
                <View style={styles.amountLabelContainer}>
                  <Text style={[styles.amountLabel, { color: colors.textPrimary }]}>Cantidad a migrar</Text>
                  <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
                    Disponible: {selectedToken === 'MXC' ? mxcBalance : cMxcBalance}
                  </Text>
                </View>
                <View style={[
                  styles.inputContainer, 
                  amountFocused && { ...styles.inputContainerFocused, borderColor: colors.primary },
                  { borderColor: colors.borders, backgroundColor: colors.inputBackground }
                ]}>
                  <TextInput 
                    style={[styles.amountInput, { color: colors.textPrimary }]} 
                    placeholder="0.00" 
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    onFocus={() => setAmountFocused(true)}
                    onBlur={() => setAmountFocused(false)}
                  />
                  <TouchableOpacity 
                    style={[styles.maxButton, { backgroundColor: colors.primary }]}
                    onPress={setMaxAmount}
                  >
                    <Text style={styles.maxButtonText}>MAX</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.estimateContainer}>
                <Text style={[styles.estimateLabel, { color: colors.textSecondary }]}>
                  Recibirás aproximadamente:
                </Text>
                <Text style={[styles.estimateAmount, { color: colors.textPrimary }]}>
                  {amount ? parseFloat(amount).toFixed(4) : '0.0000'} {selectedToken === 'MXC' ? 'C-MXC' : 'MXC'}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.migrateButton, 
                  isMigrating && styles.migrateButtonDisabled, 
                  { backgroundColor: colors.primary }
                ]}
                onPress={requestMigration}
                disabled={isMigrating}
              >
                {isMigrating ? (
                  <ActivityIndicator color="#141414" />
                ) : (
                  <>
                    <Icon name="swap-horizontal" size={20} color="#141414" />
                    <Text style={styles.migrateButtonText}>Migrar Tokens</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.disclaimerContainer}>
              <Icon name="alert-circle-outline" size={16} color={colors.textSecondary} style={styles.disclaimerIcon} />
              <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                La migración de tokens puede tardar hasta 30 minutos en completarse. Durante este período, los tokens estarán bloqueados y no podrás realizar transacciones con ellos.
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.termsContainer} 
              onPress={openTermsAndConditions}
            >
              <Text style={[styles.termsText, { color: colors.primary }]}>
                Términos y condiciones de migración
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  helpButton: {
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  tokenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tokenOptionSelected: {
    borderWidth: 1,
  },
  tokenIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tokenBalance: {
    fontSize: 14,
  },
  radioContainer: {
    marginLeft: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  amountContainer: {
    marginVertical: 20,
  },
  amountLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderWidth: 2,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  maxButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  maxButtonText: {
    color: '#141414',
    fontWeight: 'bold',
    fontSize: 12,
  },
  estimateContainer: {
    backgroundColor: 'rgba(255, 164, 31, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: 14,
  },
  estimateAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  migrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  migrateButtonDisabled: {
    opacity: 0.6,
  },
  migrateButtonText: {
    color: '#141414',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  disclaimerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  termsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  termsText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default MigrateScreen;
