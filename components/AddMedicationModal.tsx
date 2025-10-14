// components/AddMedicationModal.tsx
import { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
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

  const canAddMoreTimes = times.length < 3;

  function resetForm() {
    setName("");
    setUsage("");
    setDosagePerIntake(1);
    setTimesPerDay(3);
    setTimes(defaultTimesFor(3));
  }

  function handleTimesPerDayChange(next: number) {
    const n = Math.max(1, Math.min(3, next));
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
      <View style={{ marginTop: 8 }}>
        <Text style={{ fontWeight: "600", marginBottom: 6 }}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => setValue(Math.max(min, value - 1))}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderTopLeftRadius: 10,
              borderBottomLeftRadius: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700" }}>-</Text>
          </Pressable>
          <View
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: "#d1d5db",
              minWidth: 56,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700" }}>{value}</Text>
          </View>
          <Pressable
            onPress={() => setValue(Math.min(max, value + 1))}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderTopRightRadius: 10,
              borderBottomRightRadius: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700" }}>+</Text>
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
        max={3}
        label="Times per day"
      />
    ),
    [timesPerDay]
  );

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.25)",
            paddingHorizontal: 20,
          }}
        >
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={{
                  width: "100%",
                  maxWidth: 420,
                  backgroundColor: "#fff",
                  padding: 18,
                  borderRadius: 16,
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "800", textAlign: "center" }}>
                  Add Medication
                </Text>

                <ScrollView
                  style={{ maxHeight: 520, marginTop: 12 }}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  <Text style={{ fontWeight: "600" }}>Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g., Lisinopril"
                    style={{
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 6,
                      marginBottom: 12,
                    }}
                  />

                  <Text style={{ fontWeight: "600" }}>Usage (instructions) - Optional</Text>
                  <TextInput
                    value={usage}
                    onChangeText={setUsage}
                    placeholder='e.g., "2 pills per intake; avoid with grapefruit"'
                    style={{
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 6,
                    }}
                    multiline
                  />

                  <Stepper
                    value={dosagePerIntake}
                    setValue={setDosagePerIntake}
                    min={1}
                    max={10}
                    label="Dosage per intake (pills)"
                  />

                  {timesPerDayStepper}

                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Text style={{ fontWeight: "700", fontSize: 16, flex: 1 }}>
                        Reminder times
                      </Text>
                      <Pressable
                        onPress={onAddTime}
                        disabled={!canAddMoreTimes}
                        style={{
                          borderWidth: 1,
                          borderColor: canAddMoreTimes ? "#d1d5db" : "#e5e7eb",
                          backgroundColor: canAddMoreTimes ? "#f9fafb" : "#f3f4f6",
                          borderRadius: 8,
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          opacity: canAddMoreTimes ? 1 : 0.6,
                        }}
                      >
                        <Text style={{ fontWeight: "700" }}>+ Add</Text>
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
                </ScrollView>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <Pressable
                    onPress={() => {
                      resetForm();
                      onCancel();
                    }}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    onPress={onSave}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: "#111827",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700" }}>Save</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </TouchableWithoutFeedback>

    </Modal>
  );
}
