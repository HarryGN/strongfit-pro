import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import * as SQLite from 'expo-sqlite';

interface BodyWeight {
  id: number;
  date: string;
  weight: number;
}

interface WorkoutLog {
  id: number;
  date: string;
  exercise_name: string;
  weight: number;
  reps: number;
  sets: number;
}

interface NutritionLog {
  id: number;
  date: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DatabaseContextType {
  insertBodyWeight: (weight: number) => Promise<void>;
  getLastBodyWeight: () => Promise<number | null>;
  getBodyWeightsLastMonth: () => Promise<BodyWeight[]>;
  getBodyWeightsAll: () => Promise<BodyWeight[]>;
  insertWorkoutLog: (exercise: string, weight: number, reps: number, sets: number) => Promise<void>;
  getWorkoutLogsThisWeek: () => Promise<WorkoutLog[]>;
  getWorkoutLogsAll: () => Promise<WorkoutLog[]>;
  deleteWorkoutLog: (id: number) => Promise<void>;
  insertNutritionLog: (food_name: string, calories: number, protein: number, carbs: number, fat: number) => Promise<void>;
  getNutritionLogsToday: () => Promise<NutritionLog[]>;
  getNutritionLogsAll: () => Promise<NutritionLog[]>;
  deleteNutritionLog: (id: number) => Promise<void>;
  deleteBodyWeight: (id: number) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const database = await SQLite.openDatabaseAsync('fitness.db');
        setDb(database);
        
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS body_weights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            weight REAL
          );
          CREATE TABLE IF NOT EXISTS workout_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            exercise_name TEXT,
            weight REAL,
            reps INTEGER,
            sets INTEGER
          );
          CREATE TABLE IF NOT EXISTS nutrition_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            food_name TEXT,
            calories REAL,
            protein REAL,
            carbs REAL,
            fat REAL
          );
        `);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Error initializing database:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeDatabase();
  }, []);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  const insertBodyWeight = async (weight: number) => {
    if (!db) throw new Error('Database not initialized');
    try {
      await db.runAsync(
        'INSERT INTO body_weights (date, weight) VALUES (?, ?)',
        [new Date().toISOString(), weight]
      );
    } catch (error) {
      console.error('Error inserting body weight:', error);
      throw error;
    }
  };

  const getLastBodyWeight = async (): Promise<number | null> => {
    if (!db) throw new Error('Database not initialized');
    try {
      const result = await db.getFirstAsync<{ weight: number }>(
        'SELECT weight FROM body_weights ORDER BY date DESC LIMIT 1'
      );
      return result?.weight ?? null;
    } catch (error) {
      console.error('Error getting last body weight:', error);
      return null;
    }
  };

  const getBodyWeightsLastMonth = async (): Promise<BodyWeight[]> => {
    if (!db) throw new Error('Database not initialized');
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    try {
      const results = await db.getAllAsync<BodyWeight>(
        'SELECT * FROM body_weights WHERE date >= ? ORDER BY date ASC',
        [oneMonthAgo.toISOString()]
      );
      return results || [];
    } catch (error) {
      console.error('Error getting body weights last month:', error);
      return [];
    }
  };

  const getBodyWeightsAll = async (): Promise<BodyWeight[]> => {
    if (!db) throw new Error('Database not initialized');
    try {
      const results = await db.getAllAsync<BodyWeight>('SELECT * FROM body_weights ORDER BY date DESC');
      return results || [];
    } catch (error) {
      console.error('Error getting all body weights:', error);
      return [];
    }
  };

  const insertWorkoutLog = async (exercise: string, weight: number, reps: number, sets: number) => {
    if (!db) throw new Error('Database not initialized');
    try {
      await db.runAsync(
        'INSERT INTO workout_logs (date, exercise_name, weight, reps, sets) VALUES (?, ?, ?, ?, ?)',
        [new Date().toISOString(), exercise, weight, reps, sets]
      );
    } catch (error) {
      console.error('Error inserting workout log:', error);
      throw error;
    }
  };

  const getWorkoutLogsThisWeek = async (): Promise<WorkoutLog[]> => {
    if (!db) throw new Error('Database not initialized');
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    try {
      const results = await db.getAllAsync<WorkoutLog>(
        'SELECT * FROM workout_logs WHERE date >= ? ORDER BY date ASC',
        [startOfWeek.toISOString()]
      );
      return results || [];
    } catch (error) {
      console.error('Error getting workout logs this week:', error);
      return [];
    }
  };

  const getWorkoutLogsAll = async (): Promise<WorkoutLog[]> => {
    if (!db) throw new Error('Database not initialized');
    try {
      const results = await db.getAllAsync<WorkoutLog>('SELECT * FROM workout_logs ORDER BY date DESC');
      return results || [];
    } catch (error) {
      console.error('Error getting all workout logs:', error);
      return [];
    }
  };

  const insertNutritionLog = async (food_name: string, calories: number, protein: number, carbs: number, fat: number) => {
    if (!db) throw new Error('Database not initialized');
    try {
      await db.runAsync(
        'INSERT INTO nutrition_logs (date, food_name, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?)',
        [new Date().toISOString(), food_name, calories, protein, carbs, fat]
      );
    } catch (error) {
      console.error('Error inserting nutrition log:', error);
      throw error;
    }
  };

  const getNutritionLogsToday = async (): Promise<NutritionLog[]> => {
    if (!db) throw new Error('Database not initialized');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
      const results = await db.getAllAsync<NutritionLog>(
        'SELECT * FROM nutrition_logs WHERE date >= ? AND date < ? ORDER BY date ASC',
        [today.toISOString(), tomorrow.toISOString()]
      );
      return results || [];
    } catch (error) {
      console.error('Error getting nutrition logs today:', error);
      return [];
    }
  };

  const getNutritionLogsAll = async (): Promise<NutritionLog[]> => {
    if (!db) throw new Error('Database not initialized');
    try {
      const results = await db.getAllAsync<NutritionLog>('SELECT * FROM nutrition_logs ORDER BY date DESC');
      return results || [];
    } catch (error) {
      console.error('Error getting all nutrition logs:', error);
      return [];
    }
  };

  const deleteBodyWeight = async (id: number) => {
    if (!db) throw new Error('Database not initialized');
    try {
      await db.runAsync('DELETE FROM body_weights WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting body weight entry:', error);
      throw error;
    }
  };

  const deleteWorkoutLog = async (id: number) => {
    if (!db) throw new Error('Database not initialized');
    try {
      await db.runAsync('DELETE FROM workout_logs WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting workout log entry:', error);
      throw error;
    }
  };

  const deleteNutritionLog = async (id: number) => {
    if (!db) throw new Error('Database not initialized');
    try {
      await db.runAsync('DELETE FROM nutrition_logs WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting nutrition log entry:', error);
      throw error;
    }
  };


  const value: DatabaseContextType = {
    insertBodyWeight,
    getLastBodyWeight,
    getBodyWeightsLastMonth,
    getBodyWeightsAll,
    deleteBodyWeight,
    insertWorkoutLog,
    getWorkoutLogsThisWeek,
    getWorkoutLogsAll,
    deleteWorkoutLog,
    insertNutritionLog,
    getNutritionLogsToday,
    getNutritionLogsAll,
    deleteNutritionLog,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};