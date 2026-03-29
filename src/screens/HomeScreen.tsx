import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WeightInput from '../components/WeightInput';
import WorkoutInput from '../components/WorkoutInput';
import NutritionInput from '../components/NutritionInput';
import NutritionTarget from '../components/NutritionTarget';
import WeeklyProgress from '../components/WeeklyProgress';
import WeightChart from '../components/WeightChart';
import WorkoutChart from '../components/WorkoutChart';
import SmartCoach from '../components/SmartCoach';
import { useDatabase } from '../contexts/DatabaseContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

const HomeScreen: React.FC = () => {
  const { t, lang, setLang } = useLocalization();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'progress' | 'coach' | 'nutrition'>('dashboard');
  const [progressMode, setProgressMode] = useState<'chart' | 'table'>('chart');
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);
  const [encouragement, setEncouragement] = useState<string>('');
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  const { getBodyWeightsAll, getWorkoutLogsAll, getNutritionLogsAll, deleteBodyWeight, deleteWorkoutLog, deleteNutritionLog } = useDatabase();

  const loadData = async () => {
    if (activeTab !== 'progress') return;
    const [weights, workouts, nutrition] = await Promise.all([
      getBodyWeightsAll(),
      getWorkoutLogsAll(),
      getNutritionLogsAll(),
    ]);
    setWeightHistory(weights);
    setWorkoutHistory(workouts);
    setNutritionHistory(nutrition);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleDeleteBodyWeight = async (id: number) => {
    await deleteBodyWeight(id);
    loadData();
  };

  const handleDeleteWorkoutLog = async (id: number) => {
    await deleteWorkoutLog(id);
    loadData();
  };

  const handleDeleteNutritionLog = async (id: number) => {
    await deleteNutritionLog(id);
    loadData();
  };

  useEffect(() => {
    const fetchEncouragement = async () => {
      try {
        const prompt = `Provide one strong motivational sentence in concise style for Harry, an elite gym user, to start the day.`;
        if (!genAI) {
          setEncouragement(t('hi'));
          return;
        }
        const modelNames = ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
        let text = '';

        for (const modelName of modelNames) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([prompt]);
            text = result.response?.text?.() ?? '';
            if (text.trim()) break;
          } catch (modelError) {
            console.warn(`Encouragement model failed: ${modelName}`, modelError);
          }
        }

        setEncouragement(text.trim() || t('hi'));
      } catch (error) {
        console.warn('Encouragement fetch failed', error);
        setEncouragement(t('hi'));
      }
    };

    fetchEncouragement();
  }, [lang]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <WeightInput />
            <WorkoutInput />
            <NutritionInput />
            <WeeklyProgress />
          </>
        );
      case 'progress':
        return (
          <View>
            <View style={styles.modeSwitch}>
              <TouchableOpacity onPress={() => setProgressMode('chart')} style={[styles.smallTab, progressMode === 'chart' && styles.tabActive]}>
                <Text style={[styles.smallTabText, progressMode === 'chart' && styles.tabTextActive]}>{t('chart')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setProgressMode('table')} style={[styles.smallTab, progressMode === 'table' && styles.tabActive]}>
                <Text style={[styles.smallTabText, progressMode === 'table' && styles.tabTextActive]}>{t('table')}</Text>
              </TouchableOpacity>
            </View>

            {progressMode === 'chart' ? (
              <>
                <WorkoutChart />
                <WeightChart />
              </>
            ) : (
              <View style={styles.logTable}>
                <Text style={styles.tableTitle}>Body Weight History</Text>
                {weightHistory.length === 0 ? <Text style={styles.empty}>No body weight entries yet.</Text> : weightHistory.map((item) => (
                  <View key={`w-${item.id}`} style={styles.tableRow}>
                    <Text style={styles.rowText}>{new Date(item.date).toLocaleDateString()} • {item.weight} kg</Text>
                    <TouchableOpacity onPress={() => handleDeleteBodyWeight(item.id)} style={styles.deleteButton}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={[styles.tableTitle, { marginTop: 14 }]}>Workout History</Text>
                {workoutHistory.length === 0 ? <Text style={styles.empty}>No workout logs yet.</Text> : workoutHistory.map((item) => (
                  <View key={`wk-${item.id}`} style={styles.tableRow}>
                    <Text style={styles.rowText}>{new Date(item.date).toLocaleDateString()} • {item.exercise_name} • {item.weight}kg x{item.reps}x{item.sets}</Text>
                    <TouchableOpacity onPress={() => handleDeleteWorkoutLog(item.id)} style={styles.deleteButton}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={[styles.tableTitle, { marginTop: 14 }]}>Nutrition History</Text>
                {nutritionHistory.length === 0 ? <Text style={styles.empty}>No nutrition logs yet.</Text> : nutritionHistory.map((item) => (
                  <View key={`n-${item.id}`} style={styles.tableRow}>
                    <Text style={styles.rowText}>{new Date(item.date).toLocaleDateString()} • {item.food_name} • {item.calories} kcal</Text>
                    <TouchableOpacity onPress={() => handleDeleteNutritionLog(item.id)} style={styles.deleteButton}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      case 'nutrition':
        return <NutritionTarget />;
      case 'coach':
        return <SmartCoach />;
    }
  };

  return (
    <SafeAreaView style={styles.appContainer}>
      <View style={styles.header}>
        <Text style={styles.brand}>StrongFit Pro</Text>
        <Text style={styles.welcome}>{encouragement || t('hi')}</Text>
        <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'en' ? 'zh' : 'en')}>
          <Text style={styles.langBtnText}>{lang === 'en' ? t('chinese') : t('english')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>{t('dashboard')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('progress')} style={[styles.tab, activeTab === 'progress' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>{t('progress')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('nutrition')} style={[styles.tab, activeTab === 'nutrition' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'nutrition' && styles.tabTextActive]}>{t('nutrition')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('coach')} style={[styles.tab, activeTab === 'coach' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'coach' && styles.tabTextActive]}>{t('coach')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#f2f5ff' },
  header: { backgroundColor: '#2e3f72', paddingVertical: 18, paddingHorizontal: 16, paddingTop: 60 },
  brand: { color: '#fff', fontSize: 17, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.9 },
  welcome: { color: '#dde7ff', marginTop: 6, fontSize: 15 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#dde8ff', paddingVertical: 10 },
  tab: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 9, backgroundColor: '#2e3f72' },
  tabActive: { backgroundColor: '#47B3FF' },
  tabText: { color: '#d9e6ff', fontWeight: '600' },
  tabTextActive: { color: '#0B1452' },
  langBtn: { marginTop: 10, alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#80a7f0', backgroundColor: '#e9efff' },
  langBtnText: { color: '#2e4baa', fontWeight: '700' },
  modeSwitch: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, marginBottom: 8 },
  smallTab: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, marginHorizontal: 6, backgroundColor: '#2e3f72' },
  smallTabText: { color: '#d9e6ff', fontWeight: '600' },
  logTable: { backgroundColor: '#e6f0ff', padding: 14, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#91b5f6' },
  tableTitle: { color: '#2f4f80', fontWeight: '700', marginBottom: 6 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#d0e0ff' },
  rowText: { color: '#1f3560', fontSize: 13, flex: 1, marginRight: 10 },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#ff6565', borderRadius: 6 },
  deleteText: { color: '#fff', fontWeight: '700' },
  empty: { color: '#1f3f70', marginBottom: 8, fontSize: 13 },
  container: { flex: 1, padding: 10, minHeight: 0 },
  scrollContent: { paddingBottom: 40 },
});

export default HomeScreen;