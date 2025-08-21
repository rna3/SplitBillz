import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    console.log('Signup attempted:', { name, email });
    try {
      const res = await axios.post('http://localhost:3000/api/auth/register', {
        name,
        email,
        password
      });
      console.log('Signup successful:', res.data);
      await AsyncStorage.setItem('token', res.data.token);
      console.log('Token stored:', res.data.token);
      setError('');
      navigation.replace('Home');
    } catch (err) {
      console.error('Signup error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setError(err.response?.data?.msg || 'Failed to sign up');
      Alert.alert('Error', err.response?.data?.msg || 'Failed to sign up');
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
      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
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

export default SignupScreen;