import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const HomeScreen = ({ navigation }) => {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('Please log in');
          navigation.replace('Login');
          return;
        }
        const res = await axios.get('http://<your_local_ip>:3000/api/groups', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGroups(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to fetch groups');
      }
    };
    fetchGroups();
  }, [navigation]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => navigation.navigate('Group', { groupId: item._id })}
    >
      <Text style={styles.groupName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Groups</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={item => item._id}
        ListEmptyComponent={<Text>No groups found</Text>}
      />
      <Button title="Create Group" onPress={() => navigation.navigate('Group', { groupId: null })} />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  groupItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  groupName: { fontSize: 18 },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' }
});

export default HomeScreen;