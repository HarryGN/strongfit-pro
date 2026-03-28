import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDatabase } from '../contexts/DatabaseContext';
import { useLocalization } from '../contexts/LocalizationContext';

const TARGET_KEY = 'nutrition_target_settings';

const NutritionTarget: React.FC = () => {
  const { getNutritionLogsToday } = useDatabase();
  const { t } = useLocalization();

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetCalories, setTargetCalories] = useState('2200');
  const [targetProtein, setTargetProtein] = useState('130');
  const [todayTotals, setTodayTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await AsyncStorage.getItem(TARGET_KEY);
        if (settings) {
          const parsed = JSON.parse(settings);
          setHeight(parsed.height || '');
          setWeight(parsed.weight || '');
          setTargetCalories(parsed.targetCalories || '2200');
          setTargetProtein(parsed.targetProtein || '130');
        }
      } catch (err) {
        console.log('Nutrition target load:', err);
      }
      refreshTotals();
    };
    load();
  }, []);

  const refreshTotals = async () => {
    const logs = await getNutritionLogsToday();
    const totals = logs.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    setTodayTotals(totals);
  };

  const saveTargetSettings = async () => {
    try {
      await AsyncStorage.setItem(
        TARGET_KEY,
        JSON.stringify({ height, weight, targetCalories, targetProtein })
      );
      if (height && weight) {
        const h = parseFloat(height);
        const w = parseFloat(weight);
        if (!isNaN(h) && !isNaN(w)) {
          const bmr = 10 * w + 6.25 * h - 5 * 30 + 5; // approximate
          setTargetCalories(Math.round(bmr * 1.2).toString());
        }
      }
    } catch (err) {
      console.log('Nutrition target save:', err);
    }
  };

  const progressPercent = (current: number, target: number): number => {
    if (!target) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('nutritionTarget')}</Text>

      <Text style={styles.field}>{t('height')} (cm)</Text>
      <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />
      <Text style={styles.field}>{t('weight')} (kg)</Text>
      <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />

      <Text style={styles.field}>{t('targetCalories')} (kcal)</Text>
      <TextInput style={styles.input} value={targetCalories} onChangeText={setTargetCalories} keyboardType="numeric" />
      <Text style={styles.field}>{t('targetProtein')} (g)</Text>
      <TextInput style={styles.input} value={targetProtein} onChangeText={setTargetProtein} keyboardType="numeric" />

      <Button title={t('setTarget')} onPress={saveTargetSettings} />

      <View style={styles.separator} />
      <Text style={styles.subTitle}>{t('todayIntake')}</Text>
      <Text style={styles.label}>{t('calories')}: {todayTotals.calories} / {targetCalories}</Text>
      <Text style={styles.label}>{t('protein')}: {todayTotals.protein} / {targetProtein}</Text>

      <Text style={styles.label}>{t('calorieProgress')} {progressPercent(todayTotals.calories, Number(targetCalories))}%</Text>
      <Text style={styles.label}>{t('proteinProgress')} {progressPercent(todayTotals.protein, Number(targetProtein))}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#d5e4fa', padding: 14 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#1f3f72' },
  field: { fontSize: 13, marginTop: 8, color: '#3e557d' },
  input: { borderWidth: 1, borderColor: '#c8d5ee', borderRadius: 8, padding: 8, marginTop: 4, backgroundColor: '#f7faff' },
  separator: { height: 1, backgroundColor: '#d8e6fb', marginVertical: 12 },
  subTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  label: { fontSize: 14, marginBottom: 4, color: '#2a4482' },
});

export default NutritionTarget;
