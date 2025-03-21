import React, { createContext, useState, useContext } from "react";

// Crear un contexto para el tema
const ThemeContext = createContext();

// Hook para acceder al contexto
export const useTheme = () => useContext(ThemeContext);

// Proveedor del contexto
export const ThemeProvider = ({ children }) => {
  // Estado para el modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Función para cambiar el modo
  const toggleDarkMode = () => setIsDarkMode((prevMode) => !prevMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
