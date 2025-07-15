import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

const GroupScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/expenses/group/${groupId}`, {
          headers: { Authorization: `Bearer <your_token>` }
        });
        setExpenses(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchExpenses();
  }, [groupId]);

  return (
    <View style={styles.container}>
      <Button title="Add Expense" onPress={() => navigation.navigate('AddExpense', { groupId })} />
      <FlatList
        data={expenses}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.expense}>
            <Text>{item.description}: ${item.amount}</Text>
            <Text>Paid by: {item.paidBy.name}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  expense: { padding: 10 }
});

export default GroupScreen;