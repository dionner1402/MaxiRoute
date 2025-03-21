// src/screens/SplashScreen.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

const SplashScreen: React.FC<any> = ({ navigation }) => {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace("Login"); // Navegar a la pantalla de login después de 2 segundos
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla Publicidad Splash</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A2028",
  },
  title: {
    fontSize: 30,
    color: "#FFA41F",
    fontWeight: "bold",
  },
});

export default SplashScreen;