// app/(tabs)/index.tsx
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions } from "react-native";
import Home from "../../components/ui/Home";
import type { HealthSummary } from "../../types/database";
import type { Med } from "../../types/med";
import { healthDB } from "../lib/database";

export default function Index() {
  const { height: screenHeight } = Dimensions.get('window');
  const [meds, setMeds] = useState<Med[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Calculate responsive title size
  const isSmallScreen = screenHeight < 700;

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      
      // Initialize database and migrate data if needed
      await healthDB.initialize();
      await healthDB.migrateFromOldStorage();
      
      // Load medications (legacy format for compatibility)
      const medications = await healthDB.getMedications();
      const legacyMeds = medications.map(med => ({
        id: med.id,
        name: med.name,
        usage: med.usage,
        dosagePerIntake: med.dosagePerIntake,
        timesPerDay: med.timesPerDay,
        reminders: med.reminders.map(rem => ({
          notificationId: rem.notificationId,
          hour: rem.hour,
          minute: rem.minute
        }))
      }));
      
      setMeds(legacyMeds);
      
      // Load health summary
      const summary = await healthDB.getHealthSummary();
      setHealthSummary(summary);
      
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadHealthData();
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: "Home",
            headerTitleStyle: {
              fontSize: isSmallScreen ? 22 : 26,
              fontWeight: "800",
              color: "#111827",
            },
            headerTitleAlign: "center",
          }}
        />
        <Home
          adherence7d={0}
          nextDoseTime={null}
          nextMedication={null}
          todayBP={null}
          therapyNote="Loading..."
          onOpenMedication={() => router.push("/medication")}
          onOpenInstrument={() => router.push("/bloodPressure")}
          onOpenTherapy={() => router.push("/therapy")}
          onRefresh={refreshData}
          loading={true}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
            headerTitle: "Home",
          headerTitleStyle: {
            fontSize: isSmallScreen ? 22 : 26,
            fontWeight: "800",
            color: "#111827",
          },
          headerTitleAlign: "center",
        }}
      />

      <Home
        adherence7d={healthSummary?.medications.adherence7d || 0}
        nextDoseTime={healthSummary?.medications.nextDose?.time || null}
        nextMedication={healthSummary?.medications.nextDose?.medication || null}
        todayBP={healthSummary?.bloodPressure.lastReading ? 
          `${healthSummary.bloodPressure.lastReading.systolic}/${healthSummary.bloodPressure.lastReading.diastolic}` : 
          null
        }
        therapyNote={healthSummary?.therapy.lastSession ? 
          `${healthSummary.therapy.lastSession.title} - ${healthSummary.therapy.lastSession.description}` : 
          "No therapy logged today"
        }
        onOpenMedication={() => router.push("/medication")}
        onOpenInstrument={() => router.push("/bloodPressure")}
        onOpenTherapy={() => router.push("/therapy")}
        onRefresh={refreshData}
        loading={false}
        healthSummary={healthSummary}
      />
    </>
  );
}
