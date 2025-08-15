import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { PieChart } from 'react-native-chart-kit';

const GroupScreen = ({ route, navigation }) => {
  const { groupId } = route.params || {};
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('Please log in');
          navigation.replace('Login');
          return;
        }

        // Fetch available users for group creation
        const usersRes = await axios.get('http://localhost:3000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAvailableUsers(usersRes.data);

        // Fetch group details if groupId exists
        if (groupId) {
          const groupRes = await axios.get(`http://localhost:3000/api/groups/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setGroup(groupRes.data);
          setExpenses(groupRes.data.expenses || []);
          setName(groupRes.data.name);
          setDescription(groupRes.data.description || '');
          setSelectedUsers(groupRes.data.members.map(member => member._id));
        }
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to fetch data');
      }
    };
    fetchData();
  }, [groupId, navigation]);

  const handleCreateOrUpdateGroup = async () => {
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('At least one member is required');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const payload = { name, description, members: selectedUsers };
      let res;
      if (groupId) {
        res = await axios.put(`http://localhost:3000/api/groups/${groupId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post('http://localhost:3000/api/groups', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setError('');
      navigation.navigate('Home'); // Redirect to Home after creating/updating
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save group');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={[styles.userItem, selectedUsers.includes(item._id) && styles.selectedUser]}
      onPress={() => toggleUserSelection(item._id)}
    >
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderExpense = ({ item }) => (
    <View style={styles.expenseItem}>
      <Text>{item.description}: ${item.amount}</Text>
      <Text>Paid by: {item.paidBy.name}</Text>
    </View>
  );

  const chartData = expenses.map((expense, index) => ({
    name: expense.paidBy.name,
    amount: expense.amount,
    color: ['#ff6347', '#4682b4', '#3cb371', '#ffd700'][index % 4],
    legendFontColor: '#7F7F7F',
    legendFontSize: 15
  }));

  return (
    <View style={styles.container}>
      {groupId && !group ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Text style={styles.title}>{groupId ? group.name : 'Create New Group'}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="Group Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
          />
          <Text style={styles.subtitle}>Select Members</Text>
          <FlatList
            data={availableUsers}
            renderItem={renderUser}
            keyExtractor={item => item._id}
            ListEmptyComponent={<Text>No users available</Text>}
          />
          <Button
            title={groupId ? 'Update Group' : 'Create Group'}
            onPress={handleCreateOrUpdateGroup}
          />
          {groupId && (
            <>
              <Button
                title="Add Expense"
                onPress={() => navigation.navigate('AddExpense', { groupId })}
              />
              <Text style={styles.subtitle}>Expenses</Text>
              <FlatList
                data={expenses}
                renderItem={renderExpense}
                keyExtractor={item => item._id}
                ListEmptyComponent={<Text>No expenses found</Text>}
              />
              {expenses.length > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.subtitle}>Expense Split</Text>
                  <PieChart
                    data={chartData}
                    width={Dimensions.get('window').width - 40}
                    height={220}
                    chartConfig={{
                      color: () => '#000',
                      labelColor: () => '#000'
                    }}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                  />
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  userItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  selectedUser: { backgroundColor: '#e0e0e0' },
  expenseItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  chartContainer: { marginTop: 20 },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' }
});

export default GroupScreen;