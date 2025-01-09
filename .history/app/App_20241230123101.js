// // import React from 'react';
// // import { NavigationContainer } from '@react-navigation/native';
// // import BottomTabNavigator from './navigation/BottomTabNavigator';

// // export default function App() {
// //   return (
// //     <NavigationContainer>
// //       <BottomTabNavigator />
// //     </NavigationContainer>
// //   );
// // }
// // import React from 'react';
// // import { NavigationContainer } from '@react-navigation/native';
// // import AppNavigator from './navigation/AppNavigator'; // Adjust path

// // export default function App() {
// //   return (
// //     <NavigationContainer>
// //       <AppNavigator />
// //     </NavigationContainer>
// //   );
// // }
// import React from 'react';
// import "../global.css"
// import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator /> {/* Navigation already includes NavigationContainer */}
    </SafeAreaProvider>
  );
}
