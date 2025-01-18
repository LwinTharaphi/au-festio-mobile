import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './app/screens/SplashScreen';
import WelcomeScreen from './app/screens/WelcomeScreen';
import SignInScreen from './app/screens/SignInScreen';
import HomeScreen from './app/screens/HomeScreen';
import RegistrationSuccessScreen from './app/screens/RegistrationSuccessScreen'; // Import the RegistrationSuccess screen
import EventDetailScreen from './app/screens/EventDetailScreen';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
        <Stack.Navigator initialRouteName='Splash' screenOptions={{headerShown: false}}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />   
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
            </Stack.Navigator>
    </NavigationContainer>
  );
}