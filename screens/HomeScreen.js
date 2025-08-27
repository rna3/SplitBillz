import React, { useState, useEffect } from 'react';
   import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import axios from 'axios';
   import { API_URL } from '@env';

   const HomeScreen = ({ navigation }) => {
     const [groups, setGroups] = useState([]);
     const [error, setError] = useState('');
     const [loading, setLoading] = useState(true);
     const [currentUserId, setCurrentUserId] = useState(null);

     useEffect(() => {
       const fetchData = async () => {
         try {
           setLoading(true);
           // Ensure AsyncStorage is ready
           const token = await AsyncStorage.getItem('token');
           console.log('HomeScreen: Retrieved token:', token);
           if (!token) {
             console.log('HomeScreen: No token found, redirecting to Login');
             setError('Please log in');
             navigation.replace('Login');
             return;
           }

           // Fetch current user
           console.log('HomeScreen: Fetching current user with token:', token);
           const userRes = await axios.get(`${API_URL}/api/users/me`, {
             headers: { Authorization: `Bearer ${token}` }
           });
           console.log('HomeScreen: Current user:', userRes.data);
           setCurrentUserId(userRes.data._id);

           // Fetch groups
           console.log('HomeScreen: Fetching groups');
           const res = await axios.get(`${API_URL}/api/groups`, {
             headers: { Authorization: `Bearer ${token}` }
           });
           console.log('HomeScreen: Groups fetched:', res.data.map(g => ({
             _id: g._id,
             name: g.name,
             createdBy: g.createdBy?._id || g.createdBy
           })));
           setGroups(res.data);
         } catch (err) {
           console.error('HomeScreen: Fetch data error:', {
             status: err.response?.status,
             data: err.response?.data,
             message: err.message,
             stack: err.stack
           });
           if (err.response?.status === 401) {
             console.log('HomeScreen: Unauthorized, clearing token and redirecting to Login');
             await AsyncStorage.removeItem('token');
             setError('Session expired, please log in again');
             navigation.replace('Login');
           } else {
             setError(err.response?.data?.msg || 'Failed to fetch groups');
             Alert.alert('Error', err.response?.data?.msg || 'Failed to fetch groups');
           }
         } finally {
           setLoading(false);
         }
       };

       // Delay fetch to ensure AsyncStorage is ready
       const timer = setTimeout(() => {
         console.log('HomeScreen: Initiating fetchData');
         fetchData();
       }, 100);

       const unsubscribe = navigation.addListener('focus', () => {
         console.log('HomeScreen: Focused, refetching data');
         fetchData();
       });

       return () => {
         clearTimeout(timer);
         unsubscribe();
       };
     }, [navigation]);

     const handleDeleteGroup = async (groupId) => {
       try {
         const token = await AsyncStorage.getItem('token');
         console.log('HomeScreen: Deleting group:', groupId, 'by user:', currentUserId);
         await axios.delete(`${API_URL}/api/groups/${groupId}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         console.log('HomeScreen: Group deleted successfully:', groupId);
         Alert.alert('Success', 'Group deleted');
         // Refetch groups
         const res = await axios.get(`${API_URL}/api/groups`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         console.log('HomeScreen: Groups refetched after delete:', res.data);
         setGroups(res.data);
       } catch (err) {
         console.error('HomeScreen: Delete group error:', {
           status: err.response?.status,
           data: err.response?.data,
           message: err.message,
           stack: err.stack
         });
         if (err.response?.status === 401) {
           console.log('HomeScreen: Unauthorized, clearing token and redirecting to Login');
           await AsyncStorage.removeItem('token');
           navigation.replace('Login');
         } else {
           Alert.alert('Error', err.response?.data?.msg || 'Failed to delete group');
         }
       }
     };

     const renderGroup = ({ item }) => {
       const canDelete = item.createdBy?._id === currentUserId || item.createdBy === currentUserId;
       console.log('HomeScreen: Rendering group:', {
         id: item._id,
         name: item.name,
         createdBy: item.createdBy?._id || item.createdBy,
         currentUserId,
         canDelete
       });
       return (
         <View style={styles.groupItem}>
           <Pressable
             style={styles.groupContent}
             onPress={() => {
               console.log('HomeScreen: Navigating to group:', { id: item._id, name: item.name });
               navigation.navigate('Group', { groupId: item._id });
             }}
           >
             <Text style={styles.groupName}>{item.name}</Text>
             <Text>{item.description || 'No description'}</Text>
           </Pressable>
           {canDelete && (
             <Pressable onPress={() => handleDeleteGroup(item._id)}>
               <Text style={styles.deleteButton}>Delete</Text>
             </Pressable>
           )}
         </View>
       );
     };

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
         <Text style={styles.title}>Your Groups</Text>
         {error ? <Text style={styles.error}>{error}</Text> : null}
         <FlatList
           data={groups}
           renderItem={renderGroup}
           keyExtractor={item => item._id}
           ListEmptyComponent={<Text>No groups found</Text>}
         />
         <Pressable
           style={styles.button}
           onPress={() => navigation.navigate('Group')}
         >
           <Text style={styles.buttonText}>Create New Group</Text>
         </Pressable>
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: { flex: 1, padding: 20 },
     title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
     groupItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 10 },
     groupContent: { paddingBottom: 5 },
     groupName: { fontSize: 18, fontWeight: 'bold' },
     error: { color: 'red', marginBottom: 10, textAlign: 'center' },
     button: { backgroundColor: '#007AFF', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 20 },
     buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
     deleteButton: { color: 'red', textAlign: 'right', fontSize: 14 }
   });

   export default HomeScreen;