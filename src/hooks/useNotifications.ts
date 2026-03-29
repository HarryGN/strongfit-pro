import { useEffect, useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';

const countUniqueWorkoutDays = (logs: { date: string }[]) => {
  const uniqueDays = new Set(
    logs.map((log) => {
      if (typeof log.date === 'string' && log.date.includes('T')) {
        return log.date.slice(0, 10);
      }
      return new Date(log.date).toISOString().slice(0, 10);
    })
  );
  return uniqueDays.size;
};

export const useNotifications = () => {
  const { getWorkoutLogsThisWeek } = useDatabase();
  const [workoutCount, setWorkoutCount] = useState(0);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const logs = await getWorkoutLogsThisWeek();
        const count = countUniqueWorkoutDays(logs);
        setWorkoutCount(count);

        const today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

        if (today === 4 && count < 1) { // Thursday, no workouts yet
          console.log('Workout Reminder: You have not completed any workouts this week. Aim for at least 3!');
        }
        // If count >= 3, no action needed
      } catch (error) {
        console.error('Error in useNotifications:', error);
      }
    };

    initNotifications();
  }, [getWorkoutLogsThisWeek]);

  const refreshWorkoutCount = async () => {
    try {
      const logs = await getWorkoutLogsThisWeek();
      setWorkoutCount(countUniqueWorkoutDays(logs));
    } catch (error) {
      console.error('Error refreshing workout count:', error);
    }
  };

  return { workoutCount, refreshWorkoutCount };
};