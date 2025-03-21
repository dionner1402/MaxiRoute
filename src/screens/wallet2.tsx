const renderSendTab = () => (
  <View style={styles.sendTabContent}>
    <Text style={styles.sendTitle}>Enviar Fondos</Text>
    
    {/* Token Selection Section */}
    <View style={styles.tokenSelector}>
      <TouchableOpacity
        style={[styles.tokenOption, selectedToken === 'MXC' && styles.selectedToken]}
        onPress={() => setSelectedToken('MXC')}
      >
        <Icon name="logo-bitcoin" size={20} color={selectedToken === 'MXC' ? '#fff' : '#FFA41F'} />
        <Text style={[styles.tokenOptionText, selectedToken === 'MXC' && styles.selectedTokenText]}>
          MXC
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tokenOption, selectedToken === 'CMXC' && styles.selectedToken]}
        onPress={() => setSelectedToken('CMXC')}
      >
        <Icon name="logo-usd" size={20} color={selectedToken === 'CMXC' ? '#fff' : '#FFA41F'} />
        <Text style={[styles.tokenOptionText, selectedToken === 'CMXC' && styles.selectedTokenText]}>
          C-MXC
        </Text>
      </TouchableOpacity>
    </View>
    
    {/* Recipient Address Section */}
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
        <TouchableOpacity style={styles.inputIcon} onPress={() => setScanQRVisible(true)}>
          <Icon name="scan-outline" size={20} color="#FFA41F" />
        </TouchableOpacity>
      </View>
      {toAddress.length > 0 && !toAddress.startsWith('0x') && (
        <Text style={styles.inputWarning}>
          La dirección debe comenzar con '0x'
        </Text>
      )}
    </View>
    
    {/* Amount Section */}
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Cantidad</Text>
      <View style={styles.amountContainer}>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={amount}
          onChangeText={(text) => {
            // Solo permitir números y un punto decimal
            if (/^\d*\.?\d*$/.test(text)) {
              setAmount(text);
            }
          }}
          keyboardType="decimal-pad"
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
      {amount && parseFloat(amount) > parseFloat(balance[selectedToken]) && (
        <Text style={styles.inputWarning}>
          Fondos insuficientes
        </Text>
      )}
    </View>
    
    {/* Fee Estimation */}
    <View style={styles.feeContainer}>
      <Text style={styles.feeLabel}>Comisión estimada:</Text>
      <Text style={styles.feeAmount}>0.001 {selectedToken}</Text>
    </View>
    
    {/* Transaction Summary */}
    {amount && parseFloat(amount) > 0 && (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Resumen de Transacción</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Enviar:</Text>
          <Text style={styles.summaryValue}>{amount} {selectedToken}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Comisión:</Text>
          <Text style={styles.summaryValue}>0.001 {selectedToken}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Total:</Text>
          <Text style={styles.summaryTotalValue}>
            {(parseFloat(amount) + 0.001).toFixed(4)} {selectedToken}
          </Text>
        </View>
      </View>
    )}
    
    {/* Send Button */}
    <LinearGradient 
      colors={['#FFA41F', '#4454e8']} 
      style={[
        styles.gradientSendButton,
        (!amount || !toAddress || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance[selectedToken])) && 
        styles.disabledGradientButton
      ]}
    >
      <TouchableOpacity 
        style={styles.sendButton} 
        onPress={transferToWallet} 
        disabled={transferLoading || !amount || !toAddress || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance[selectedToken])}
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
    
    {/* Cancel Button */}
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

// Estilos existentes y nuevos
const styles = StyleSheet.create({
  // ... Mantén los estilos existentes
  
  // Estilos nuevos para las características añadidas
  inputWarning: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  
  feeLabel: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
  
  feeAmount: {
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '600',
  },
  
  summaryContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  
  summaryLabel: {
    fontSize: 14,
    color: '#4a5568',
  },
  
  summaryValue: {
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '500',
  },
  
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
  },
  
  summaryTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3748',
  },
  
  disabledGradientButton: {
    opacity: 0.6,
  },
});