import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import { useNutritionStore } from '../../src/stores';
import { FoodItem, ConsumedFood, MealType } from '../../src/types';
import { foodInputService } from '../../src/services/foodInput';

const INPUT_MODES = [
  { key: 'voice', label: 'Voice', icon: 'microphone' },
  { key: 'photo', label: 'Photo', icon: 'camera' },
  { key: 'text', label: 'Text', icon: 'keyboard-o' },
];

const PHOTO_OPTIONS = [
  { key: 'camera', label: 'Camera', icon: 'camera' },
  { key: 'gallery', label: 'Gallery', icon: 'image' },
  { key: 'barcode', label: 'Barcode', icon: 'barcode' },
];

export default function AddFoodScreen() {
  const theme = useAppTheme();
  const { addFoodEntry, addToRecent, recentFoods, favorites, addToFavorites } = useNutritionStore();

  const [inputMode, setInputMode] = useState<'voice' | 'photo' | 'text'>('voice');
  const [photoOption, setPhotoOption] = useState<'camera' | 'gallery' | 'barcode'>('camera');
  const [voiceTranscribing, setVoiceTranscribing] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const mealTypes: Array<{
    value: MealType;
    label: string;
    icon: {
      pack: 'FontAwesome' | 'MaterialCommunityIcons' | 'Feather' | 'FontAwesome5';
      name: string;
    }
  }> = [
    { value: 'breakfast', label: 'Breakfast', icon: { pack: 'Feather', name: 'sun' } },
    { value: 'lunch', label: 'Lunch', icon: { pack: 'FontAwesome5', name: 'cloud-sun' } },
    { value: 'dinner', label: 'Dinner', icon: { pack: 'FontAwesome', name: 'moon-o' } },
    { value: 'snack', label: 'Snack', icon: { pack: 'MaterialCommunityIcons', name: 'fruit-cherries' } },
  ];

  // --- Input Handlers ---
  const handleVoiceInput = async () => {
    setError(null);
    setVoiceTranscribing(true);
    setVoiceText('');
    try {
      await foodInputService.startVoiceRecording();
      // Show UI for recording, then stop after user action
    } catch (e) {
      setError('Could not start recording');
      setVoiceTranscribing(false);
    }
  };
  const handleStopVoiceInput = async () => {
    setError(null);
    setVoiceTranscribing(false);
    setIsLoading(true);
    try {
      const result = await foodInputService.stopVoiceRecording();
      if (result.success && result.text) {
        setVoiceText(result.text);
        await handleProcessInput('voice', result.text);
      } else {
        setError(result.error || 'Voice transcription failed');
      }
    } catch (e) {
      setError('Voice transcription failed');
    }
    setIsLoading(false);
  };
  const handlePhotoInput = async () => {
    setError(null);
    setIsLoading(true);
    try {
      let result;
      if (photoOption === 'camera') {
        result = await foodInputService.captureFromCamera();
      } else if (photoOption === 'gallery') {
        result = await foodInputService.pickFromGallery();
      } else if (photoOption === 'barcode') {
        result = await foodInputService.scanBarcode();
      }
      if (result && result.success && result.foodItem) {
        setSelectedFood(result.foodItem);
      } else {
        setError(result?.error || 'Photo input failed');
      }
    } catch (e) {
      setError('Photo input failed');
    }
    setIsLoading(false);
  };
  const handleTextInput = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await foodInputService.processTextInput(textInput);
      if (result.success && result.foodItem) {
        setSelectedFood(result.foodItem);
      } else {
        setError(result.error || 'Text input failed');
      }
    } catch (e) {
      setError('Text input failed');
    }
    setIsLoading(false);
  };
  const handleProcessInput = async (mode: string, content: string) => {
    setError(null);
    setIsLoading(true);
    try {
      let result;
      if (mode === 'voice') {
        result = await foodInputService.processTextInput(content);
      } else if (mode === 'text') {
        result = await foodInputService.processTextInput(content);
      }
      if (result && result.success && result.foodItem) {
        setSelectedFood(result.foodItem);
      } else {
        setError(result?.error || 'Input failed');
      }
    } catch (e) {
      setError('Input failed');
    }
    setIsLoading(false);
  };

  // --- Add Food Logic ---
  const handleAddFood = async () => {
    if (!selectedFood || !quantity) {
      Alert.alert('Error', 'Please select a food and enter quantity');
      return;
    }
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    try {
      const consumedFood: ConsumedFood = {
        id: `consumed-${Date.now()}`,
        foodItem: selectedFood,
        quantity: quantityNum,
        servingSize: selectedFood.servingSizes[0],
        nutritionConsumed: {
          calories: Math.round((selectedFood.nutritionPer100g.calories * quantityNum) / 100),
          protein: Math.round((selectedFood.nutritionPer100g.protein * quantityNum) / 100),
          carbs: Math.round((selectedFood.nutritionPer100g.carbs * quantityNum) / 100),
          fat: Math.round((selectedFood.nutritionPer100g.fat * quantityNum) / 100),
          fiber: Math.round((selectedFood.nutritionPer100g.fiber * quantityNum) / 100),
          sugar: Math.round((selectedFood.nutritionPer100g.sugar * quantityNum) / 100),
          sodium: Math.round((selectedFood.nutritionPer100g.sodium * quantityNum) / 100),
          cholesterol: Math.round((selectedFood.nutritionPer100g.cholesterol * quantityNum) / 100),
        },
      };
      await addFoodEntry(selectedMeal, consumedFood);
      addToRecent(selectedFood);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert('Success', `${selectedFood.name} added to ${selectedMeal}!`);
      setSelectedFood(null);
      setQuantity('100');
      setVoiceText('');
      setTextInput('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add food');
    }
  };

  // --- UI ---
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome name="plus-circle" size={48} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>Add Food</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Snap, speak, scan, or type to add food</Text>
        </View>

        {/* Input Mode Switcher */}
        <View style={styles.inputModeRow}>
          {INPUT_MODES.map((mode) => (
            <Pressable
              key={mode.key}
              style={[
                styles.inputModeButton,
                { backgroundColor: theme.surface },
                inputMode === mode.key && { backgroundColor: theme.primary }
              ]}
              onPress={() => setInputMode(mode.key as any)}
            >
              <FontAwesome 
                name={mode.icon as any} 
                size={20} 
                color={inputMode === mode.key ? '#fff' : theme.textSecondary} 
              />
              <Text style={[
                styles.inputModeText,
                { color: inputMode === mode.key ? '#fff' : theme.textSecondary }
              ]}>
                {mode.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Input UI */}
        {inputMode === 'voice' && (
          <View style={[styles.inputSection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Voice Input</Text>
            {voiceTranscribing ? (
              <Pressable style={[styles.voiceButton, { backgroundColor: theme.error }]} onPress={handleStopVoiceInput}>
                <FontAwesome name="stop" size={32} color="#fff" />
                <Text style={styles.voiceButtonText}>Stop Recording</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.voiceButton, { backgroundColor: theme.primary }]} onPress={handleVoiceInput}>
                <FontAwesome name="microphone" size={32} color="#fff" />
                <Text style={styles.voiceButtonText}>Start Recording</Text>
              </Pressable>
            )}
            {voiceText ? (
              <Text style={[styles.voiceText, { color: theme.textSecondary }]}>{voiceText}</Text>
            ) : null}
          </View>
        )}
        {inputMode === 'photo' && (
          <View style={[styles.inputSection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Photo Input</Text>
            
            {/* Photo Options */}
            <View style={styles.photoOptionsRow}>
              {PHOTO_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  style={[
                    styles.photoOptionButton,
                    { backgroundColor: theme.background },
                    photoOption === option.key && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setPhotoOption(option.key as any)}
                >
                  <FontAwesome 
                    name={option.icon as any} 
                    size={20} 
                    color={photoOption === option.key ? '#fff' : theme.textSecondary} 
                  />
                  <Text style={[
                    styles.photoOptionText,
                    { color: photoOption === option.key ? '#fff' : theme.textSecondary }
                  ]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Photo Action Button */}
            <Pressable style={[styles.photoButton, { backgroundColor: theme.primary }]} onPress={handlePhotoInput}>
              <FontAwesome name={photoOption === 'camera' ? 'camera' : photoOption === 'gallery' ? 'image' : 'barcode'} size={24} color="#fff" />
              <Text style={styles.photoButtonText}>
                {photoOption === 'camera' ? 'Take Photo' : photoOption === 'gallery' ? 'Pick Image' : 'Scan Barcode'}
              </Text>
            </Pressable>
          </View>
        )}
        {inputMode === 'text' && (
          <View style={[styles.inputSection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Text Input</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.background }]}
              placeholder="e.g. 2 eggs and toast"
              placeholderTextColor={theme.textSecondary}
              value={textInput}
              onChangeText={setTextInput}
              onSubmitEditing={handleTextInput}
              returnKeyType="done"
            />
            <Pressable style={[styles.textButton, { backgroundColor: theme.primary }]} onPress={handleTextInput}>
              <FontAwesome name="send" size={20} color="#fff" />
              <Text style={styles.textButtonText}>Submit</Text>
            </Pressable>
          </View>
        )}

        {/* Loading/Error */}
        {isLoading && <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 16 }} />}
        {error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}

        {/* Selected Food */}
        {selectedFood && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Selected Food</Text>
            
            <View style={[styles.foodCard, { backgroundColor: theme.surface }]}>
              <View style={styles.foodInfo}>
                <Text style={[styles.foodName, { color: theme.text }]}>
                  {selectedFood.name}
                </Text>
                {selectedFood.brand && (
                  <Text style={[styles.foodBrand, { color: theme.textSecondary }]}>
                    {selectedFood.brand}
                  </Text>
                )}
                <Text style={[styles.foodNutrition, { color: theme.textSecondary }]}>
                  {selectedFood.nutritionPer100g.calories} cal per 100g
                </Text>
              </View>
              
              <Pressable
                style={[styles.favoriteButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  addToFavorites(selectedFood);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert('Favorited!', `${selectedFood.name} has been added to your favorites.`);
                }}
              >
                <FontAwesome name="heart" size={16} color="#ffffff" />
              </Pressable>
            </View>

            {/* Quantity Input */}
            <View style={styles.quantityContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Quantity (g)</Text>
              <TextInput
                style={[styles.quantityInput, { backgroundColor: theme.surface, color: theme.text }]}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Meal Selection */}
            <View style={styles.mealContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Meal</Text>
              <View style={styles.mealButtons}>
                {mealTypes.map((meal) => (
                                    <Pressable
                    key={meal.value}
                    style={[
                      styles.mealButton,
                      { backgroundColor: theme.surface },
                      selectedMeal === meal.value && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setSelectedMeal(meal.value)}
                  >
                    {(() => {
                      const iconInfo = meal.icon;
                      const color = selectedMeal === meal.value ? '#ffffff' : theme.textSecondary;
                      switch (iconInfo.pack) {
                        case 'FontAwesome':
                          return <FontAwesome name={iconInfo.name as any} size={16} color={color} />;
                        case 'MaterialCommunityIcons':
                          return <MaterialCommunityIcons name={iconInfo.name as any} size={16} color={color} />;
                        case 'Feather':
                          return <Feather name={iconInfo.name as any} size={16} color={color} />;
                        case 'FontAwesome5':
                          return <FontAwesome5 name={iconInfo.name as any} size={16} color={color} />;
                        default:
                          return null;
                      }
                    })()}
                    <Text style={[
                      styles.mealButtonText,
                      { color: selectedMeal === meal.value ? '#ffffff' : theme.text }
                    ]}>
                      {meal.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Add Button */}
            <Pressable
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={handleAddFood}
            >
              <FontAwesome name="plus" size={20} color="#ffffff" />
              <Text style={styles.addButtonText}>
                Add to {selectedMeal}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Quick Add Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Add
          </Text>
          
                    <View style={styles.quickAddGrid}>
            {recentFoods.length > 0 ? (
              recentFoods.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.quickAddButton, { backgroundColor: theme.surface }]}
                  onPress={() => setSelectedFood(item)}
                >
                  <FontAwesome name="plus" size={16} color={theme.primary} />
                  <Text style={[styles.quickAddText, { color: theme.text }]}>
                    {item.name}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={{ color: theme.textSecondary }}>No recent foods to show. Add some food to see them here!</Text>
            )}
                    </View>
        </View>

        {/* Favorites Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Favorites
          </Text>
          <View style={styles.quickAddGrid}>
            {favorites.length > 0 ? (
              favorites.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.quickAddButton, { backgroundColor: theme.surface }]}
                  onPress={() => setSelectedFood(item)}
                >
                  <FontAwesome name="heart" size={16} color={theme.primary} />
                  <Text style={[styles.quickAddText, { color: theme.text }]}>
                    {item.name}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={{ color: theme.textSecondary }}>You have no favorite foods yet. Tap the heart icon on a selected food to add it.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  inputModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputModeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  voiceText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  photoOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  photoOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  photoOptionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  textButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  foodBrand: {
    fontSize: 14,
    marginBottom: 4,
  },
  foodNutrition: {
    fontSize: 12,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  quantityInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  mealContainer: {
    marginBottom: 20,
  },
  mealButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  mealButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 