import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="medication" options={{ title: "Medication" }} />
      <Tabs.Screen name="bloodPressure" options={{ title: "Blood Pressure" }} />
      <Tabs.Screen name="therapy" options={{ title: "Therapy" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
    </Tabs>
  );
}
