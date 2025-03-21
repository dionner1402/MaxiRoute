import axios, { InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración del API
const DEV_API_URL = 'http://192.168.40.5:5000';
const PROD_API_URL = 'https://api.tudominio.com'; // Cambiar cuando esté en producción

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// Configuración de endpoints
export const ENDPOINTS = {
    // Auth
    LOGIN: '/api/users/login',
    REGISTER: '/api/users/register',
    VERIFY_TOKEN: '/api/users/verify',
    
    // Wallet
    WALLET_BALANCE: '/api/users/wallet/balance',
    WALLET_TRANSACTIONS: '/api/users/wallet/transactions',
    WALLET_TRANSFER: '/api/users/wallet/transfer',
    
    // Store
    STORE_PRODUCTS: '/api/store/products',
    STORE_PURCHASE: '/api/store/purchase',
    
    // Market P2P
    MARKET_OFFERS: '/api/market/offers',
    MARKET_CREATE_OFFER: '/api/market/offers',
    MARKET_BUY_OFFER: '/api/market/offers/buy',
    MARKET_CANCEL_OFFER: '/api/market/offers/cancel',
    
    // Coupons
    COUPONS: '/api/coupons',
    CLAIM_COUPON: '/api/coupons/claim',
    CONVERT_COUPON: '/api/coupons/convert',
    
    // MXC
    MXC_TRANSACTIONS: '/api/mxc/transactions',
    MXC_BALANCE: '/api/mxc/balance',
    
    // C-MXC
    CMXC_TRANSACTIONS: '/api/cmxc/transactions',
    CMXC_BALANCE: '/api/cmxc/balance'
};

// Configuración de headers
export const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

// Cliente axios configurado
export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000
});

// Interceptor para agregar headers de autenticación
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const headers = await getAuthHeaders();
    config.headers.set('Content-Type', headers['Content-Type']);
    config.headers.set('Authorization', headers['Authorization']);
    return config;
});
