const { ethers } = require('ethers');


// blockchain.js



// Validate private key
if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length !== 64) {
    throw new Error('Invalid private key format in .env');
}

// Configuración del proveedor
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_URL);

// Wallet de la aplicación
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ABI del contrato (ajusta según tu contrato real)
const contractABI = [
    "function transfer(address to, uint256 amount) public returns (bool)",


    "function balanceOf(address account) public view returns (uint256)"
];

// Instancia del contrato
const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    contractABI,
    wallet
);

// Función para transferir tokens
async function transferTokens(toAddress, amount) {
    try {
        const tx = await contract.transfer(toAddress, ethers.parseUnits(amount.toString(), 18));
        await tx.wait();
        return { success: true, txHash: tx.hash };
    } catch (error) {
        console.error('Error al transferir tokens:', error);
        return { success: false, error: error.message };
    }
}

// Función para consultar saldo
async function getBalance(address) {
    try {
        const balance = await contract.balanceOf(address);
        return ethers.formatUnits(balance, 18);
    } catch (error) {
        console.error('Error al consultar saldo:', error);
        return null;
    }
}

module.exports = { transferTokens, getBalance };