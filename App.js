import React, { useEffect } from 'react';
   import { View, StyleSheet } from 'react-native';
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import AppNavigator from './navigation/AppNavigator';

   const App = () => {
     useEffect(() => {
       const checkToken = async () => {
         const token = await AsyncStorage.getItem('token');
         console.log('App.js: Initial token check:', token);
       };
       checkToken();
     }, []);

     return (
       <View style={styles.container}>
         <AppNavigator />
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: '#fff'
     }
   });

   export default App;