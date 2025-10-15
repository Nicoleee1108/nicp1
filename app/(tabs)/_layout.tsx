import { useTranslation } from '@/hooks/useLanguage';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { height: screenHeight } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  
  // Calculate responsive heights based on screen size
  const isSmallScreen = screenHeight < 700;
  const headerHeight = isSmallScreen ? 45 : 60;
  const tabBarHeight = isSmallScreen ? 60 : 70;
  
  return (
    <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f8fafc',
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
            shadowColor: 'transparent',
            elevation: 0,
            height: headerHeight + insets.top,
            paddingTop: insets.top,
            marginTop: -insets.top,
          },
          headerTitleStyle: {
            fontSize: isSmallScreen ? 16 : 18,
            fontWeight: '600',
            color: '#111827',
          },
          tabBarStyle: {
            backgroundColor: '#f8fafc',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            paddingTop: isSmallScreen ? 4 : 6,
            paddingBottom: insets.bottom + (isSmallScreen ? 4 : 6),
            height: tabBarHeight + insets.bottom,
            marginBottom: -insets.bottom,
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#6b7280',
          tabBarLabelStyle: {
            marginTop: 0,
            fontSize: isSmallScreen ? 10 : 12,
            fontWeight: '500',
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
        }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: t('navigation.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="medication" 
        options={{ 
          title: t('navigation.medication'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="bloodPressure" 
        options={{ 
          title: t('navigation.bloodPressure'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="therapy" 
        options={{ 
          title: t('navigation.therapy'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness" size={size} color={color} />
          ),
        }} 
      />
    </Tabs>
  );
}
