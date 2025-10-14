import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import type { HealthSummary } from "../../types/database";
import AddingButton from "./addingButton";

type HomeProps = {
  adherence7d?: number;
  nextDoseTime?: string | null;
  nextMedication?: string | null;
  todayBP?: string | null;
  therapyNote?: string;
  onAdd?: () => void;
  onOpenMedication?: () => void;
  onOpenInstrument?: () => void;
  onOpenTherapy?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  healthSummary?: HealthSummary | null;
};

function SectionCard({
  title,
  subtitle,
  metric,
  icon,
  iconColor,
  onPress,
  loading = false,
}: {
  title: string;
  subtitle?: string;
  metric?: string;
  icon: string;
  iconColor: string;
  onPress?: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => ({
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#ffffff",
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: iconColor + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12
        }}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: '#111827' }}>{title}</Text>
          {subtitle && (
            <Text style={{ marginTop: 4, color: "#6b7280", fontSize: 14 }}>{subtitle}</Text>
          )}
        </View>
        {loading && <ActivityIndicator size="small" color="#6b7280" />}
      </View>
      
      {metric && (
        <View style={{
          backgroundColor: '#f8fafc',
          padding: 12,
          borderRadius: 12,
          borderLeftWidth: 3,
          borderLeftColor: iconColor
        }}>
          <Text style={{ fontWeight: "600", color: '#374151', fontSize: 14 }}>{metric}</Text>
        </View>
      )}
    </Pressable>
  );
}

function QuickStatsCard({ healthSummary }: { healthSummary: HealthSummary | null }) {
  if (!healthSummary) return null;

  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name="analytics" size={24} color="#111827" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Quick Stats</Text>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Active Meds</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
            {healthSummary.medications.active}
          </Text>
        </View>
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>BP Readings</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
            {healthSummary.bloodPressure.lastReading ? '1' : '0'}
          </Text>
        </View>
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Today&apos;s Therapy</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
            {healthSummary.therapy.todaySessions}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function Home({
  adherence7d = 0,
  nextDoseTime,
  nextMedication,
  todayBP,
  therapyNote,
  onAdd,
  onOpenMedication,
  onOpenInstrument,
  onOpenTherapy,
  onRefresh,
  loading = false,
  healthSummary,
}: HomeProps) {
  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: pressed ? '#e5e7eb' : '#f3f4f6',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="refresh" size={20} color="#6b7280" />
        </Pressable>
        <AddingButton onPress={onAdd} />
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary chips */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <View
            style={{
              backgroundColor: "#eef2ff",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="checkmark-circle" size={16} color="#3b82f6" style={{ marginRight: 6 }} />
            <Text style={{ fontWeight: "600", color: '#1e40af' }}>
              7-day adherence: {adherence7d}%
            </Text>
          </View>
          
          {todayBP && (
            <View
              style={{
                backgroundColor: "#ecfeff",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="heart" size={16} color="#0891b2" style={{ marginRight: 6 }} />
              <Text style={{ fontWeight: "600", color: '#0e7490' }}>Today&apos;s BP: {todayBP}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <QuickStatsCard healthSummary={healthSummary} />

        {/* Big sections */}
        <SectionCard
          title="Medication Tracker"
          subtitle="Manage meds, schedules, and adherence"
          metric={nextDoseTime && nextMedication ? 
            `Next dose: ${nextMedication} at ${nextDoseTime}` : 
            "No upcoming doses"
          }
          icon="medical"
          iconColor="#3b82f6"
          onPress={onOpenMedication}
          loading={loading}
        />

        <SectionCard
          title="Blood Pressure Tracker"
          subtitle="Record and monitor your BP readings"
          metric={todayBP ? 
            `Last reading: ${todayBP}` : 
            "No reading logged today"
          }
          icon="heart"
          iconColor="#ef4444"
          onPress={onOpenInstrument}
          loading={loading}
        />

        <SectionCard
          title="Therapy Tracker"
          subtitle="Track exercise, diet, or doctor-advised tasks"
          metric={therapyNote || "No therapy logged today"}
          icon="fitness"
          iconColor="#10b981"
          onPress={onOpenTherapy}
          loading={loading}
        />
      </ScrollView>
    </View>
  );
}
