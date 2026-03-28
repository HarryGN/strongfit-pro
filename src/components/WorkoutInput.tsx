import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDatabase } from '../contexts/DatabaseContext';
import { useNotifications } from '../hooks/useNotifications';
import { useLocalization } from '../contexts/LocalizationContext';

const SUGGESTION_KEY = 'saved_exercises';

const WorkoutInput: React.FC = () => {
  const { insertWorkoutLog } = useDatabase();
  const { refreshWorkoutCount } = useNotifications();
  const { t } = useLocalization();
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [savedExercises, setSavedExercises] = useState<string[]>([]);

  const loadSavedExercises = async () => {
    try {
      const data = await AsyncStorage.getItem(SUGGESTION_KEY);
      if (data) {
        setSavedExercises(JSON.parse(data));
      }
    } catch (error) {
      console.warn('Load suggestion error', error);
    }
  };

  const saveExerciseName = async (name: string) => {
    if (!name) return;
    const normalized = name.trim();
    if (!normalized) return;

    const set = new Set([...savedExercises, normalized]);
    const list = Array.from(set).slice(0, 100);
    setSavedExercises(list);

    try {
      await AsyncStorage.setItem(SUGGESTION_KEY, JSON.stringify(list));
    } catch (error) {
      console.warn('Save suggestion error', error);
    }
  };

  useEffect(() => {
    loadSavedExercises();
  }, []);

  useEffect(() => {
    const q = exercise.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      return;
    }
    setSuggestions(savedExercises.filter((item) => item.toLowerCase().includes(q)).slice(0, 6));
  }, [exercise, savedExercises]);

  const handleSave = async () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    const s = parseInt(sets);
    if (exercise && !isNaN(w) && !isNaN(r) && !isNaN(s)) {
      await insertWorkoutLog(exercise, w, r, s);
      refreshWorkoutCount();
      await saveExerciseName(exercise);
      // Clear fields
      setExercise('');
      setWeight('');
      setReps('');
      setSets('');
      setSuggestions([]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('logWorkout')}</Text>
      <Text style={styles.label}>{t('exerciseName')}</Text>
      <TextInput
        style={styles.input}
        value={exercise}
        onChangeText={setExercise}
        placeholder={t('exerciseName')}
      />
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setExercise(item); setSuggestions([]); }} style={styles.suggestionItem}>
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Text style={styles.label}>{t('weight')}</Text>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        placeholder={t('weight')}
        keyboardType="numeric"
      />
      <Text style={styles.label}>{t('reps')}</Text>
      <TextInput
        style={styles.input}
        value={reps}
        onChangeText={setReps}
        placeholder={t('reps')}
        keyboardType="numeric"
      />
      <Text style={styles.label}>{t('sets')}</Text>
      <TextInput
        style={styles.input}
        value={sets}
        onChangeText={setSets}
        placeholder={t('sets')}
        keyboardType="numeric"
      />
      <Button title={t('saveWorkout')} onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#d9e3ff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  title: { color: '#1e3a68', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  label: { color: '#4f6195', marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#c3d2ef', backgroundColor: '#fbfdff', borderRadius: 8, padding: 10, marginVertical: 6, color: '#1a2a4f' },
  suggestionItem: { paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8ff', backgroundColor: '#fafcff' },
});

export default WorkoutInput;