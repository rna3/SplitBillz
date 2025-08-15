import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AddExpenseScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleAddExpense = async () => {
    // Validate inputs
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Please log in');
        navigation.replace('Login');
        return;
      }
      await axios.post(
        `http://localhost:3000/api/expenses`,
        { groupId, description, amount: parsedAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setError('');
      navigation.navigate('Group', { groupId });
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add expense');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Add Expense" onPress={handleAddExpense} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' }
});

export default AddExpenseScreen;