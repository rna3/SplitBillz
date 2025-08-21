import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { PieChart } from 'react-native-chart-kit';

const GroupScreen = ({ route, navigation }) => {
  const { groupId } = route.params || {};
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userSplitTotal, setUserSplitTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        console.log('GroupScreen: Retrieved token:', token);
        if (!token) {
          console.log('GroupScreen: No token found, redirecting to Login');
          setError('Please log in');
          navigation.replace('Login');
          return;
        }

        // Fetch current user
        console.log('GroupScreen: Fetching current user');
        const userRes = await axios.get('http://localhost:3000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('GroupScreen: Current user:', userRes.data);
        setCurrentUserId(userRes.data._id);

        // Fetch available users
        console.log('GroupScreen: Fetching available users');
        const usersRes = await axios.get('http://localhost:3000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('GroupScreen: Available users:', usersRes.data);
        setAvailableUsers(usersRes.data);

        // Fetch group details if groupId exists
        if (groupId) {
          console.log('GroupScreen: Fetching group:', groupId);
          const groupRes = await axios.get(`http://localhost:3000/api/groups/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('GroupScreen: Group fetched:', groupRes.data);
          setGroup(groupRes.data);
          setName(groupRes.data.name);
          setDescription(groupRes.data.description || '');
          setSelectedUsers(groupRes.data.members.map(member => member._id));

          console.log('GroupScreen: Fetching expenses for group:', groupId);
          const expensesRes = await axios.get(`http://localhost:3000/api/expenses/group/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fetchedExpenses = expensesRes.data || [];
          console.log('GroupScreen: Expenses fetched:', fetchedExpenses);
          setExpenses(fetchedExpenses);

          // Calculate logged-in user's total responsibility
          let totalUserSplit = 0;
          fetchedExpenses.forEach(expense => {
            const userSplit = expense.splits.find(split => split.user._id === userRes.data._id || split.user === userRes.data._id);
            if (userSplit) {
              totalUserSplit += userSplit.amount;
            }
          });
          console.log('GroupScreen: User split total:', totalUserSplit);
          setUserSplitTotal(totalUserSplit);
        } else {
          // Automatically include current user for new groups
          setSelectedUsers([userRes.data._id]);
        }
      } catch (err) {
        console.error('GroupScreen: Fetch data error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          stack: err.stack
        });
        setError(err.response?.data?.msg || 'Failed to fetch data');
        if (err.response?.status === 401) {
          console.log('GroupScreen: Unauthorized, redirecting to Login');
          await AsyncStorage.removeItem('token');
          navigation.replace('Login');
        } else if (err.response?.status === 404) {
          setError('Group not found');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const unsubscribe = navigation.addListener('focus', () => {
      console.log('GroupScreen: Focused, refetching data');
      fetchData();
    });
    return unsubscribe;
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
      console.log('GroupScreen: Saving group:', { name, description, members: selectedUsers });
      const payload = { name, description, members: selectedUsers };
      let res;
      if (groupId) {
        res = await axios.put(`http://localhost:3000/api/groups/${groupId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('GroupScreen: Group updated:', res.data);
      } else {
        res = await axios.post('http://localhost:3000/api/groups', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('GroupScreen: Group created:', res.data);
      }
      setError('');
      Alert.alert('Success', groupId ? 'Group updated' : 'Group created');
      navigation.navigate('Home');
    } catch (err) {
      console.error('GroupScreen: Save group error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        stack: err.stack
      });
      setError(err.response?.data?.msg || 'Failed to save group');
      Alert.alert('Error', err.response?.data?.msg || 'Failed to save group');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('GroupScreen: Deleting expense:', expenseId);
      await axios.delete(`http://localhost:3000/api/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('GroupScreen: Expense deleted:', expenseId);
      Alert.alert('Success', 'Expense deleted');
      // Refetch expenses
      const expensesRes = await axios.get(`http://localhost:3000/api/expenses/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedExpenses = expensesRes.data || [];
      console.log('GroupScreen: Expenses refetched:', fetchedExpenses);
      setExpenses(fetchedExpenses);

      // Recalculate user split total
      let totalUserSplit = 0;
      fetchedExpenses.forEach(expense => {
        const userSplit = expense.splits.find(split => split.user._id === currentUserId || split.user === currentUserId);
        if (userSplit) {
          totalUserSplit += userSplit.amount;
        }
      });
      console.log('GroupScreen: Updated user split total:', totalUserSplit);
      setUserSplitTotal(totalUserSplit);
    } catch (err) {
      console.error('GroupScreen: Delete expense error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        stack: err.stack
      });
      Alert.alert('Error', err.response?.data?.msg || 'Failed to delete expense');
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
    <Pressable
      style={[styles.userItem, selectedUsers.includes(item._id) && styles.selectedUser]}
      onPress={() => toggleUserSelection(item._id)}
    >
      <Text>{item.name}</Text>
    </Pressable>
  );

  const renderExpense = ({ item }) => {
    const userSplit = item.splits.find(split => split.user._id === currentUserId || split.user === currentUserId);
    const userSplitAmount = userSplit ? userSplit.amount.toFixed(2) : '0.00';
    return (
      <View style={styles.expenseItem}>
        <Text>{item.description}: Total ${item.amount.toFixed(2)} (Your Share: ${userSplitAmount})</Text>
        <Text>Paid by: {item.paidBy.name}</Text>
        {item.paidBy._id === currentUserId && (
          <Pressable onPress={() => handleDeleteExpense(item._id)}>
            <Text style={styles.deleteButton}>Delete</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const chartData = expenses.map((expense, index) => {
    const userSplit = expense.splits.find(split => split.user._id === currentUserId || split.user === currentUserId);
    const userSplitAmount = userSplit ? userSplit.amount : 0;
    return {
      name: expense.description,
      amount: userSplitAmount,
      color: ['#FF6347', '#4682B4', '#3CB371', '#FFD700', '#FF69B4', '#8A2BE2'][index % 6],
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    };
  }).filter(data => data.amount > 0); // Exclude zero amounts

  const totalCost = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{groupId && group ? group.name : 'Create New Group'}</Text>
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
      <Pressable
        style={styles.button}
        onPress={handleCreateOrUpdateGroup}
      >
        <Text style={styles.buttonText}>{groupId ? 'Update Group' : 'Create Group'}</Text>
      </Pressable>
      {groupId && group && (
        <>
          <Pressable
            style={styles.button}
            onPress={() => navigation.navigate('AddExpense', { groupId })}
          >
            <Text style={styles.buttonText}>Add Expense</Text>
          </Pressable>
          <Text style={styles.subtitle}>Expenses</Text>
          <FlatList
            data={expenses}
            renderItem={renderExpense}
            keyExtractor={item => item._id}
            ListEmptyComponent={<Text>No expenses found</Text>}
          />
          {expenses.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.subtitle}>
                Your Expense Responsibility (Total Cost: ${totalCost.toFixed(2)}, Your Share: ${userSplitTotal.toFixed(2)})
              </Text>
              <PieChart
                data={chartData}
                width={Dimensions.get('window').width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: () => '#000000',
                  labelColor: () => '#000000'
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
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
  expenseItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 5 },
  deleteButton: { color: 'red', textAlign: 'right', fontSize: 14, marginTop: 5 },
  chartContainer: { marginTop: 20, alignItems: 'center' },
  button: { backgroundColor: '#007AFF', padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' }
});

export default GroupScreen;