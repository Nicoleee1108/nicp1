// components/AddMedicationModal.tsx
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { ensureNotificationSetup, scheduleDailyReminder } from "../app/lib/notifications";
import { defaultTimesFor } from "../app/lib/time";
import ReminderTimeRow from "../components/ReminderTimeRow";
import type { Med } from "../types/med";

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AddMedicationModal({
  visible,
  headerOffset = 0,
  onCancel,
  onCreated,
}: {
  visible: boolean;
  headerOffset?: number;
  onCancel: () => void;
  onCreated: (med: Med) => void;
}) {
  const [name, setName] = useState("");
  const [usage, setUsage] = useState("");
  const [dosagePerIntake, setDosagePerIntake] = useState(1);
  const [timesPerDay, setTimesPerDay] = useState(3);
  const [times, setTimes] = useState<Date[]>(defaultTimesFor(3));

  const canAddMoreTimes = times.length < 5;

  function resetForm() {
    setName("");
    setUsage("");
    setDosagePerIntake(1);
    setTimesPerDay(3);
    setTimes(defaultTimesFor(3));
  }

  function handleTimesPerDayChange(next: number) {
    const n = Math.max(1, Math.min(5, next));
    setTimesPerDay(n);
    setTimes(defaultTimesFor(n));
  }

  function onAddTime() {
    if (!canAddMoreTimes) return;
    const next = new Date(times[times.length - 1] ?? new Date());
    next.setMinutes((next.getMinutes() + 240) % 1440); // +4h default step
    setTimes([...times, next]);
  }

  function onTimeChange(idx: number, newTime: Date) {
    const copy = [...times];
    copy[idx] = newTime;
    setTimes(copy);
  }

  function onDelete(idx: number) {
    const copy = [...times];
    copy.splice(idx, 1);
    setTimes(copy);
  }


  async function onSave() {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a medication name.");
      return;
    }
    if (times.length === 0) {
      Alert.alert("No times", "Please add at least one reminder time.");
      return;
    }

    const setupOk = await ensureNotificationSetup();
    if (!setupOk) {
      Alert.alert(
        "Notifications disabled",
        "Enable notifications in Settings to receive reminders. You can still save the medication without reminders."
      );
    }

    // schedule reminders if allowed; otherwise, save with empty reminders
    const reminders = setupOk
      ? await Promise.all(
          times.map((t) => scheduleDailyReminder(name.trim(), dosagePerIntake, t))
        )
      : [];

    const med: Med = {
      id: genId(),
      name: name.trim(),
      usage: usage.trim(),
      dosagePerIntake,
      timesPerDay: times.length,
      reminders,
    };

    resetForm();
    onCreated(med);
  }

  // simple stepper buttons
  function Stepper({
    value,
    setValue,
    min = 1,
    max = 10,
    label,
  }: {
    value: number;
    setValue: (n: number) => void;
    min?: number;
    max?: number;
    label: string;
  }) {
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => setValue(Math.max(min, value - 1))}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 2,
              borderColor: "#e5e7eb",
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
              backgroundColor: '#fff',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: '#111827' }}>-</Text>
          </Pressable>
          <View
            style={{
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderTopWidth: 2,
              borderBottomWidth: 2,
              borderColor: "#e5e7eb",
              minWidth: 60,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: '#fff',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: '#111827' }}>{value}</Text>
          </View>
          <Pressable
            onPress={() => setValue(Math.min(max, value + 1))}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 2,
              borderColor: "#e5e7eb",
              borderTopRightRadius: 12,
              borderBottomRightRadius: 12,
              backgroundColor: '#fff',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: '#111827' }}>+</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // update times if user changes "times per day" via the stepper
  const timesPerDayStepper = useMemo(
    () => (
      <Stepper
        value={timesPerDay}
        setValue={handleTimesPerDayChange}
        min={1}
        max={5}
        label="Times per day"
      />
    ),
    [timesPerDay]
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* Header */}
        <View style={{ 
          backgroundColor: '#fff', 
          paddingTop: 20, 
          paddingBottom: 16, 
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="add-circle" size={24} color="#111827" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Add Medication</Text>
            </View>
            <Pressable 
              onPress={() => {
                resetForm();
                onCancel();
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#f3f4f6',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="close" size={18} color="#6b7280" />
            </Pressable>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Lisinopril"
              style={{
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: '#fff',
                color: '#111827'
              }}
              placeholderTextColor="#9ca3af"
              maxLength={100}
            />
          </View>

          {/* Usage */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>Usage (Optional)</Text>
            <TextInput
              value={usage}
              onChangeText={setUsage}
              placeholder='e.g., "2 pills per intake; avoid with grapefruit"'
              style={{
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: '#fff',
                height: 100,
                textAlignVertical: 'top',
                color: '#111827'
              }}
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={200}
            />
          </View>

          <Stepper
            value={dosagePerIntake}
            setValue={setDosagePerIntake}
            min={1}
            max={10}
            label="Dosage per intake (pills)"
          />

          {timesPerDayStepper}

          {/* Reminder Times */}
          <View style={{ marginBottom: 30 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', flex: 1 }}>
                Reminder times
              </Text>
              <Pressable
                onPress={onAddTime}
                disabled={!canAddMoreTimes}
                style={{
                  borderWidth: 2,
                  borderColor: canAddMoreTimes ? "#e5e7eb" : "#e5e7eb",
                  backgroundColor: canAddMoreTimes ? "#fff" : "#f3f4f6",
                  borderRadius: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  opacity: canAddMoreTimes ? 1 : 0.6,
                }}
              >
                <Text style={{ fontWeight: "600", color: '#111827' }}>+ Add</Text>
              </Pressable>
            </View>

            <View style={{ gap: 8 }}>
              {times.map((t, idx) => (
                <ReminderTimeRow
                  key={idx}
                  index={idx}
                  date={t}
                  onTimeChange={onTimeChange}
                  onDelete={onDelete}
                />
              ))}
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={onSave}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#0f172a' : '#111827',
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            })}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Save Medication</Text>
          </Pressable>
        </ScrollView>
      </View>

    </Modal>
  );
}
