import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';

const WeightInput: React.FC = () => {
  const { insertBodyWeight, getLastBodyWeight } = useDatabase();
  const [weight, setWeight] = useState('');
  const [lastWeight, setLastWeight] = useState<number | null>(null);

  useEffect(() => {
    const loadLastWeight = async () => {
      const w = await getLastBodyWeight();
      setLastWeight(w);
      if (w) setWeight(w.toString());
    };
    loadLastWeight();
  }, []);

  const handleSave = async () => {
    const num = parseFloat(weight);
    if (!isNaN(num)) {
      await insertBodyWeight(num);
      setLastWeight(num);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Last Weight: {lastWeight ? `${lastWeight} kg` : 'None'}</Text>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        placeholder="Enter weight in kg"
        keyboardType="numeric"
      />
      <Button title="Save Weight" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#d9e3ff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  label: { color: '#21346d', marginBottom: 8, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#c3d2ef', backgroundColor: '#fbfdff', borderRadius: 8, padding: 10, marginVertical: 10, color: '#1a2a4f' },
});

export default WeightInput;