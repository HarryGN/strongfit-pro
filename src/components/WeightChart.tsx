import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useDatabase } from '../contexts/DatabaseContext';

const screenWidth = Dimensions.get('window').width;

const WeightChart: React.FC = () => {
  const { getBodyWeightsLastMonth } = useDatabase();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const weights = await getBodyWeightsLastMonth();
      if (weights.length === 0) return;

      const sortedWeights = weights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const labels = sortedWeights.map(w => new Date(w.date).toLocaleDateString());
      const dataPoints = sortedWeights.map(w => w.weight);

      setData({
        labels,
        datasets: [{
          data: dataPoints,
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 2,
        }],
      });
    };
    loadData();
  }, []);

  if (!data) {
    return <Text>No data available</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Trend (Last Month)</Text>
      <LineChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#f7faff',
          backgroundGradientFrom: '#f7faff',
          backgroundGradientTo: '#dce8ff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(34, 56, 102, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(34, 56, 102, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: '#2b71ff',
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#d0dff6', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#21456f' },
  chart: { marginVertical: 8, borderRadius: 16 },
});

export default WeightChart;