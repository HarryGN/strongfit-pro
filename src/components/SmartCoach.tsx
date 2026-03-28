import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useDatabase } from '../contexts/DatabaseContext';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const SmartCoach: React.FC = () => {
  const { getWorkoutLogsThisWeek, getBodyWeightsLastMonth } = useDatabase();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildPrompt = (workouts: any[], weightHistory: any[]) => {
    const workoutLines = workouts.length
      ? workouts.map((item) => `- ${item.exercise_name}: ${item.weight}kg x ${item.sets}x${item.reps}`).join('\n')
      : 'No workouts logged yet.';

    const weightLines = weightHistory.length
      ? weightHistory
          .slice(-7)
          .map((entry) => `- ${new Date(entry.date).toLocaleDateString()}: ${entry.weight}kg`)
          .join('\n')
      : 'No body weight records yet.';

    return `You are a premium gym coach AI (Haoran Guan user). Review the weekly data and provide:
1) short summary of performance
2) targeted next-week plan with warm-ups, strength, cardio, recovery
3) nutrition and hydration guidance
4) overall motivation.

Workout data:\n${workoutLines}\n\nWeight data:\n${weightLines}\n\nRespond in a concise but professional style (3-5 bullets).`;
  };

  const generatePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const workouts = await getWorkoutLogsThisWeek();
      const weights = await getBodyWeightsLastMonth();
      const prompt = buildPrompt(workouts, weights);

      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
      const result = await model.generateContent([prompt]);
      const text = result.response?.text?.() ?? 'No response from AI.';

      setSummary(text);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate premium plan. Check Gemini API access and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Coach</Text>
      <Text style={styles.subtitle}>Gemini 3.1 Flash Lite summary and 7-day improvement plan</Text>

      <Button title="Generate Next Week Plan" onPress={generatePlan} color="#ffab00" />

      {loading && <ActivityIndicator style={styles.loader} color="#fff" />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {summary ? (
        <ScrollView style={styles.summaryBox}>
          <Text style={styles.summaryText}>{summary}</Text>
        </ScrollView>
      ) : (
        <Text style={styles.hint}>Tap the button to create your weekly premium plan.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, marginBottom: 20, backgroundColor: '#121212', borderRadius: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffeb3b', marginBottom: 6 },
  subtitle: { color: '#fff', marginBottom: 12 },
  loader: { marginVertical: 12 },
  error: { color: '#ff8a80', marginVertical: 10 },
  summaryBox: { marginTop: 10, padding: 12, backgroundColor: '#1e1e1e', borderRadius: 10, maxHeight: 220 },
  summaryText: { color: '#e0e0e0', fontSize: 14 },
  hint: { color: '#b0bec5', marginTop: 10, fontStyle: 'italic' },
});

export default SmartCoach;
