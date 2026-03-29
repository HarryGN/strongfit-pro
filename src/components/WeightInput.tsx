import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';

const WeightInput: React.FC = () => {
  const { insertBodyWeight, getLastBodyWeight } = useDatabase();
  const [weight, setWeight] = useState('');
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

  useEffect(() => {
    const loadLastWeight = async () => {
      const w = await getLastBodyWeight();
      setLastWeight(w);
    };
    loadLastWeight();
  }, []);

  const handleSave = async () => {
    const num = parseFloat(weight);
    if (!isNaN(num)) {
      const weightInKg = unit === 'kg' ? num : num / 2.20462;
      await insertBodyWeight(weightInKg);
      setLastWeight(weightInKg);
      setWeight('');
    }
  };

  const formatLastWeight = () => {
    if (!lastWeight) return 'None';
    return unit === 'kg'
      ? `${lastWeight.toFixed(1)} kg`
      : `${(lastWeight * 2.20462).toFixed(1)} lbs`;
  };

  return (
    <View style={styles.container}>
      <Text>Last Weight: {formatLastWeight()}</Text>
      <View style={styles.unitRow}>
        <TouchableOpacity
          style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
          onPress={() => setUnit('kg')}
        >
          <Text style={[styles.unitButtonText, unit === 'kg' && styles.unitButtonTextActive]}>kg</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.unitButton, unit === 'lbs' && styles.unitButtonActive]}
          onPress={() => setUnit('lbs')}
        >
          <Text style={[styles.unitButtonText, unit === 'lbs' && styles.unitButtonTextActive]}>lbs</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        placeholder={`Enter weight in ${unit}`}
        keyboardType="numeric"
      />
      <Button title="Save Weight" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#d9e3ff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  label: { color: '#21346d', marginBottom: 8, fontWeight: 'bold' },
  unitRow: { flexDirection: 'row', marginTop: 10, marginBottom: 4 },
  unitButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#e7efff', marginRight: 8 },
  unitButtonActive: { backgroundColor: '#2e62d4' },
  unitButtonText: { color: '#1f437f', fontWeight: '600' },
  unitButtonTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#c3d2ef', backgroundColor: '#fbfdff', borderRadius: 8, padding: 10, marginVertical: 10, color: '#1a2a4f' },
});

export default WeightInput;