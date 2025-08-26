import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('LoginScreen: API_URL:', API_URL || 'Not loaded');
    const clearStorage = async () => {
      try {
        await AsyncStorage.removeItem('token');
        console.log('LoginScreen: Cleared stored token');
      } catch (err) {
        console.error('LoginScreen: Error clearing token:', err);
      }
    };
    clearStorage();
  }, []);

  const handleLogin = async () => {
    console.log('LoginScreen: Attempting login:', { email, apiUrl: API_URL });
    try {
      if (!API_URL) {
        throw new Error('API_URL is not defined');
      }
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      console.log('LoginScreen: Login response:', res.data);
      await AsyncStorage.setItem('token', res.data.token);
      console.log('LoginScreen: Token stored:', res.data.token);
      setError('');
      navigation.replace('Home');
    } catch (err) {
      console.error('LoginScreen: Login error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setError(err.response?.data?.msg || 'Failed to login');
      Alert.alert('Error', err.response?.data?.msg || 'Failed to login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        inputMode="email"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
  button: { backgroundColor: '#007AFF', padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#007AFF', textAlign: 'center' }
});

export default LoginScreen;