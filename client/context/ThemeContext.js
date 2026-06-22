import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then((val) => {
      if (val === 'true') setIsDarkMode(true);
    });
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem('darkMode', next.toString());
      return next;
    });
  };

  const currentTheme = isDarkMode ? {
    background: '#1E1E1E',
    surface: '#2D2D2D',
    text: '#FFFFFF',
    textLight: '#CCCCCC',
    border: '#404040'
  } : {
    background: '#F8F7F2',
    surface: '#FFFFFF',
    text: '#333333',
    textLight: '#8E8E93',
    border: '#EEEEEE'
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
