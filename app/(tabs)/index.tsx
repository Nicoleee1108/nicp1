// app/(tabs)/index.tsx
import { useTranslation } from "@/hooks/useLanguage";
import { useFocusEffect } from "@react-navigation/native";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { LanguageButton } from "../../components/LanguageButton";
import { LanguagePopup } from "../../components/LanguagePopup";
import Home from "../../components/ui/Home";
import type { HealthSummary } from "../../types/database";
import type { Med } from "../../types/med";
import { healthDB } from "../lib/database";

export default function Index() {
  const { height: screenHeight } = Dimensions.get('window');
  const [meds, setMeds] = useState<Med[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLanguagePopup, setShowLanguagePopup] = useState(false);
  const t = useTranslation();
  
  // Calculate responsive title size
  const isSmallScreen = screenHeight < 700;

  useEffect(() => {
    loadHealthData();
  }, []);

  // Refresh data whenever the home tab becomes active
  useFocusEffect(
    useCallback(() => {
      loadHealthData();
    }, [])
  );

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
            headerTitle: t('navigation.home'),
            headerTitleStyle: {
              fontSize: isSmallScreen ? 22 : 26,
              fontWeight: "800",
              color: "#111827",
            },
            headerTitleAlign: "center",
            headerRight: () => (
              <LanguageButton onPress={() => setShowLanguagePopup(true)} />
            ),
          }}
        />
        <Home
          nextDoseTime={null}
          nextMedication={null}
          todayBP={null}
          therapyNote={t('common.loading')}
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
            headerTitle: t('navigation.home'),
          headerTitleStyle: {
            fontSize: isSmallScreen ? 22 : 26,
            fontWeight: "800",
            color: "#111827",
          },
          headerTitleAlign: "center",
          headerRight: () => (
            <LanguageButton onPress={() => setShowLanguagePopup(true)} />
          ),
        }}
      />

      <Home
        nextDoseTime={healthSummary?.medications.nextDose?.time || null}
        nextMedication={healthSummary?.medications.nextDose?.medication || null}
        todayBP={healthSummary?.bloodPressure.lastReading ? 
          `${healthSummary.bloodPressure.lastReading.systolic}/${healthSummary.bloodPressure.lastReading.diastolic}` : 
          null
        }
        therapyNote={healthSummary?.therapy.lastSession ? 
          `${healthSummary.therapy.lastSession.title} - ${healthSummary.therapy.lastSession.description}` : 
          t('home.noTherapyToday')
        }
        onOpenMedication={() => router.push("/medication")}
        onOpenInstrument={() => router.push("/bloodPressure")}
        onOpenTherapy={() => router.push("/therapy")}
        onRefresh={refreshData}
        loading={false}
        healthSummary={healthSummary}
      />

      <LanguagePopup
        visible={showLanguagePopup}
        onClose={() => setShowLanguagePopup(false)}
      />
    </>
  );
}
