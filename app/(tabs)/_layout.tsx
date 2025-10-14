import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8fafc',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          shadowColor: 'transparent',
          elevation: 0,
          height: 120, 
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#111827',
        },
        tabBarStyle: {
          backgroundColor: '#f8fafc',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8, // Reduced top padding
          paddingBottom: 8, // Reduced bottom padding
          height: 80, // Increased tab bar height
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          marginTop: 0, // Removed top margin
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginBottom: 0, // Removed bottom margin
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="medication" 
        options={{ 
          title: "Medication",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="bloodPressure" 
        options={{ 
          title: "Blood Pressure",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="therapy" 
        options={{ 
          title: "Therapy",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness" size={size} color={color} />
          ),
        }} 
      />
    </Tabs>
  );
}
