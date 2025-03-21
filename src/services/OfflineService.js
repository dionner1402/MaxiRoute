import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo'; // Add this dependency

// Make this configurable or use environment variables
const API_BASE_URL = 'http://192.168.40.5:5000';

const OfflineService = {
  // New method to check connectivity
  async isConnected() {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected && netInfo.isInternetReachable;
    } catch (error) {
      console.log('Error checking connectivity:', error);
      return false;
    }
  },

  async cacheData(key, data, expirationMinutes = 60) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiration: Date.now() + (expirationMinutes * 60 * 1000)
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
      return true;
    } catch (error) {
      console.error(`Error caching data for ${key}:`, error);
      return false;
    }
  },

  async getCachedData(key) {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      if (!cachedData) return null;
      
      const cacheItem = JSON.parse(cachedData);
      if (Date.now() > cacheItem.expiration) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error(`Error getting cached data for ${key}:`, error);
      return null;
    }
  },

  // Improved method with better error handling
  async performOfflineTransaction(type, amount, description) {
    try {
      const storedBalance = await AsyncStorage.getItem('walletBalance');
      const currentBalance = parseFloat(storedBalance || '100.0000');
      
      if (currentBalance < amount) {
        return {
          success: false,
          message: 'Saldo insuficiente'
        };
      }
      
      const newBalance = (currentBalance - amount).toFixed(4);
      await AsyncStorage.setItem('walletBalance', newBalance);
      
      // Registrar la transacción para sincronizar más tarde
      const transaction = {
        id: Date.now().toString(),
        type,
        amount,
        description,
        date: new Date().toISOString(),
        status: 'Pendiente de sincronización',
        synced: false
      };
      
      // Guardar en historial local
      const storedTransactions = await AsyncStorage.getItem('offlineTransactions');
      const transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
      transactions.push(transaction);
      await AsyncStorage.setItem('offlineTransactions', JSON.stringify(transactions));
      
      // Also update the regular wallet transactions history
      const walletTransactions = await AsyncStorage.getItem('walletTransactions');
      const walletTxs = walletTransactions ? JSON.parse(walletTransactions) : [];
      walletTxs.unshift({
        id: transaction.id,
        type,
        amount,
        date: transaction.date,
        status: 'Completado (Modo Offline)'
      });
      await AsyncStorage.setItem('walletTransactions', JSON.stringify(walletTxs));
      
      // Intentar sincronizar si hay conexión
      const isConnected = await this.isConnected();
      if (isConnected) {
        this.syncOfflineTransactions();
      }
      
      return {
        success: true,
        message: `${type} completada en modo offline`,
        newBalance
      };
    } catch (error) {
      console.error('Error al realizar transacción offline:', error);
      return {
        success: false,
        message: 'Error al procesar la transacción'
      };
    }
  },
  
  // Improved sync method with better endpoint handling
  async syncOfflineTransactions() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return false;
      
      const isConnected = await this.isConnected();
      if (!isConnected) return false;
      
      const storedTransactions = await AsyncStorage.getItem('offlineTransactions');
      if (!storedTransactions) return true;
      
      const transactions = JSON.parse(storedTransactions);
      const pendingTransactions = transactions.filter(t => !t.synced);
      
      if (pendingTransactions.length === 0) return true;
      
      let syncedCount = 0;
      
      for (const transaction of pendingTransactions) {
        try {
          // Verify server connectivity before attempting each sync
          const serverCheck = await axios.get(`${API_BASE_URL}/api/health`, { 
            timeout: 3000,
            validateStatus: (status) => status < 500 // Accept even 404 response as "server is up"
          }).catch(() => null);
          
          if (!serverCheck) {
            console.log('Server unreachable, aborting sync');
            break;
          }
          
          const response = await axios.post(
            `${API_BASE_URL}/api/users/wallet/sync`,
            {
              type: transaction.type,
              amount: transaction.amount,
              description: transaction.description,
              date: transaction.date
            },
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            }
          );
          
          if (response.data && response.data.success) {
            transaction.synced = true;
            transaction.status = 'Sincronizado';
            syncedCount++;
            console.log(`Transacción ${transaction.id} sincronizada correctamente`);
          }
        } catch (error) {
          // Check if it's a 404 error (endpoint not found)
          if (error.response && error.response.status === 404) {
            console.error(`Endpoint no encontrado para sincronizar transacción ${transaction.id}`, error);
            // Try alternative endpoint
            try {
              const alternativeResponse = await axios.post(
                `${API_BASE_URL}/api/transactions`,
                {
                  type: transaction.type,
                  amount: transaction.amount,
                  description: transaction.description,
                  date: transaction.date
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              if (alternativeResponse.data && alternativeResponse.data.success) {
                transaction.synced = true;
                transaction.status = 'Sincronizado';
                syncedCount++;
                console.log(`Transacción ${transaction.id} sincronizada usando endpoint alternativo`);
              }
            } catch (altError) {
              console.error(`Error al usar endpoint alternativo para transacción ${transaction.id}:`, altError);
            }
          } else {
            console.error(`Error al sincronizar transacción ${transaction.id}:`, error);
          }
        }
      }
      
      // Actualizar el storage con las transacciones actualizadas
      await AsyncStorage.setItem('offlineTransactions', JSON.stringify(transactions));
      
      // Actualizar saldo si se sincronizaron transacciones
      if (syncedCount > 0) {
        try {
          // Try the primary balance endpoint
          const balanceResponse = await axios.get(
            `${API_BASE_URL}/api/users/wallet/balance`,
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 3000
            }
          ).catch(async (error) => {
            // If 404, try alternative endpoint
            if (error.response && error.response.status === 404) {
              return await axios.get(
                `${API_BASE_URL}/api/wallet/balance`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
            throw error;
          });
          
          if (balanceResponse.data && balanceResponse.data.balance) {
            await AsyncStorage.setItem('walletBalance', balanceResponse.data.balance.toFixed(4));
          }
        } catch (balanceError) {
          console.error('Error al actualizar saldo después de sincronización:', balanceError);
        }
      }
      
      return syncedCount > 0;
    } catch (error) {
      console.error('Error al sincronizar transacciones:', error);
      return false;
    }
  },
  
  // New method to get server status
  async checkServerStatus() {
    try {
      const isConnected = await this.isConnected();
      if (!isConnected) {
        return { online: false, message: "No hay conexión a Internet" };
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 3000 })
        .catch(error => {
          // We'll accept any response from the server as "online"
          if (error.response) {
            return { data: { status: "degraded" } };
          }
          throw error;
        });
      
      return { 
        online: true, 
        serverStatus: response.data.status || "available",
        message: "Servidor disponible"
      };
    } catch (error) {
      return { 
        online: false, 
        serverStatus: "unavailable",
        message: "No se puede conectar al servidor" 
      };
    }
  }
};

export default OfflineService;