import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Transaction {
  _id: string;
  type: 'transfer' | 'recharge' | 'offline-sync' | 'coupon-conversion';
  amount: number;
  fee?: number;
  total: number;
  date: string;
  coupon?: {
    _id: string;
    title: string;
    description: string;
  };
}

export default function MxcBalanceScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const [mxcMinedList, setMxcMinedList] = useState([]);
  const [cMxcTransactions, setCMxcTransactions] = useState<Transaction[]>([]);
  const [cMxcBalance, setCMxcBalance] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const BASE_URL = 'http://192.168.40.5:5000';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          // Obtener el saldo de cMXC del usuario y sus transacciones
          const [userResponse, mxcResponse, cMxcResponse] = await Promise.all([
            axios.get(`${BASE_URL}/api/users/me`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${BASE_URL}/api/mxc/transactions`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${BASE_URL}/api/cmxc/transactions`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);

          setCMxcBalance(userResponse.data.cMxcBalance.toFixed(4));
          setMxcMinedList(mxcResponse.data || []);
          setCMxcTransactions(cMxcResponse.data || []);

          await AsyncStorage.setItem('mxcMinedList', JSON.stringify(mxcResponse.data));
        } catch (serverError) {
          console.error('Error al obtener datos del servidor:', serverError);
          if (serverError.response) {
            Alert.alert('Error', `Error del servidor: ${serverError.response.status}`);
          } else if (serverError.request) {
            Alert.alert('Error', 'No se pudo conectar al servidor. Verifica tu conexión a internet.');
          } else {
            Alert.alert('Error', 'Ocurrió un error inesperado');
          }
        }
      } else {
        const storedMxcMinedList = await AsyncStorage.getItem('mxcMinedList');
        if (storedMxcMinedList) {
          setMxcMinedList(JSON.parse(storedMxcMinedList));
        } else {
          setMxcMinedList([]);
          setCMxcBalance('0.00');
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const resetMxc = async () => {
    try {
      await AsyncStorage.removeItem('mxcMinedList');
      setMxcMinedList([]);
      setCMxcBalance('0.00');
      Alert.alert('Éxito', 'Los datos de MXC han sido reiniciados');
    } catch (error) {
      console.error('Error al reiniciar MXC:', error);
      Alert.alert('Error', 'No se pudieron reiniciar los datos de MXC');
    }
  };

  const totalMxcBalance = mxcMinedList
    .reduce((sum, item) => sum + parseFloat(item.mxcAmount || 0), 0)
    .toFixed(2);

  const unverifiedMxcBalance = mxcMinedList
    .filter((item) => item.status === 'Procesando')
    .reduce((sum, item) => sum + parseFloat(item.mxcAmount || 0), 0)
    .toFixed(2);

  const availableMxcBalance = mxcMinedList
    .filter((item) => item.status === 'Validado')
    .reduce((sum, item) => sum + parseFloat(item.mxcAmount || 0), 0)
    .toFixed(2);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Procesando':
        return '#FFA500';
      case 'Validado':
        return '#4CAF50';
      case 'Rechazado':
        return '#F44336';
      default:
        return '#AAAAAA';
    }
  };

  const formatDateTime = (timestamp) => (timestamp ? new Date(timestamp).toLocaleString() : 'N/A');

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'coupon-conversion':
        return 'ticket-outline';
      case 'transfer':
        return 'swap-horizontal';
      case 'recharge':
        return 'add-circle-outline';
      case 'offline-sync':
        return 'sync-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getTransactionTitle = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'coupon-conversion':
        return transaction.coupon?.title || 'Conversión de Cupón';
      case 'transfer':
        return 'Transferencia';
      case 'recharge':
        return 'Recarga';
      case 'offline-sync':
        return 'Sincronización';
      default:
        return 'Transacción';
    }
  };

  const filteredTransactions = () => {
    switch (activeFilter) {
      case 'MXC':
        return mxcMinedList;
      case 'C-MXC':
        return cMxcTransactions;
      default:
        return [...mxcMinedList, ...cMxcTransactions].sort((a, b) => 
          new Date(b.date || b.timestamp).getTime() - new Date(a.date || a.timestamp).getTime()
        );
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <Text style={[styles.pageTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>Gestión de Activos</Text>

      {/* Sección de MXC Token */}
      <LinearGradient
        colors={isDarkMode ? ['#2D2D3A', '#1E1E1E'] : ['#FFFFFF', '#F9F9F9']}
        style={styles.cardContainer}
      >
        <View style={styles.cardHeader}>
          <View style={styles.tokenIconContainer}>
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenIconText}>M</Text>
            </View>
          </View>
          <View style={styles.tokenTitleContainer}>
            <Text style={[styles.tokenTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>MXC Token</Text>
            <Text style={[styles.tokenSubtitle, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>Token de Minado</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#2D2D3A' : '#E0E0E0' }]} />

        <View style={styles.balanceGrid}>
          <View style={styles.balanceCol}>
            <Text style={[styles.balanceLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
              Total MXC
            </Text>
            <Text style={[styles.balanceValue, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
              {totalMxcBalance}
            </Text>
          </View>

          <View style={styles.balanceCol}>
            <Text style={[styles.balanceLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
              En Proceso
            </Text>
            <Text style={[styles.balanceValue, { color: isDarkMode ? '#FFA500' : '#FFA500' }]}>
              {unverifiedMxcBalance}
            </Text>
          </View>

          <View style={styles.balanceCol}>
            <Text style={[styles.balanceLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
              Disponible
            </Text>
            <Text style={[styles.balanceValue, { color: isDarkMode ? '#4CAF50' : '#4CAF50' }]}>
              {availableMxcBalance}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Sección de C-MXC Token */}
      <LinearGradient
        colors={isDarkMode ? ['#2D2D3A', '#1E1E1E'] : ['#FFFFFF', '#F9F9F9']}
        style={styles.cardContainer}
      >
        <View style={styles.cardHeader}>
          <View style={styles.tokenIconContainer}>
            <View style={[styles.tokenIcon, { backgroundColor: '#E6F7FF' }]}>
              <Text style={[styles.tokenIconText, { color: '#0088CC' }]}>C</Text>
            </View>
          </View>
          <View style={styles.tokenTitleContainer}>
            <Text style={[styles.tokenTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>C-MXC Token</Text>
            <Text style={[styles.tokenSubtitle, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>Token Convertible</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#2D2D3A' : '#E0E0E0' }]} />

        <View style={styles.cMxcBalanceContainer}>
          <Text style={[styles.balanceLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
            Saldo Total
          </Text>
          <Text style={[styles.cMxcBalanceValue, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
            {cMxcBalance} C-MXC
          </Text>
        </View>

        <TouchableOpacity
          style={styles.migrateButton}
          onPress={() => navigation.navigate('MigrateScreen')}
        >
          <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
          <Text style={styles.migrateButtonText}>Migrar C-MXC Tokens</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Sección de Transacciones */}
      <LinearGradient
        colors={isDarkMode ? ['#2D2D3A', '#1E1E1E'] : ['#FFFFFF', '#F9F9F9']}
        style={styles.transactionsContainer}
      >
        <View style={styles.transactionHeader}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
            Transacciones
          </Text>

          <View style={styles.filterTabs}>
            {['All', 'MXC', 'C-MXC'].map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  activeFilter === filter && styles.activeFilterTab,
                  { backgroundColor: isDarkMode ? '#232936' : '#F0F0F0' }
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === filter && styles.activeFilterTabText,
                    { color: activeFilter === filter ? '#FFA41F' : (isDarkMode ? '#AAAAAA' : '#666666') }
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFA41F" />
            <Text style={[styles.loadingText, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
              Cargando transacciones...
            </Text>
          </View>
        ) : filteredTransactions().length > 0 ? (
          filteredTransactions().map((item, index) => (
            <View
              key={item._id || index}
              style={[
                styles.transactionItem,
                { backgroundColor: isDarkMode ? '#232936' : '#F8F8F8' },
                index === filteredTransactions().length - 1 ? { marginBottom: 0 } : {}
              ]}
            >
              {'type' in item ? (
                // Renderizar transacción C-MXC
                <>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionIconContainer}>
                      <Ionicons
                        name={getTransactionIcon(item.type)}
                        size={24}
                        color="#FFA41F"
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                        {getTransactionTitle(item as Transaction)}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(item.date).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={[styles.amountText, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                        {item.total.toFixed(2)} C-MXC
                      </Text>
                      {item.fee !== undefined && (
                        <Text style={styles.feeText}>
                          Fee: {item.fee.toFixed(2)} C-MXC
                        </Text>
                      )}
                    </View>
                  </View>
                  {(item as Transaction).coupon?.description && (
                    <Text style={[styles.description, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                      {(item as Transaction).coupon?.description}
                    </Text>
                  )}
                </>
              ) : (
                // Renderizar transacción MXC
                <>
                  <View style={styles.transactionHeader}>
                    <Text style={[styles.transactionId, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                      {item.tripId ? `ID: ${item.tripId}` : 'ID: N/A'}
                    </Text>
                    <View style={styles.tokenTypeContainer}>
                      <Text style={[
                        styles.tokenType,
                        {
                          backgroundColor: isDarkMode ? '#1A1E26' : '#EEEEEE',
                          color: '#FFA41F'
                        }
                      ]}>
                        MXC
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(item.status)}20` }
                      ]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.transactionDetails}>
                    <View>
                      <Text style={[styles.transactionAmount, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                        {item.mxcAmount} MXC
                      </Text>
                      <Text style={[styles.transactionSource, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                        {item.source || 'Minado'}
                      </Text>
                    </View>
                    <Text style={[styles.transactionDate, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                      {formatDateTime(item.timestamp)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="document-text-outline" size={48} color={isDarkMode ? '#444' : '#DDD'} />
            <Text style={[styles.noDataText, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
              No hay transacciones disponibles
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Botón de reinicio para pruebas (oculto en producción) */}
      <TouchableOpacity onPress={resetMxc} style={styles.resetButton}>
        <Text style={styles.resetButtonText}>Reiniciar MXC (Testing)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardContainer: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  tokenIconContainer: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  tokenIcon: {
    backgroundColor: '#FFE0BB',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    color: '#FFA41F',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tokenTitleContainer: {
    flex: 1,
  },
  tokenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tokenSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  balanceGrid: {
    flexDirection: 'row',
    padding: 16,
  },
  balanceCol: {
    flex: 1,
    padding: 8,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cMxcBalanceContainer: {
    padding: 16,
  },
  cMxcBalanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  migrateButton: {
    backgroundColor: '#FFA41F',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 8,
    padding: 14,
  },
  migrateButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  transactionsContainer: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterTabs: {
    flexDirection: 'row',
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeFilterTab: {
    backgroundColor: 'rgba(255, 164, 31, 0.15)',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterTabText: {
    fontWeight: 'bold',
  },
  transactionItem: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 164, 31, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tokenTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenType: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  transactionId: {
    fontSize: 14,
  },
  statusBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  feeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionSource: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    marginLeft: 52,
  },
  noDataContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  resetButton: {
    backgroundColor: '#E74C3C',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
});