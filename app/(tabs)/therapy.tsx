// app/(tabs)/therapy.tsx
import { useTranslation } from "@/hooks/useLanguage";
import { Ionicons } from '@expo/vector-icons';
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import type { TherapySession, TherapyReminder } from "../../types/database";
import { healthDB } from "../lib/database";
import TimePickerBottomSheet from "../../components/TimePickerBottomSheet";
import { scheduleTherapyReminder, cancelTherapyReminder, ensureNotificationSetup } from "../lib/notifications";

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function SwipeableTherapySessionRow({ 
  item, 
  onDelete 
}: { 
  item: TherapySession; 
  onDelete: (id: string) => void; 
}) {
  const t = useTranslation();
  
  const handleDelete = () => {
    Alert.alert(
      t('therapy.deleteSession'),
      t('therapy.deleteConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: "cancel",
        },
        {
          text: t('common.delete'),
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exercise': return 'fitness';
      case 'diet': return 'restaurant';
      default: return 'medical';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exercise': return '#10b981';
      case 'diet': return '#f59e0b';
      default: return '#3b82f6';
    }
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
              <Ionicons 
                name={getTypeIcon(item.type) as any} 
                size={16} 
                color={getTypeColor(item.type)} 
                style={{ marginRight: 6 }} 
              />
              <Text style={{ fontSize: 18, fontWeight: "700", color: '#111827' }}>
                {item.title}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
              {item.description}
            </Text>
            {item.duration && (
              <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: '500' }}>
                {t('therapy.durationLabel', { duration: item.duration })}
              </Text>
            )}
            {item.reminder && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="notifications" size={12} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: "#10b981", fontWeight: '500' }}>
                  {t('therapy.reminderEnabled')} • {String(item.reminder.hour).padStart(2, '0')}:{String(item.reminder.minute).padStart(2, '0')} • {t(`therapy.${item.reminder.frequency}`)}
                </Text>
              </View>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: '500' }}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
        </View>
        {item.notes && (
          <View style={{ 
            backgroundColor: '#f8fafc', 
            padding: 12, 
            borderRadius: 8, 
            borderLeftWidth: 3, 
            borderLeftColor: getTypeColor(item.type) 
          }}>
            <Text style={{ fontSize: 14, color: "#4b5563", fontStyle: 'italic', lineHeight: 20 }}>
              &ldquo;{item.notes}&rdquo;
            </Text>
          </View>
        )}
      </View>
    </Swipeable>
  );
}

function AddSessionModal({ 
  visible, 
  onClose, 
  onSave 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSave: (session: Omit<TherapySession, 'id' | 'timestamp'>) => void; 
}) {
  const [type, setType] = useState<'exercise' | 'diet' | 'other'>('exercise');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState<'daily' | 'weekly'>('daily');
  const t = useTranslation();

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(t('therapy.missingInformation'), t('therapy.missingInformationMessage'));
      return;
    }

    const durationNum = duration ? parseInt(duration) : undefined;
    if (durationNum !== undefined && (isNaN(durationNum) || durationNum < 0)) {
      Alert.alert(t('therapy.invalidDuration'), t('therapy.invalidDurationMessage'));
      return;
    }

    let reminder: TherapyReminder | undefined;

    if (enableReminder) {
      try {
        const setupOk = await ensureNotificationSetup();
        if (setupOk) {
          const reminderData = await scheduleTherapyReminder(
            title.trim(),
            description.trim(),
            reminderTime,
            reminderFrequency
          );

          reminder = {
            notificationId: reminderData.notificationId,
            hour: reminderData.hour,
            minute: reminderData.minute,
            isActive: true,
            frequency: reminderFrequency
          };
        } else {
          Alert.alert(
            t('medication.notificationsDisabled'),
            t('medication.notificationsDisabledMessage')
          );
          // Continue without reminder
        }
      } catch (error) {
        console.error('Error scheduling reminder:', error);
        Alert.alert('Error', 'Failed to schedule reminder. Please try again.');
        return;
      }
    }

    onSave({
      type,
      title: title.trim(),
      description: description.trim(),
      duration: durationNum,
      notes: notes.trim() || undefined,
      reminder
    });

    // Reset form
    setType('exercise');
    setTitle('');
    setDescription('');
    setDuration('');
    setNotes('');
    setEnableReminder(false);
    setReminderTime(new Date());
    setReminderFrequency('daily');
    onClose();
  };

  const getTypeIcon = (sessionType: string) => {
    switch (sessionType) {
      case 'exercise': return 'fitness';
      case 'diet': return 'restaurant';
      default: return 'medical';
    }
  };

  const getTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case 'exercise': return '#10b981';
      case 'diet': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

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
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{t('therapy.addSession')}</Text>
            </View>
            <Pressable 
              onPress={onClose}
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
          {/* Type Selection */}
          <View style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: 20, 
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>{t('therapy.type')}</Text>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {(['exercise', 'diet', 'other'] as const).map((sessionType) => (
                <Pressable
                  key={sessionType}
                  onPress={() => setType(sessionType)}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: type === sessionType ? getTypeColor(sessionType) : '#e5e7eb',
                    backgroundColor: type === sessionType ? getTypeColor(sessionType) + '10' : '#fff',
                    alignItems: 'center'
                  }}
                >
                  <Ionicons 
                    name={getTypeIcon(sessionType) as any} 
                    size={24} 
                    color={type === sessionType ? getTypeColor(sessionType) : '#6b7280'} 
                    style={{ marginBottom: 8 }} 
                  />
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: '600', 
                    color: type === sessionType ? getTypeColor(sessionType) : '#6b7280',
                    textTransform: 'capitalize'
                  }}>
                    {t(`therapy.${sessionType}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>{t('therapy.titleLabel')}</Text>
            <TextInput
              style={{
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: '#fff',
                color: '#111827'
              }}
              placeholder={t('therapy.titlePlaceholder')}
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>{t('therapy.description')}</Text>
            <TextInput
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
              placeholder={t('therapy.descriptionPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={300}
            />
          </View>

          {/* Duration */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>{t('therapy.duration')}</Text>
            <TextInput
              style={{
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                backgroundColor: '#fff',
                textAlign: 'center',
                color: '#111827'
              }}
              placeholder={t('therapy.durationPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>{t('common.minutes')}</Text>
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>{t('therapy.notes')}</Text>
            <TextInput
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
              placeholder={t('therapy.notesPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={200}
            />
          </View>

          {/* Reminder Settings */}
          <View style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: 20, 
            marginBottom: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>{t('therapy.reminderSettings')}</Text>
            
            {/* Enable Reminder Toggle */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, color: '#374151' }}>{t('therapy.enableReminder')}</Text>
              <Switch
                value={enableReminder}
                onValueChange={setEnableReminder}
                trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                thumbColor={enableReminder ? '#fff' : '#f3f4f6'}
              />
            </View>

            {enableReminder && (
              <>
                {/* Reminder Time */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#374151' }}>{t('therapy.reminderTime')}</Text>
                  <Pressable
                    onPress={() => setShowTimePicker(true)}
                    style={{
                      borderWidth: 2,
                      borderColor: '#e5e7eb',
                      borderRadius: 12,
                      padding: 16,
                      backgroundColor: '#fff',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ fontSize: 16, color: '#111827' }}>
                      {reminderTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </Text>
                    <Ionicons name="time-outline" size={20} color="#6b7280" />
                  </Pressable>
                </View>

                {/* Frequency Selection */}
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#374151' }}>{t('therapy.reminderFrequency')}</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {(['daily', 'weekly'] as const).map((freq) => (
                      <Pressable
                        key={freq}
                        onPress={() => setReminderFrequency(freq)}
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: reminderFrequency === freq ? '#10b981' : '#e5e7eb',
                          backgroundColor: reminderFrequency === freq ? '#10b981' + '10' : '#fff',
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{ 
                          fontSize: 14, 
                          fontWeight: '600', 
                          color: reminderFrequency === freq ? '#10b981' : '#6b7280',
                          textTransform: 'capitalize'
                        }}>
                          {t(`therapy.${freq}`)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('therapy.saveSession')}</Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>

      {/* Time Picker Bottom Sheet */}
      <TimePickerBottomSheet
        visible={showTimePicker}
        initialTime={reminderTime}
        onSave={(time) => {
          setReminderTime(time);
          setShowTimePicker(false);
        }}
        onCancel={() => setShowTimePicker(false)}
      />
    </Modal>
  );
}

export default function TherapyPage() {
  const { height: screenHeight } = Dimensions.get('window');
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const t = useTranslation();
  
  // Calculate responsive button size
  const isSmallScreen = screenHeight < 700;
  const buttonSize = isSmallScreen ? 32 : 36;

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      await healthDB.initialize();
      const loadedSessions = await healthDB.getTherapySessions();
      setSessions(loadedSessions);
    } catch (error) {
      console.error('Error loading therapy sessions:', error);
    }
  }

  async function onDelete(id: string) {
    try {
      // Find the session to get reminder info
      const session = sessions.find(s => s.id === id);
      if (session?.reminder) {
        await cancelTherapyReminder(session.reminder.notificationId);
      }
      
      await healthDB.deleteTherapySession(id);
      await loadSessions();
    } catch (error) {
      console.error('Error deleting therapy session:', error);
    }
  }

  async function handleAddSession(sessionData: Omit<TherapySession, 'id' | 'timestamp'>) {
    try {
      const newSession: TherapySession = {
        ...sessionData,
        id: Date.now().toString(),
        timestamp: new Date()
      };
      
      await healthDB.addTherapySession(newSession);
      await loadSessions();
    } catch (error) {
      console.error('Error adding therapy session:', error);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('navigation.therapy'),
          headerTitleStyle: {
            fontSize: isSmallScreen ? 22 : 26,
            fontWeight: "800",
            color: "#111827",
          },
          headerTitleAlign: "center",
          headerRight: () => (
            <Pressable
              onPress={() => setShowAddModal(true)}
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
            <Ionicons name="fitness" size={20} color="#111827" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 20, fontWeight: "700", color: '#111827' }}>
              {t('therapy.therapySessions')}
            </Text>
          </View>

          {sessions.length === 0 ? (
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
              <Ionicons name="fitness-outline" size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
              <Text style={{ color: "#6b7280", textAlign: 'center', marginBottom: 8, fontSize: 16, fontWeight: '600' }}>
                {t('therapy.noSessionsYet')}
              </Text>
              <Text style={{ color: "#9ca3af", textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
                {t('therapy.startTracking')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={(s) => s.id}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={({ item }) => (
                <SwipeableTherapySessionRow
                  item={item}
                  onDelete={onDelete}
                />
              )}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
      </View>

      <AddSessionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddSession}
      />
    </>
  );
}



