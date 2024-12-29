import { View, Text } from 'react-native'
import { Stack, Tabs } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

// const TabIcon = ({icon, color, name, focused}) => {
//   return (
//       <View className="items-center justify-center gap-2">
//           <Image
//           source={icon}
//           resizeMode = "contain"
//           tintColor = {color}
//           className = "w-6 h-6"
//           />
//           <Text className={`${focused ? 'font-psemibold': 'font-pregular'} text-xs`}
//               style={{color: color}}>
//               {name}
//           </Text>
//       </View>
//   )
// }

const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#FFA001",
          tabBarInactiveTintColor: "#CDCDE0",
          tabBarStyle: {
              backgroundColor: '#161622',
              borderTopWidth: 1,
              borderTopColor: '#232533',
              height: 84,
          }
        }}
      >
        <Tabs.Screen 
          name='(events)'
          options={{
            title: 'Home',
            headerShown:false,
            // tabBarIcon: ({color,focused}) => (
            //     <TabIcon
            //         icon={icons.home}
            //         color={color}
            //         name="Home"
            //         focused={focused}
            //     />
            // )
        }}
        />
        <Tabs.Screen 
          name='location'
          options={{
            title: 'Location',
            headerShown: false
          }}
        />
        <Tabs.Screen
            name='profile'
            options={{
              title: 'Profile',
              headerShown: false
            }}
        />
      </Tabs>
      <StatusBar backgroundColor='#161622' style='light'/>
    </>
  )
}

export default AuthLayout