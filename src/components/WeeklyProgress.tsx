import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';

const WeeklyProgress: React.FC = () => {
  const { workoutCount } = useNotifications();

  return (
    <View style={styles.container}>
      <Text>Weekly Workouts: {workoutCount}/3</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${Math.min((workoutCount / 3) * 100, 100)}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  progressBar: { height: 20, backgroundColor: '#ddd', borderRadius: 10, marginTop: 10 },
  progress: { height: 20, backgroundColor: '#4CAF50', borderRadius: 10 },
});

export default WeeklyProgress;