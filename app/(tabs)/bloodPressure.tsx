// app/(tabs)/bloodPressure.tsx
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
  Text,
  TextInput,
  View
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import type { BloodPressureReading, BloodPressureStats } from "../../types/bloodPressure";
import {
  getBloodPressureCategory,
  getCategoryColor
} from "../../types/bloodPressure";
import {
  addBloodPressureReading,
  calculateBloodPressureStats,
  deleteBloodPressureReading,
  loadBloodPressureReadings
} from "../lib/bloodPressureStorage";

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function BloodPressureReadingRow({ 
  item, 
  onDelete 
}: { 
  item: BloodPressureReading; 
  onDelete: (id: string) => void; 
}) {
  const t = useTranslation();
  
  const handleDelete = () => {
    Alert.alert(
      t('bloodPressure.deleteReading'),
      t('bloodPressure.deleteConfirmation'),
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

  const category = getBloodPressureCategory(item.systolic, item.diastolic);
  const categoryColor = getCategoryColor(category);

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
              borderRadius: 12,
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="heart" size={16} color={categoryColor} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 28, fontWeight: "700", color: categoryColor }}>
                {item.systolic}/{item.diastolic}
              </Text>
            </View>
            <View style={{ 
              backgroundColor: categoryColor + '15', 
              paddingHorizontal: 8, 
              paddingVertical: 4, 
              borderRadius: 12,
              alignSelf: 'flex-start'
            }}>
              <Text style={{ fontSize: 12, color: categoryColor, fontWeight: '600' }}>
                {t(`bloodPressure.${category}`)}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="time-outline" size={14} color="#6b7280" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: '#374151' }}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
            {item.pulse && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="pulse-outline" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: '500' }}>
                  {item.pulse} {t('common.bpm')}
                </Text>
              </View>
            )}
          </View>
        </View>
        {item.notes && (
          <View style={{ 
            backgroundColor: '#f8fafc', 
            padding: 12, 
            borderRadius: 8, 
            borderLeftWidth: 3, 
            borderLeftColor: categoryColor 
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

function AddReadingModal({ 
  visible, 
  onClose, 
  onSave 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSave: (reading: Omit<BloodPressureReading, 'id' | 'timestamp'>) => void; 
}) {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');
  const t = useTranslation();

  const handleSave = () => {
    const systolicNum = parseInt(systolic);
    const diastolicNum = parseInt(diastolic);
    const pulseNum = pulse ? parseInt(pulse) : undefined;

    if (isNaN(systolicNum) || isNaN(diastolicNum) || systolicNum < 50 || systolicNum > 300 || diastolicNum < 30 || diastolicNum > 200) {
      Alert.alert(t('bloodPressure.invalidReading'), t('bloodPressure.invalidReadingMessage'));
      return;
    }

    if (pulseNum !== undefined && (isNaN(pulseNum) || pulseNum < 30 || pulseNum > 200)) {
      Alert.alert(t('bloodPressure.invalidPulse'), t('bloodPressure.invalidPulseMessage'));
      return;
    }

    onSave({
      systolic: systolicNum,
      diastolic: diastolicNum,
      pulse: pulseNum,
      notes: notes.trim() || undefined
    });

    // Reset form
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNotes('');
    onClose();
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
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{t('bloodPressure.addReading')}</Text>
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
          {/* Blood Pressure Input */}
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
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>{t('bloodPressure.bloodPressure')}</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>{t('bloodPressure.systolic')}</Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 18,
                    fontWeight: '600',
                    backgroundColor: '#fff',
                    textAlign: 'center',
                    color: '#111827'
                  }}
                  placeholder="120"
                  placeholderTextColor="#9ca3af"
                  value={systolic}
                  onChangeText={setSystolic}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>{t('common.topNumber')}</Text>
              </View>
              
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 24 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#9ca3af' }}>/</Text>
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>{t('bloodPressure.diastolic')}</Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 18,
                    fontWeight: '600',
                    backgroundColor: '#fff',
                    textAlign: 'center',
                    color: '#111827'
                  }}
                  placeholder="80"
                  placeholderTextColor="#9ca3af"
                  value={diastolic}
                  onChangeText={setDiastolic}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>{t('common.bottomNumber')}</Text>
              </View>
            </View>
          </View>

          {/* Pulse Input */}
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
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>{t('bloodPressure.pulseRate')}</Text>
            
            <TextInput
              style={{
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                padding: 16,
                fontSize: 18,
                fontWeight: '600',
                backgroundColor: '#fff',
                textAlign: 'center',
                color: '#111827'
              }}
              placeholder="72"
              placeholderTextColor="#9ca3af"
              value={pulse}
              onChangeText={setPulse}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>{t('common.beatsPerMinute')}</Text>
          </View>

          {/* Notes Input */}
          <View style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: 20, 
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' }}>{t('bloodPressure.notes')}</Text>
            
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
              placeholder={t('bloodPressure.notesPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={200}
            />
            <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'right', marginTop: 4 }}>
              {notes.length}/200
            </Text>
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
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('bloodPressure.saveReading')}</Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function StatsCard({ stats }: { stats: BloodPressureStats }) {
  const t = useTranslation();
  
  if (stats.readingsCount === 0) {
    return (
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        marginHorizontal: 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      }}>
        <Ionicons name="analytics-outline" size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6b7280', textAlign: 'center', marginBottom: 8 }}>
          {t('bloodPressure.noReadingsYetStats')}
        </Text>
        <Text style={{ fontSize: 14, color: "#9ca3af", textAlign: 'center', lineHeight: 20 }}>
          {t('bloodPressure.addFirstReading')}
        </Text>
      </View>
    );
  }

  const lastCategory = stats.lastReading ? getBloodPressureCategory(stats.lastReading.systolic, stats.lastReading.diastolic) : 'normal';
  const categoryColor = getCategoryColor(lastCategory);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'trending-up';
      case 'decreasing': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'help-circle';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return '#ef4444';
      case 'decreasing': return '#10b981';
      case 'stable': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Ionicons name="analytics" size={24} color="#111827" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{t('bloodPressure.statistics')}</Text>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>{t('bloodPressure.averageBp')}</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
            {stats.averageSystolic}/{stats.averageDiastolic}
          </Text>
        </View>
        
        {stats.averagePulse && (
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>{t('bloodPressure.avgPulse')}</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
              {stats.averagePulse} {t('common.bpm')}
            </Text>
          </View>
        )}
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>{t('bloodPressure.readings')}</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
            {stats.readingsCount}
          </Text>
        </View>
      </View>

      <View style={{ 
        backgroundColor: '#f8fafc', 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 16 
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '500' }}>{t('bloodPressure.lastReading')}</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: categoryColor }}>
            {stats.lastReading?.systolic}/{stats.lastReading?.diastolic}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '500' }}>{t('bloodPressure.trend')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons 
              name={getTrendIcon(stats.trend)} 
              size={16} 
              color={getTrendColor(stats.trend)} 
              style={{ marginRight: 4 }} 
            />
            <Text style={{ fontSize: 14, fontWeight: '600', color: getTrendColor(stats.trend), textTransform: 'capitalize' }}>
              {stats.trend}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function BloodPressurePage() {
  const { height: screenHeight } = Dimensions.get('window');
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [stats, setStats] = useState<BloodPressureStats>({
    averageSystolic: 0,
    averageDiastolic: 0,
    readingsCount: 0,
    trend: 'unknown'
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const t = useTranslation();
  
  // Calculate responsive button size
  const isSmallScreen = screenHeight < 700;
  const buttonSize = isSmallScreen ? 32 : 36;

  useEffect(() => {
    loadReadings();
  }, []);

  useEffect(() => {
    setStats(calculateBloodPressureStats(readings));
  }, [readings]);

  async function loadReadings() {
    const loadedReadings = await loadBloodPressureReadings();
    setReadings(loadedReadings);
  }

  async function onDelete(id: string) {
    await deleteBloodPressureReading(id);
    await loadReadings();
  }

  async function handleAddReading(readingData: Omit<BloodPressureReading, 'id' | 'timestamp'>) {
    const newReading: BloodPressureReading = {
      ...readingData,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    await addBloodPressureReading(newReading);
    await loadReadings();
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('navigation.bp'),
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
          <StatsCard stats={stats} />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginHorizontal: 4 }}>
            <Ionicons name="list" size={20} color="#111827" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 20, fontWeight: "700", color: '#111827' }}>
              {t('bloodPressure.recentReadings')}
            </Text>
          </View>

          {readings.length === 0 ? (
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
              <Ionicons name="heart-outline" size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
              <Text style={{ color: "#6b7280", textAlign: 'center', marginBottom: 8, fontSize: 16, fontWeight: '600' }}>
                {t('bloodPressure.noReadingsYet')}
              </Text>
              <Text style={{ color: "#9ca3af", textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
                {t('bloodPressure.startTracking')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={readings}
              keyExtractor={(r) => r.id}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={({ item }) => (
                <BloodPressureReadingRow
                  item={item}
                  onDelete={onDelete}
                />
              )}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
      </View>

      <AddReadingModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddReading}
      />
    </>
  );
}
