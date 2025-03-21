import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Cargar el estado del tema desde AsyncStorage
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem('theme');
      setIsDarkMode(storedTheme === 'dark');
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light'); // Guardar estado
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
