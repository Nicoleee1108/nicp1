import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
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
