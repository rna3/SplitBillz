import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import axios from 'axios';

const AddExpenseScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleAddExpense = async () => {
    try {
      // Simplified: assumes equal split among group members
      await axios.post(
        'http://localhost:5000/api/expenses',
        {
          description,
          amount: parseFloat(amount),
          groupId,
          splits: [] // Add logic to split amount
        },
        { headers: { Authorization: `Bearer <your_token>` } }
      );
      navigation.goBack();
    } catch (err) {
      setError(err.response.data.msg || 'Failed to add expense');
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
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10 },
  error: { color: 'red', marginBottom: 10 }
});

export default AddExpenseScreen;