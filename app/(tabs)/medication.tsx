// app/(tabs)/medication.tsx
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from "@react-navigation/elements";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Animated, Dimensions, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import AddMedicationModal from "../../components/AddMedicationModal";
import type { Med } from "../../types/med";
import { cancelMany } from "../lib/notifications";
import { loadMeds, saveMeds } from "../lib/storage";




function timeLabel(h: number, m: number) {
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

function SwipeableMedicationRow({ 
  item, 
  onDelete 
}: { 
  item: Med; 
  onDelete: (id: string) => void; 
}) {
  const handleDelete = () => {
    Alert.alert(
      "Delete Medication",
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(item.id),
        },
      ]
    );
  };

  const renderRightActions = (progress: Animated.AnimatedAddition<number>, dragX: Animated.AnimatedAddition<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Animated.View
          style={[
            {
              backgroundColor: '#ef4444',
              justifyContent: 'center',
              alignItems: 'center',
              width: 80,
              height: '100%',
              borderRadius: 16,
            },
            { transform: [{ scale }] }
          ]}
        >
          <Pressable
            onPress={handleDelete}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 20,
          marginHorizontal: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="medical" size={16} color="#3b82f6" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: '#111827' }}>
                {item.name}
              </Text>
            </View>
            {item.usage && (
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                {item.usage}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="medical" size={14} color="#6b7280" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 14, color: "#6b7280", fontWeight: '500' }}>
                {item.dosagePerIntake} {item.dosagePerIntake === 1 ? "pill" : "pills"} per dose
              </Text>
            </View>
          </View>
        </View>
        
        {item.reminders.length > 0 ? (
          <View style={{ 
            backgroundColor: '#f0f9ff', 
            padding: 12, 
            borderRadius: 8, 
            borderLeftWidth: 3, 
            borderLeftColor: '#3b82f6' 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="time" size={14} color="#3b82f6" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e40af' }}>Reminders</Text>
            </View>
            <Text style={{ fontSize: 14, color: "#1e40af", fontWeight: '500' }}>
              {item.reminders
                .map((r) => timeLabel(r.hour, r.minute))
                .join(", ")}
            </Text>
          </View>
        ) : (
          <View style={{ 
            backgroundColor: '#f8fafc', 
            padding: 12, 
            borderRadius: 8, 
            borderLeftWidth: 3, 
            borderLeftColor: '#9ca3af' 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={14} color="#6b7280" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 14, color: "#6b7280", fontWeight: '500' }}>No reminders set</Text>
            </View>
          </View>
        )}
      </View>
    </Swipeable>
  );
}



export default function MedicationPage() {
  const headerHeight = useHeaderHeight();
  const { height: screenHeight } = Dimensions.get('window');
  const [open, setOpen] = useState(false);
  const [meds, setMeds] = useState<Med[]>([]);
  
  // Calculate responsive button size
  const isSmallScreen = screenHeight < 700;
  const buttonSize = isSmallScreen ? 32 : 36;

  useEffect(() => {
    (async () => setMeds(await loadMeds()))();
  }, []);

  async function onDelete(id: string) {
    const med = meds.find((m) => m.id === id);
    if (!med) return;

    await cancelMany(med.reminders.map((r) => r.notificationId));
    const updated = meds.filter((m) => m.id !== id);
    setMeds(updated);
    await saveMeds(updated);
  }

  async function handleCreated(med: Med) {
    const updated = [med, ...meds];
    setMeds(updated);
    await saveMeds(updated);
    setOpen(false);
  }


  return (
    <>
      <Stack.Screen
        options={{
          title: "Medication",
          headerRight: () => (
            <Pressable
              onPress={() => setOpen(true)}
              style={({ pressed }) => ({
                marginRight: isSmallScreen ? 8 : 12,
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                backgroundColor: pressed ? '#0f172a' : '#111827',
                alignItems: "center",
                justifyContent: "center",
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              })}
            >
              <Ionicons name="add" size={isSmallScreen ? 18 : 20} color="white" />
            </Pressable>
          ),
        }}
      />

      <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginHorizontal: 4 }}>
            <Ionicons name="medical" size={20} color="#111827" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 20, fontWeight: "700", color: '#111827' }}>
              Your Medications
            </Text>
          </View>

          {meds.length === 0 ? (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 32,
              alignItems: 'center',
              marginHorizontal: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}>
              <Ionicons name="medical-outline" size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
              <Text style={{ color: "#6b7280", textAlign: 'center', marginBottom: 8, fontSize: 16, fontWeight: '600' }}>
                No medications yet
              </Text>
              <Text style={{ color: "#9ca3af", textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
                Start tracking your medications by adding your first one
              </Text>
            </View>
          ) : (
            <FlatList
              data={meds}
              keyExtractor={(m) => m.id}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={({ item }) => (
                <SwipeableMedicationRow
                  item={item}
                  onDelete={onDelete}
                />
              )}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
      </View>

      <AddMedicationModal
        visible={open}
        headerOffset={headerHeight}
        onCancel={() => setOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
