import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

const HomeScreen = ({ navigation }) => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/groups', {
          headers: { Authorization: `Bearer <your_token>` }
        });
        setGroups(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, []);

  return (
    <View style={styles.container}>
      <Button title="Create Group" onPress={() => navigation.navigate('Group')} />
      <FlatList
        data={groups}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.group}>
            <Text>{item.name}</Text>
            <Button
              title="View"
              onPress={() => navigation.navigate('Group', { groupId: item._id })}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  group: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 }
});

export default HomeScreen;