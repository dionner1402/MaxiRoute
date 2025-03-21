import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ethers } from 'ethers';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';

const API_URL = 'http://192.168.40.5:5000';

const WalletScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [balance, setBalance] = useState({ MXC: '0.00', CMXC: '0.00' });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assets');
  const [showMnemonicModal, setShowMnemonicModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState('MXC');
  const [qrModalVisible, setQrModalVisible] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchBalanceAndTransactions();
    }
  }, [walletAddress]);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      const mnemonicKey = `walletMnemonic_${userId}`;
      let storedMnemonic = await AsyncStorage.getItem(mnemonicKey);

      if (!storedMnemonic) {
        setLoading(false);
        navigation.replace('WalletCreationScreen');
        return;
      }

      const walletAuthenticated = await AsyncStorage.getItem('walletAuthenticated');
      if (walletAuthenticated !== 'true') {
        setLoading(false);
        navigation.replace('WalletLoginScreen');
        return;
      }

      setMnemonic(storedMnemonic);
      const wallet = ethers.Wallet.fromPhrase(storedMnemonic);
      setWalletAddress(wallet.address);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo cargar la wallet');
      console.error(error);
    }
  };

  const fetchBalanceAndTransactions = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Debes iniciar sesión');
        return;
      }

      const balanceResponse = await axios.get(
        `${API_URL}/api/wallet/balance/${walletAddress}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (balanceResponse.data.success) {
        setBalance(balanceResponse.data.balance);
      }

      const txResponse = await axios.get(
        `${API_URL}/api/wallet/transactions/${walletAddress}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (txResponse.data.success) {
        setTransactions(txResponse.data.transactions);
      }

      setRefreshing(false);
    } catch (error) {
      console.error('Error al obtener datos de la wallet:', error);
      setRefreshing(false);
      Alert.alert('Error', 'No se pudieron obtener los datos de la wallet');
    }
  };

  const refreshWallet = async () => {
    setRefreshing(true);
    await fetchBalanceAndTransactions();
  };

  const transferToWallet = async () => {
    if (!amount || !toAddress || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Por favor ingresa una cantidad válida y una dirección de destino');
      return;
    }

    try {
      setTransferLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Debes iniciar sesión');
        setTransferLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/users/transfer`,
        { 
          amount, 
          toAddress, 
          fromAddress: walletAddress,
          tokenType: selectedToken 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTransferLoading(false);

      if (response.data.success) {
        Alert.alert('Éxito', `Transferencia realizada. Tx: ${response.data.txHash}`);
        setAmount('');
        setToAddress('');
        await fetchBalanceAndTransactions();
      } else {
        Alert.alert('Error', response.data.error || 'No se pudo realizar la transferencia');
      }
    } catch (error) {
      setTransferLoading(false);
      Alert.alert('Error', error.response?.data?.error || 'Error en la transferencia');
    }
  };

  const copyAddressToClipboard = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copiado', 'Dirección de wallet copiada al portapapeles');
  };

  const copyMnemonicToClipboard = async () => {
    await Clipboard.setStringAsync(mnemonic);
    Alert.alert('Copiado', 'Frase semilla copiada al portapapeles');
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const renderAssetTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceTitle}>Balance Total</Text>
        <View style={styles.tokenBalances}>
          <View style={styles.tokenBalance}>
            <View style={styles.tokenIconContainer}>
              <Icon name="logo-bitcoin" size={24} color="#FFA41F" />
            </View>
            <Text style={styles.tokenName}>MXC</Text>
            <Text style={styles.tokenAmount}>{balance.MXC}</Text>
          </View>
          <View style={styles.tokenBalance}>
            <View style={styles.tokenIconContainer}>
              <Icon name="logo-usd" size={24} color="#FFA41F" />
            </View>
            <Text style={styles.tokenName}>C-MXC</Text>
            <Text style={styles.tokenAmount}>{balance.CMXC}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setQrModalVisible(true)}>
          <View style={styles.actionIconContainer}>
            <Icon name="qr-code-outline" size={24} color="#FFA41F" />
          </View>
          <Text style={styles.actionText}>Recibir</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setActiveTab('send')}
        >
          <View style={styles.actionIconContainer}>
            <Icon name="send-outline" size={24} color="#FFA41F" />
          </View>
          <Text style={styles.actionText}>Enviar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowMnemonicModal(true)}>
          <View style={styles.actionIconContainer}>
            <Icon name="key-outline" size={24} color="#FFA41F" />
          </View>
          <Text style={styles.actionText}>Semilla</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Historial de Transacciones</Text>
      {transactions.length === 0 ? (
        <View style={styles.emptyTransactions}>
          <Icon name="document-outline" size={48} color="#a0aec0" />
          <Text style={styles.emptyText}>No hay transacciones para mostrar</Text>
        </View>
      ) : (
        <View style={styles.transactionsContainer}>
          {transactions.map((tx, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.txIconContainer}>
                <Icon 
                  name={tx.type === 'in' ? 'arrow-down-outline' : 'arrow-up-outline'} 
                  size={20} 
                  color={tx.type === 'in' ? '#48bb78' : '#f56565'} 
                />
              </View>
              <View style={styles.txDetails}>
                <Text style={styles.txType}>
                  {tx.type === 'in' ? 'Recibido' : 'Enviado'} {tx.token}
                </Text>
                <Text style={styles.txAddress}>
                  {tx.type === 'in' ? 'De: ' : 'Para: '}
                  {shortenAddress(tx.type === 'in' ? tx.from : tx.to)}
                </Text>
                <Text style={styles.txDate}>{formatDate(tx.timestamp)}</Text>
              </View>
              <Text 
                style={[styles.txAmount, tx.type === 'in' ? styles.txReceived : styles.txSent]}
              >
                {tx.type === 'in' ? '+' : '-'}{tx.amount}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderSendTab = () => (
    <View style={styles.sendTabContent}>
      <Text style={styles.sendTitle}>Enviar Fondos</Text>

      <View style={styles.tokenSelector}>
        <TouchableOpacity 
          style={[styles.tokenOption, selectedToken === 'MXC' && styles.selectedToken]}
          onPress={() => setSelectedToken('MXC')}
        >
          <Icon name="logo-bitcoin" size={20} color={selectedToken === 'MXC' ? '#fff' : '#FFA41F'} />
          <Text style={[styles.tokenOptionText, selectedToken === 'MXC' && styles.selectedTokenText]}>MXC</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tokenOption, selectedToken === 'CMXC' && styles.selectedToken]}
          onPress={() => setSelectedToken('CMXC')}
        >
          <Icon name="logo-usd" size={20} color={selectedToken === 'CMXC' ? '#fff' : '#FFA41F'} />
          <Text style={[styles.tokenOptionText, selectedToken === 'CMXC' && styles.selectedTokenText]}>C-MXC</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Dirección de Destino</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            value={toAddress}
            onChangeText={setToAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.inputIcon}>
            <Icon name="scan-outline" size={20} color="#FFA41F" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Cantidad</Text>
        <View style={styles.amountContainer}>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <View style={styles.maxButtonContainer}>
            <TouchableOpacity 
              style={styles.maxButton}
              onPress={() => setAmount(balance[selectedToken])}
            >
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
            <Text style={styles.tokenSymbol}>{selectedToken}</Text>
          </View>
        </View>
        <Text style={styles.balanceAvailable}>
          Disponible: {balance[selectedToken]} {selectedToken}
        </Text>
      </View>

      <LinearGradient
        colors={['#FFA41F', '#e88f0c']}
        style={styles.gradientSendButton}
      >
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={transferToWallet}
          disabled={transferLoading}
        >
          {transferLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="send" size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Enviar</Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <TouchableOpacity 
        style={styles.cancelSendButton}
        onPress={() => {
          setActiveTab('assets');
          setAmount('');
          setToAddress('');
        }}
      >
        <Text style={styles.cancelSendButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQRModal = () => (
    <Modal
      visible={qrModalVisible}
      transparent={true}
      animationType="slide"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.qrModalContent}>
          <Text style={styles.qrModalTitle}>Tu Dirección de Wallet</Text>
          <View style={styles.qrCodeContainer}>
            {walletAddress && (
              <QRCode
                value={walletAddress}
                size={200}
                color="#000"
                backgroundColor="#fff"
              />
            )}
          </View>
          <Text style={styles.addressLabel}>Dirección</Text>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>{walletAddress}</Text>
            <TouchableOpacity onPress={copyAddressToClipboard}>
              <Icon name="copy-outline" size={20} color="#FFA41F" />
            </TouchableOpacity>
          </View>
          <Text style={styles.qrNote}>
            Comparte esta dirección para recibir tokens en tu wallet
          </Text>
          
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={() => setQrModalVisible(false)}
          >
            <Text style={styles.closeModalButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderMnemonicModal = () => (
    <Modal
      visible={showMnemonicModal}
      transparent={true}
      animationType="slide"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.mnemonicModalContent}>
          <Text style={styles.mnemonicModalTitle}>Tu Frase Semilla</Text>
          
          <View style={styles.warningContainer}>
            <Icon name="warning-outline" size={24} color="#f5a623" />
            <Text style={styles.warningText}>
              IMPORTANTE: Guarda esta frase en un lugar seguro. Es la única forma de recuperar tu wallet.
              Nunca compartas esta frase con nadie.
            </Text>
          </View>

          <View style={styles.seedPhraseContainer}>
            <Text style={styles.seedPhrase}>{mnemonic}</Text>
          </View>

          <TouchableOpacity 
            style={styles.copyMnemonicButton}
            onPress={copyMnemonicToClipboard}
          >
            <Icon name="copy-outline" size={20} color="#fff" />
            <Text style={styles.copyMnemonicButtonText}>Copiar Frase Semilla</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeMnemonicButton}
            onPress={() => setShowMnemonicModal(false)}
          >
            <Text style={styles.closeMnemonicButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA41F" />
        <Text style={styles.loadingText}>Cargando wallet...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.walletTitle}>Mi Wallet</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings-outline" size={24} color="#4a5568" />
        </TouchableOpacity>
      </View>

      <View style={styles.addressRow}>
        <Text style={styles.addressLabel}>Dirección:</Text>
        <Text style={styles.addressText} numberOfLines={1}>
          {shortenAddress(walletAddress)}
        </Text>
        <TouchableOpacity onPress={copyAddressToClipboard}>
          <Icon name="copy-outline" size={20} color="#FFA41F" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshWallet} />
        }
      >
        {activeTab === 'assets' ? renderAssetTab() : renderSendTab()}
      </ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'assets' && styles.activeTab]}
          onPress={() => setActiveTab('assets')}
        >
          <Icon 
            name="wallet-outline" 
            size={24} 
            color={activeTab === 'assets' ? '#FFA41F' : '#a0aec0'} 
          />
          <Text style={[styles.tabText, activeTab === 'assets' && styles.activeTabText]}>
            Activos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'send' && styles.activeTab]}
          onPress={() => setActiveTab('send')}
        >
          <Icon 
            name="send-outline" 
            size={24} 
            color={activeTab === 'send' ? '#FFA41F' : '#a0aec0'} 
          />
          <Text style={[styles.tabText, activeTab === 'send' && styles.activeTabText]}>
            Enviar
          </Text>
        </TouchableOpacity>
      </View>

      {renderQRModal()}
      {renderMnemonicModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#718096',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  walletTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  addressLabel: {
    fontSize: 14,
    color: '#718096',
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#4a5568',
    flex: 1,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sendTabContent: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 12,
  },
  tokenBalances: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tokenBalance: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  tokenIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenName: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  tokenAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#4a5568',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 12,
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#a0aec0',
    textAlign: 'center',
  },
  transactionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  txIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  txAddress: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    color: '#a0aec0',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  txReceived: {
    color: '#48bb78',
  },
  txSent: {
    color: '#f56565',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#FFA41F',
  },
  tabText: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 4,
  },
  activeTabText: {
    color: '#FFA41F',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 24,
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    width: '100%',
  },
  addressLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#4a5568',
    flex: 1,
    marginRight: 8,
  },
  qrNote: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  mnemonicModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  mnemonicModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff9db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f5a623',
  },
  warningText: {
    color: '#744210',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  seedPhraseContainer: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 20,
  },
  seedPhrase: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2d3748',
    fontFamily: 'Courier',
  },
  copyMnemonicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFA41F',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
  },
  copyMnemonicButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  closeMnemonicButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  closeMnemonicButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  sendTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 20,
  },
  tokenSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tokenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginRight: 10,
  },
  selectedToken: {
    backgroundColor: '#FFA41F',
    borderColor: '#FFA41F',
  },
  tokenOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginLeft: 6,
  },
  selectedTokenText: {
    color: 'white',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2d3748',
  },
  inputIcon: {
    padding: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2d3748',
  },
  maxButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  maxButton: {
    backgroundColor: '#EDF2F7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFA41F',
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  balanceAvailable: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  gradientSendButton: {
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  cancelSendButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  cancelSendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  }
});

export default WalletScreen;