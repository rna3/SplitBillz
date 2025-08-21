import { createStackNavigator } from '@react-navigation/stack';
   import { NavigationContainer } from '@react-navigation/native';
   import { Image } from 'react-native';
   import HomeScreen from '../screens/HomeScreen';
   import LoginScreen from '../screens/LoginScreen';
   import SignupScreen from '../screens/SignupScreen';
   import GroupScreen from '../screens/GroupScreen';
   import AddExpenseScreen from '../screens/AddExpenseScreen';

   const Stack = createStackNavigator();

   const AppNavigator = () => {
     return (
       <NavigationContainer>
         <Stack.Navigator
           screenOptions={{
             headerBackTitleVisible: false,
             headerTintColor: '#000',
             headerStyle: {
               backgroundColor: '#fff',
               boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
             },
             headerTitleStyle: {
               fontWeight: 'bold'
             },
             headerBackImage: () => (
               <Image
                 source={require('../assets/back-icon.png')}
                 style={{ width: 24, height: 24 }}
                 resizeMode="contain"
               />
             ),
             cardStyle: { backgroundColor: '#fff' }
           }}
         >
           <Stack.Screen name="Login" component={LoginScreen} />
           <Stack.Screen name="Signup" component={SignupScreen} />
           <Stack.Screen name="Home" component={HomeScreen} />
           <Stack.Screen name="Group" component={GroupScreen} />
           <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
         </Stack.Navigator>
       </NavigationContainer>
     );
   };

   export default AppNavigator;