import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { useDatabase } from '../contexts/DatabaseContext';
import { useLocalization } from '../contexts/LocalizationContext';

const screenWidth = Dimensions.get('window').width;

const groupByTime = (date: Date, range: 'weekly' | 'monthly' | 'yearly') => {
  if (range === 'weekly') {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day);
    return weekStart.toISOString().slice(0, 10);
  }
  if (range === 'monthly') {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  return `${date.getFullYear()}`;
};

const WorkoutChart: React.FC = () => {
  const { getWorkoutLogsAll } = useDatabase();
  const { t } = useLocalization();
  const [allExercises, setAllExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [range, setRange] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [chartData, setChartData] = useState<any>(null);

  const loadLogs = async () => {
    const logs = await getWorkoutLogsAll();
    const exercises = Array.from(new Set(logs.map((item) => item.exercise_name || t('selectExercise')))).filter(Boolean);
    setAllExercises(exercises);
    if (!selectedExercise && exercises.length) {
      setSelectedExercise(exercises[0]);
    }

    if (selectedExercise) {
      const filtered = logs.filter((item) => item.exercise_name === selectedExercise);
      const buckets: Record<string, number[]> = {};
      filtered.forEach((entry) => {
        const key = groupByTime(new Date(entry.date), range);
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(entry.weight);
      });

      const sortedKeys = Object.keys(buckets).sort();
      const dataset = sortedKeys.map((key) => {
        const arr = buckets[key];
        return arr.length ? Math.max(...arr) : 0;
      });

      setChartData({ labels: sortedKeys, datasets: [{ data: dataset }] });
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedExercise, range]);

  if (!allExercises.length) {
    return <Text style={styles.empty}>{t('noData')}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('progressByExercise')}</Text>
      <Picker
        selectedValue={selectedExercise}
        onValueChange={(itemValue) => setSelectedExercise(itemValue)}
        style={styles.picker}
      >
        {allExercises.map((item) => (
          <Picker.Item key={item} label={item} value={item} />
        ))}
      </Picker>

      <View style={styles.rangeRow}>
        {(['weekly', 'monthly', 'yearly'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.rangeButton, range === item && styles.rangeButtonActive]}
            onPress={() => setRange(item)}
          >
            <Text style={[styles.rangeText, range === item && styles.rangeTextActive]}>{t(item)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {chartData && chartData.labels.length ? (
        <LineChart
          data={chartData}
          width={Math.max(screenWidth - 40, 320)}
          height={240}
          yAxisSuffix="kg"
          xLabelsOffset={-6}
          chartConfig={{
            backgroundColor: '#f7faff',
            backgroundGradientFrom: '#f7faff',
            backgroundGradientTo: '#dce8ff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(24, 44, 90, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(24, 44, 90, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#1b4dd5' },
          }}
          style={styles.chart}
          bezier
          fromZero
          verticalLabelRotation={-45}
        />
      ) : (
        <Text style={styles.empty}>{t('noData')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#d0dff6', marginBottom: 14 },
  title: { fontWeight: 'bold', marginBottom: 10, color: '#21456f' },
  picker: { height: 50, width: '100%', marginBottom: 10 },
  rangeRow: { flexDirection: 'row', marginBottom: 10 },
  rangeButton: { marginRight: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#e7efff' },
  rangeButtonActive: { backgroundColor: '#2e62d4' },
  rangeText: { color: '#1f437f' },
  rangeTextActive: { color: '#fff' },
  chart: { borderRadius: 16, marginVertical: 10 },
  empty: { textAlign: 'center', color: '#60749f', marginVertical: 20 },
});

export default WorkoutChart;

