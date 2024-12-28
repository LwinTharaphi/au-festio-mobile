import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function navigation() {
  return (
    <View>
        <Text>navigation</Text>
    </View>
  );
}