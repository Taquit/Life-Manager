import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return await AsyncStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        await AsyncStorage.setItem(key, value);
      } catch (e) {
        console.error('Error saving to storage:', e);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Fallback to AsyncStorage if SecureStore fails
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('Error saving to AsyncStorage:', e);
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        await AsyncStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};
