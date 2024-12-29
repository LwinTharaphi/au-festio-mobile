import { View, Text, Image, StyleSheet} from 'react-native'
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
    const router = useRouter();
    const navigation = useNavigation();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.navigate("screens/WelcomeScreen");
        }, 3000);
        return () => clearTimeout(timer);
    }, [router])
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/image 80.png')}
       style={styles.logo}
       resizeMode='contain'
       />
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    logo: {
      width: 200,
      height: 200,
    },
  });