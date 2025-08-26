import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('SignupScreen: API_URL:', API_URL || 'Not loaded');
  }, []);

  const handleSignup = async () => {
    console.log('SignupScreen: Signup attempted:', { name, email, apiUrl: API_URL });
    try {
      if (!API_URL) {
        throw new Error('API_URL is not defined');
      }
      const res = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
      console.log('SignupScreen: Signup response:', res.data);
      await AsyncStorage.setItem('token', res.data.token);
      console.log('SignupScreen: Token stored:', res.data.token);
      setError('');
      navigation.replace('Home');
    } catch (err) {
      console.error('SignupScreen: Signup error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setError(err.response?.data?.msg || 'Signup failed');
      Alert.alert('Error', err.response?.data?.msg || 'Signup failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
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
      <Pressable style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </Pressable>
      <Pressable
        style={styles.link}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { 
    borderWidth: 1, 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 5, 
    borderColor: '#ccc' 
  },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 12, 
    borderRadius: 5, 
    alignItems: 'center', 
    marginBottom: 10 
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
  link: { alignItems: 'center' },
  linkText: { color: '#007AFF', fontSize: 16 }
});

export default SignupScreen;