import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useDatabase } from '../contexts/DatabaseContext';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const NutritionInput: React.FC = () => {
  const { insertNutritionLog } = useDatabase();
  const [image, setImage] = useState<string | null>(null);
  const [nutrition, setNutrition] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  
  // Manual entry fields
  const [manualFood, setManualFood] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  const getMimeType = (uri: string): string => {
    if (uri.toLowerCase().endsWith('.png')) return 'image/png';
    if (uri.toLowerCase().endsWith('.gif')) return 'image/gif';
    if (uri.toLowerCase().endsWith('.webp')) return 'image/webp';
    if (uri.toLowerCase().endsWith('.heic')) return 'image/heic';
    if (uri.toLowerCase().endsWith('.heif')) return 'image/heif';
    return 'image/jpeg'; // default
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permissions are required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log('Image picked:', {
        uri: asset.uri,
        hasBase64: !!asset.base64,
        base64Length: asset.base64?.length,
      });
      
      setImage(asset.uri);
      setError(null);
      
      if (asset.base64) {
        analyzeImage(asset.base64, getMimeType(asset.uri));
      } else {
        setError('Failed to get image data');
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permissions are required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage(asset.uri);
      setError(null);
      
      if (asset.base64) {
        analyzeImage(asset.base64, getMimeType(asset.uri));
      } else {
        setError('Failed to get image data');
      }
    }
  };

  const analyzeImage = async (base64: string, mimeType: string) => {
    try {
      if (!genAI) {
        setError('Missing API key. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file and restart Expo.');
        return;
      }
      setLoading(true);
      setError(null);
      console.log('Starting image analysis...', { mimeType, base64Length: base64.length });
      
      // Use gemini-2.5-flash only for image/multimodal processing
      const modelNames = ['gemini-2.5-flash'];
      let model;
      let lastError;
      
      for (const modelName of modelNames) {
        try {
          console.log(`Trying model: ${modelName}`);
          model = genAI.getGenerativeModel({ model: modelName });
          
          // Test if model is available by making a small request
          const prompt = `You are a nutrition expert. Analyze this food image and provide nutrition estimates in JSON format:
{
  "food_name": "name of the food",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0
}
Only output the JSON with estimated numbers.`;
          
          const imagePart = {
            inlineData: {
              data: base64,
              mimeType: mimeType,
            },
          };
          
          console.log(`Sending to ${modelName}...`);
          const result = await model.generateContent([prompt, imagePart]);
          
          if (!result.response) {
            throw new Error('No API response');
          }
          
          const text = result.response.text();
          console.log('Raw API response:', text);
          
          // Extract JSON
          let jsonText = text.trim();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          }
          
          console.log('Extracted JSON:', jsonText);
          const parsed = JSON.parse(jsonText);
          
          if (!parsed.food_name) {
            throw new Error('Response missing food_name');
          }
          
          parsed.calories = parsed.calories || 0;
          parsed.protein = parsed.protein || 0;
          parsed.carbs = parsed.carbs || 0;
          parsed.fat = parsed.fat || 0;
          
          console.log(`✅ Success with ${modelName}:`, parsed);
          setNutrition(parsed);
          return; // Success!
        } catch (err: any) {
          lastError = err;
          console.warn(`❌ ${modelName} failed:`, err?.message);
          continue; // Try next model
        }
      }
      
      // All models failed
      throw lastError || new Error('All models failed');
    } catch (error: any) {
      console.error('Full error object:', error);
      
      let errorMessage = 'Unknown error';
      
      if (error?.message?.includes('not found')) {
        errorMessage = 'Model not available. Please verify your API key can access gemini-2.5-flash.';
      } else if (error?.message?.includes('quota')) {
        errorMessage = 'API quota exceeded. Please check your Gemini API plan.';
      } else if (error?.message?.includes('401') || error?.message?.includes('403')) {
        errorMessage = 'API key invalid or no access. Verify your Gemini API key.';
      } else if (error?.message?.includes('400')) {
        errorMessage = 'Invalid request. Try a different image.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      console.error('Analysis error:', errorMessage);
      setError(errorMessage);
      Alert.alert('Analysis Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveNutrition = async () => {
    if (!nutrition) {
      Alert.alert('Error', 'No nutrition data to save');
      return;
    }
    
    try {
      const calories = nutrition.calories || 0;
      const protein = nutrition.protein || 0;
      const carbs = nutrition.carbs || 0;
      const fat = nutrition.fat || 0;
      
      await insertNutritionLog(nutrition.food_name, calories, protein, carbs, fat);
      Alert.alert('Success', 'Nutrition logged successfully');
      setImage(null);
      setNutrition(null);
      setError(null);
      setManualMode(false);
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', `Failed to save: ${error?.message}`);
    }
  };

  const saveManualNutrition = async () => {
    if (!manualFood) {
      Alert.alert('Error', 'Please enter food name');
      return;
    }
    
    try {
      const calories = parseFloat(manualCalories) || 0;
      const protein = parseFloat(manualProtein) || 0;
      const carbs = parseFloat(manualCarbs) || 0;
      const fat = parseFloat(manualFat) || 0;
      
      await insertNutritionLog(manualFood, calories, protein, carbs, fat);
      Alert.alert('Success', 'Nutrition logged successfully');
      
      // Reset manual entry
      setManualFood('');
      setManualCalories('');
      setManualProtein('');
      setManualCarbs('');
      setManualFat('');
      setManualMode(false);
      setImage(null);
      setError(null);
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', `Failed to save: ${error?.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>� Log Nutrition</Text>
      
      {/* Manual Entry (Primary) */}
      {!manualMode ? (
        <View>
          <Button 
            title="Enter Nutrition Manually" 
            onPress={() => setManualMode(true)} 
            color="#4CAF50"
          />
          <Text style={styles.orText}>OR</Text>
          <Button title="Take Photo" onPress={takePhoto} color="#FF5722" />
          <Text style={styles.orText}>OR</Text>
          <Button title="Analyze Photo (Requires Paid API)" onPress={pickImage} color="#2196F3" />
        </View>
      ) : null}
      
      {error && (
        <View>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.note}>💡 Tip: Vision models require a paid Gemini API plan.</Text>
        </View>
      )}
      {loading && <Text style={styles.loading}>🔄 Analyzing image...</Text>}
      
      {image && (
        <View>
          <Image source={{ uri: image }} style={styles.image} />
          <Text style={styles.imageLabel}>Selected image</Text>
        </View>
      )}
      
      {nutrition && !manualMode && (
        <View style={styles.nutritionBox}>
          <Text style={styles.resultTitle}>✅ Nutrition Information</Text>
          <Text style={styles.resultText}>Food: {nutrition.food_name}</Text>
          <Text style={styles.resultText}>Calories: {nutrition.calories}</Text>
          <Text style={styles.resultText}>Protein: {nutrition.protein}g</Text>
          <Text style={styles.resultText}>Carbs: {nutrition.carbs}g</Text>
          <Text style={styles.resultText}>Fat: {nutrition.fat}g</Text>
          <Button title="Save to Database" onPress={saveNutrition} color="#4CAF50" />
          <Button 
            title="Edit" 
            onPress={() => {
              setManualFood(nutrition.food_name || '');
              setManualCalories((nutrition.calories || '').toString());
              setManualProtein((nutrition.protein || '').toString());
              setManualCarbs((nutrition.carbs || '').toString());
              setManualFat((nutrition.fat || '').toString());
              setManualMode(true);
              setNutrition(null);
            }}
            color="#FF9800"
          />
        </View>
      )}
      
      {manualMode && (
        <View style={styles.manualBox}>
          <Text style={styles.resultTitle}>📝 Enter Nutrition Information</Text>
          
          <Text style={styles.label}>Food Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Chicken breast with rice"
            value={manualFood}
            onChangeText={setManualFood}
          />
          
          <Text style={styles.label}>Calories</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 350"
            value={manualCalories}
            onChangeText={setManualCalories}
            keyboardType="decimal-pad"
          />
          
          <Text style={styles.label}>Protein (g)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 35"
            value={manualProtein}
            onChangeText={setManualProtein}
            keyboardType="decimal-pad"
          />
          
          <Text style={styles.label}>Carbs (g)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 45"
            value={manualCarbs}
            onChangeText={setManualCarbs}
            keyboardType="decimal-pad"
          />
          
          <Text style={styles.label}>Fat (g)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 8"
            value={manualFat}
            onChangeText={setManualFat}
            keyboardType="decimal-pad"
          />
          
          <Button title="Save" onPress={saveManualNutrition} color="#4CAF50" />
          <Button title="Cancel" onPress={() => {
            setManualMode(false);
            setManualFood('');
            setManualCalories('');
            setManualProtein('');
            setManualCarbs('');
            setManualFat('');
          }} color="#999" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#d9e3ff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1d3d72' },
  orText: { fontSize: 14, textAlign: 'center', marginVertical: 10, color: '#666' },
  resultTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#2e7d32' },
  resultText: { fontSize: 14, marginVertical: 4 },
  image: { width: '100%', height: 200, marginVertical: 10, borderRadius: 8 },
  imageLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  nutritionBox: { marginTop: 15, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 },
  manualBox: { marginTop: 15, padding: 12, backgroundColor: '#fff3e0', borderRadius: 8 },
  loading: { fontSize: 14, color: '#1976d2', marginVertical: 10, fontWeight: 'bold' },
  error: { fontSize: 14, color: '#d32f2f', marginVertical: 10, backgroundColor: '#ffebee', padding: 10, borderRadius: 4, marginBottom: 5 },
  note: { fontSize: 13, color: '#d32f2f', marginBottom: 10, backgroundColor: '#ffebee', padding: 8, borderRadius: 4 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 5, color: '#333' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 4,
    backgroundColor: '#fff',
    fontSize: 14
  },
});

export default NutritionInput;