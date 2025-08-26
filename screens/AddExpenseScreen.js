import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';

const AddExpenseScreen = ({ route, navigation }) => {
  const { groupId } = route.params || {};
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splits, setSplits] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        console.log('AddExpenseScreen: Retrieved token:', token);
        if (!token) {
          console.log('AddExpenseScreen: No token found, redirecting to Login');
          setError('Please log in');
          navigation.replace('Login');
          return;
        }

        // Fetch group members
        console.log('AddExpenseScreen: Fetching group:', groupId);
        const groupRes = await axios.get(`${API_URL}/api/groups/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('AddExpenseScreen: Group fetched:', groupRes.data);
        setAvailableUsers(groupRes.data.members);
        const members = groupRes.data.members.map(user => user._id);
        setSelectedUsers(members);
        // Initialize splits with zero amounts for all members
        setSplits(members.map(userId => ({ user: userId, amount: 0, inputValue: '' })))
      } catch (err) {
        console.error('AddExpenseScreen: Fetch data error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          stack: err.stack
        });
        setError(err.response?.data?.msg || 'Failed to fetch group members');
        if (err.response?.status === 401) {
          console.log('AddExpenseScreen: Unauthorized, redirecting to Login');
          await AsyncStorage.removeItem('token');
          navigation.replace('Login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId, navigation]);

  const handleAutoSplit = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      console.log('AddExpenseScreen: Auto-split error: Invalid amount', amount);
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      console.log('AddExpenseScreen: Auto-split error: No users selected');
      return;
    }

    const totalAmount = Number(parseFloat(amount).toFixed(2));
    // Get manual amounts from splits (if any)
    const manualSplits = splits.filter(split => split.amount > 0);
    const manualTotal = manualSplits.reduce((sum, split) => sum + Number(split.amount), 0);
    const remainingAmount = Number((totalAmount - manualTotal).toFixed(2));

    if (remainingAmount < 0) {
      setError('Manual split amounts exceed total amount');
      console.log('AddExpenseScreen: Auto-split error: Manual splits exceed total', { manualTotal, totalAmount });
      return;
    }

    const usersToSplit = selectedUsers.filter(userId => !manualSplits.some(split => split.user === userId));
    const splitCount = usersToSplit.length;
    const baseSplitAmount = splitCount > 0 ? Number((remainingAmount / splitCount).toFixed(2)) : 0;

    let runningTotal = manualTotal;
    const splitsArray = selectedUsers.map((userId, index) => {
      const existingSplit = splits.find(split => split.user === userId);
      if (existingSplit && existingSplit.amount > 0) {
        return { ...existingSplit, inputValue: existingSplit.amount.toFixed(2) };
      }
      // Adjust the last auto-split user's amount to ensure exact total
      const splitAmount = splitCount > 0 && index === selectedUsers.length - 1
        ? Number((totalAmount - runningTotal).toFixed(2))
        : baseSplitAmount;
      runningTotal += splitAmount;
      return { user: userId, amount: splitAmount, inputValue: splitAmount.toFixed(2) };
    });

    console.log('AddExpenseScreen: Auto-split calculated:', splitsArray, { totalAmount, manualTotal, remainingAmount, runningTotal });
    setSplits(splitsArray);
    setError('');
  };

  const handleSplitAmountChange = (userId, value) => {
    // Allow only numeric input or empty string
    if (value && !/^\d*\.?\d*$/.test(value)) {
      console.log('AddExpenseScreen: Invalid split input for user:', { userId, value });
      return;
    }
    setSplits(prev => {
      const existingSplit = prev.find(split => split.user === userId);
      if (existingSplit) {
        return prev.map(split =>
          split.user === userId ? { ...split, inputValue: value } : split
        );
      }
      return [...prev, { user: userId, amount: 0, inputValue: value }];
    });
    console.log('AddExpenseScreen: Updated split input for user:', { userId, inputValue: value });
  };

  const handleSplitAmountBlur = (userId, value) => {
    const parsedValue = value ? parseFloat(value) : 0;
    const parsedAmount = isNaN(parsedValue) ? 0 : Number(parsedValue.toFixed(2));
    setSplits(prev =>
      prev.map(split =>
        split.user === userId ? { ...split, amount: parsedAmount, inputValue: parsedAmount.toFixed(2) } : split
      )
    );
    console.log('AddExpenseScreen: Formatted split amount for user:', { userId, amount: parsedAmount });
  };

  const handleAddExpense = async () => {
    if (!description.trim()) {
      setError('Description is required');
      console.log('AddExpenseScreen: Add expense error: Missing description');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      console.log('AddExpenseScreen: Add expense error: Invalid amount', amount);
      return;
    }
    if (!groupId) {
      setError('Group ID is missing');
      console.log('AddExpenseScreen: Add expense error: Missing groupId', groupId);
      return;
    }
    if (splits.length !== selectedUsers.length) {
      setError('Please set splits for all selected users');
      console.log('AddExpenseScreen: Add expense error: Incomplete splits', { splits, selectedUsers });
      return;
    }

    // Verify total split matches amount
    const totalAmount = Number(parseFloat(amount).toFixed(2));
    const totalSplit = splits.reduce((sum, split) => sum + Number(split.amount), 0);
    if (Math.abs(totalSplit - totalAmount) > 0.01) {
      setError(`Total split amount (${totalSplit.toFixed(2)}) does not match expense amount (${totalAmount.toFixed(2)})`);
      console.log('AddExpenseScreen: Add expense error: Split total mismatch', { totalSplit, totalAmount });
      return;
    }

    // Validate splits
    for (const split of splits) {
      if (!split.user || typeof split.amount !== 'number' || isNaN(split.amount) || split.amount < 0) {
        setError('Invalid split data: Each split must have a valid user ID and non-negative amount');
        console.log('AddExpenseScreen: Add expense error: Invalid split data', split);
        return;
      }
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {
        description,
        amount: totalAmount,
        splits: splits.map(split => ({ user: split.user, amount: Number(split.amount) })),
        groupId
      };
      console.log('AddExpenseScreen: Adding expense with payload:', JSON.stringify(payload, null, 2));
      const res = await axios.post(`${API_URL}/api/expenses`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('AddExpenseScreen: Expense added:', res.data);
      setError('');
      Alert.alert('Success', 'Expense added');
      navigation.goBack();
    } catch (err) {
      console.error('AddExpenseScreen: Add expense error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        stack: err.stack
      });
      const errorMsg = err.response?.data?.msg || 'Failed to add expense';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const newSelected = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      setSplits(newSelected.map(id => {
        const existingSplit = splits.find(split => split.user === id);
        return existingSplit || { user: id, amount: 0, inputValue: '' };
      }));
      console.log('AddExpenseScreen: Toggled user selection:', { userId, selectedUsers: newSelected });
      return newSelected;
    });
  };

  const renderUser = ({ item }) => (
    <Pressable
      style={[styles.userItem, selectedUsers.includes(item._id) && styles.selectedUser]}
      onPress={() => toggleUserSelection(item._id)}
    >
      <Text style={styles.userText}>{item.name}</Text>
    </Pressable>
  );

  const renderSplit = ({ item }) => {
    const user = availableUsers.find(user => user._id === item.user) || { name: 'Unknown User' };
    return (
      <View style={styles.splitItem}>
        <Text style={styles.splitText}>{user.name}</Text>
        <TextInput
          style={styles.splitInput}
          placeholder="0.00"
          value={item.inputValue}
          onChangeText={(value) => handleSplitAmountChange(item.user, value)}
          onBlur={() => handleSplitAmountBlur(item.user, item.inputValue)}
          inputMode="numeric"
        />
      </View>
    );
  };

  const totalSplit = splits.reduce((sum, split) => sum + Number(split.amount), 0);

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
      <Text style={styles.title}>Add Expense</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Description (e.g., Dinner)"
        value={description}
        onChangeText={setDescription}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Amount (e.g., 100)"
        value={amount}
        onChangeText={setAmount}
        inputMode="numeric"
      />
      <Text style={styles.subtitle}>Select Users to Split</Text>
      <FlatList
        data={availableUsers}
        renderItem={renderUser}
        keyExtractor={item => item._id}
        ListEmptyComponent={<Text>No users available</Text>}
        style={styles.userList}
      />
      <Pressable style={styles.button} onPress={handleAutoSplit}>
        <Text style={styles.buttonText}>Auto-Split Remaining</Text>
      </Pressable>
      {splits.length > 0 && (
        <>
          <Text style={styles.subtitle}>
            Split Amounts (Total: ${totalSplit.toFixed(2)} / ${amount ? Number(parseFloat(amount).toFixed(2)) : '0.00'})
          </Text>
          <FlatList
            data={splits}
            renderItem={renderSplit}
            keyExtractor={item => item.user}
            ListEmptyComponent={<Text>Click Auto-Split or enter amounts manually</Text>}
            style={styles.splitList}
          />
        </>
      )}
      <Pressable style={styles.button} onPress={handleAddExpense}>
        <Text style={styles.buttonText}>Add Expense</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  input: { 
    borderWidth: 1, 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 5, 
    borderColor: '#ccc',
    backgroundColor: '#fff'
  },
  userItem: { 
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc',
    backgroundColor: '#fff'
  },
  selectedUser: { backgroundColor: '#e0e0e0' },
  userText: { fontSize: 16 },
  splitItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc',
    backgroundColor: '#fff'
  },
  splitText: { fontSize: 16, flex: 1 },
  splitInput: { 
    borderWidth: 1, 
    padding: 5, 
    borderRadius: 5, 
    borderColor: '#ccc', 
    width: 80, 
    textAlign: 'right',
    backgroundColor: '#fff'
  },
  userList: { marginBottom: 10 },
  splitList: { marginBottom: 10 },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 12, 
    borderRadius: 5, 
    alignItems: 'center', 
    marginBottom: 10 
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' }
});

export default AddExpenseScreen;