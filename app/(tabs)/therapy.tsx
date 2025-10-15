// app/(tabs)/therapy.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import type { TherapySession } from "../../types/database";
import { healthDB } from "../lib/database";

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function TherapySessionRow({ 
  item, 
  onDelete 
}: { 
  item: TherapySession; 
  onDelete: (id: string) => void; 
}) {
  const handleDelete = () => {
    Alert.alert(
      "Delete Session",
      `Are you sure you want to delete this therapy session?`,
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
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 4,
        marginBottom: 12,
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
              Duration: {item.duration} minutes
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Pressable
            onPress={handleDelete}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#fee2e2',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </Pressable>
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

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please fill in the title and description.');
      return;
    }

    const durationNum = duration ? parseInt(duration) : undefined;
    if (durationNum !== undefined && (isNaN(durationNum) || durationNum < 0)) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration in minutes.');
      return;
    }

    onSave({
      type,
      title: title.trim(),
      description: description.trim(),
      duration: durationNum,
      notes: notes.trim() || undefined
    });

    // Reset form
    setType('exercise');
    setTitle('');
    setDescription('');
    setDuration('');
    setNotes('');
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
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Add Therapy Session</Text>
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
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>Type</Text>
            
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
                    {sessionType}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>Title</Text>
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
              placeholder="e.g., Morning Walk"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>Description</Text>
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
              placeholder="Describe what you did..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={300}
            />
          </View>

          {/* Duration */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>Duration (Optional)</Text>
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
              placeholder="30"
              placeholderTextColor="#9ca3af"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>Minutes</Text>
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>Notes (Optional)</Text>
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
              placeholder="Any additional notes..."
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={200}
            />
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
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Save Session</Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function TherapyPage() {
  const { height: screenHeight } = Dimensions.get('window');
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
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
          title: "Therapy",
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
              Therapy Sessions
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
                No therapy sessions yet
              </Text>
              <Text style={{ color: "#9ca3af", textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
                Start tracking your therapy activities by adding your first session
              </Text>
            </View>
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={(s) => s.id}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={({ item }) => (
                <TherapySessionRow
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



