import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CoursesProvider } from './src/contexts/CoursesContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QrCode, Home, BookOpen, ClipboardList, User } from 'lucide-react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ScanScreen from './src/screens/ScanScreen';
import CourseScreen from './src/screens/CourseScreen'; // Keep for Scan navigation
import OverviewScreen from './src/screens/OverviewScreen';
import AcademyScreen from './src/screens/AcademyScreen';
import LogScreen from './src/screens/LogScreen';
import AccountScreen from './src/screens/AccountScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 12, marginBottom: 4 },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderRadius: 0,
          height: 60,
          paddingBottom: 4,
          elevation: 4,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          if (route.name === 'Overview') IconComponent = Home;
          else if (route.name === 'Academy') IconComponent = BookOpen;
          else if (route.name === 'Scan') IconComponent = QrCode;
          else if (route.name === 'Log') IconComponent = ClipboardList;
          else if (route.name === 'Account') IconComponent = User;
          return <IconComponent color={focused ? '#2563eb' : '#94a3b8'} size={28} />;
        },
      })}
    >
      <Tab.Screen name="Overview" component={OverviewScreen} />
      <Tab.Screen name="Academy" component={AcademyScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{ tabBarLabel: "Scan" }} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}


function RootNavigator() {
  const { session } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="Main" component={AppTabs} />
          // Add CourseScreen to the stack for navigation
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
        <Stack.Screen name="Course" component={CourseScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CoursesProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </CoursesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
