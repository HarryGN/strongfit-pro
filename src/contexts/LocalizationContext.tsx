import React, { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'en' | 'zh';

interface LocalizationContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const strings: Record<Lang, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    progress: 'Progress',
    coach: 'Smart Coach',
    nutrition: 'Nutrition',
    hi: 'Hey Harry, time to dominate this workout! 💪',
    lastWeight: 'Last Weight',
    saveWeight: 'Save Weight',
    logWorkout: 'Log Workout',
    exerciseName: 'Exercise name',
    weight: 'Weight (kg)',
    reps: 'Reps',
    sets: 'Sets',
    saveWorkout: 'Save Workout',
    logNutrition: 'Log Nutrition',
    enterNutritionManually: 'Enter Nutrition Manually',
    analyzePhoto: 'Analyze Photo (Requires Paid API)',
    saveToDatabase: 'Save to Database',
    enterText: 'Enter',
    progressByExercise: 'Progress by Exercise',
    selectExercise: 'Select exercise',
    chart: 'Chart',
    table: 'Table',
    timeScale: 'Time Scale',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    noData: 'No data yet',
    delete: 'Delete',
    nutritionTarget: 'Nutrition Target',
    height: 'Height',
    targetCalories: 'Target Calories',
    targetProtein: 'Target Protein',
    setTarget: 'Set Target',
    todayIntake: 'Today Intake',
    calorieProgress: 'Calorie progress',
    proteinProgress: 'Protein progress',
    language: 'Language',
    chinese: '中文',
    english: 'English',
  },
  zh: {
    dashboard: '仪表盘',
    progress: '进度',
    coach: '智能教练',
    nutrition: '营养',
    hi: '嗨，StrongFit Pro用户，今天继续开挂吧 💪',
    lastWeight: '上次体重',
    saveWeight: '保存体重',
    logWorkout: '记录训练',
    exerciseName: '动作名称',
    weight: '重量 (kg)',
    reps: '次数',
    sets: '组数',
    saveWorkout: '保存训练',
    logNutrition: '记录营养',
    enterNutritionManually: '手动输入营养',
    analyzePhoto: '图片分析（需付费API）',
    saveToDatabase: '保存到数据库',
    enterText: '输入',
    progressByExercise: '按动作进度',
    selectExercise: '选择动作',
    chart: '图表',
    table: '表格',
    timeScale: '时间尺度',
    weekly: '周',
    monthly: '月',
    yearly: '年',
    noData: '暂无数据',
    delete: '删除',
    nutritionTarget: '营养目标',
    height: '身高',
    targetCalories: '目标热量',
    targetProtein: '目标蛋白',
    setTarget: '设置目标',
    todayIntake: '今日摄入',
    calorieProgress: '热量进度',
    proteinProgress: '蛋白进度',
    language: '语言',
    chinese: '中文',
    english: '英文',
  },
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useLocalization must be used within LocalizationProvider');
  return context;
};

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('zh');

  const t = (key: string) => {
    return strings[lang][key] ?? strings['en'][key] ?? key;
  };

  return <LocalizationContext.Provider value={{ lang, setLang, t }}>{children}</LocalizationContext.Provider>;
};