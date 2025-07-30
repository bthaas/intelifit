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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import { useNutritionStore } from '../../src/stores';
import { FoodItem, ConsumedFood, MealType } from '../../src/types';

export default function AddFoodScreen() {
  const theme = useAppTheme();
  const { addFoodEntry, addToFavorites, addToRecent } = useNutritionStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [isSearching, setIsSearching] = useState(false);

  const mealTypes: Array<{ value: MealType; label: string; icon: string }> = [
    { value: 'breakfast', label: 'Breakfast', icon: 'sun-o' },
    { value: 'lunch', label: 'Lunch', icon: 'clock-o' },
    { value: 'dinner', label: 'Dinner', icon: 'moon-o' },
    { value: 'snack', label: 'Snack', icon: 'apple' },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Simulate food search - in real app, this would call an API
      const mockResults: FoodItem[] = [
        {
          id: '1',
          name: 'Chicken Breast',
          brand: 'Organic Valley',
          category: 'protein',
          barcode: '123456789',
          imageUrl: undefined,
          isCustom: false,
          nutritionPer100g: {
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            fiber: 0,
            sugar: 0,
            sodium: 74,
            cholesterol: 85,
          },
          servingSizes: [
            { id: '1', name: '1 breast (174g)', weight: 174, unit: 'g' },
            { id: '2', name: '1 cup diced (140g)', weight: 140, unit: 'g' },
            { id: '3', name: '100g', weight: 100, unit: 'g' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Brown Rice',
          brand: 'Uncle Ben\'s',
          category: 'grain',
          barcode: '987654321',
          imageUrl: undefined,
          isCustom: false,
          nutritionPer100g: {
            calories: 111,
            protein: 2.6,
            carbs: 23,
            fat: 0.9,
            fiber: 1.8,
            sugar: 0.4,
            sodium: 5,
            cholesterol: 0,
          },
          servingSizes: [
            { id: '4', name: '1 cup cooked (195g)', weight: 195, unit: 'g' },
            { id: '5', name: '1/2 cup cooked (98g)', weight: 98, unit: 'g' },
            { id: '6', name: '100g', weight: 100, unit: 'g' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      // Filter results based on search query
      const filteredResults = mockResults.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // For now, just select the first result
      if (filteredResults.length > 0) {
        setSelectedFood(filteredResults[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search for food');
    } finally {
      setIsSearching(false);
    }
  };

  const handleScanBarcode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Barcode Scanner', 'Barcode scanning feature coming soon!');
  };

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
        servingSize: selectedFood.servingSizes[0], // Default to first serving size
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
      
      // Reset form
      setSelectedFood(null);
      setQuantity('100');
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add food');
    }
  };

  const handleAddToFavorites = () => {
    if (!selectedFood) return;
    
    addToFavorites(selectedFood);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', `${selectedFood.name} added to favorites!`);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome name="plus-circle" size={48} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>
            Add Food
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Search, scan, or manually add food to your daily log
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Search Food
          </Text>
          
          <View style={styles.searchContainer}>
            <View style={[styles.searchInput, { backgroundColor: theme.surface }]}>
              <FontAwesome name="search" size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Search for food..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
            </View>
            
            <Pressable
              style={[styles.searchButton, { backgroundColor: theme.primary }]}
              onPress={handleSearch}
              disabled={isSearching}
            >
              <FontAwesome 
                name={isSearching ? 'spinner' : 'search'} 
                size={16} 
                color="#ffffff" 
              />
            </Pressable>
          </View>

          <Pressable
            style={[styles.scanButton, { backgroundColor: theme.surface }]}
            onPress={handleScanBarcode}
          >
            <FontAwesome name="barcode" size={20} color={theme.primary} />
            <Text style={[styles.scanButtonText, { color: theme.text }]}>
              Scan Barcode
            </Text>
          </Pressable>
        </View>

        {/* Selected Food */}
        {selectedFood && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Selected Food
            </Text>
            
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
                onPress={handleAddToFavorites}
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
                    <FontAwesome 
                      name={meal.icon as any} 
                      size={16} 
                      color={selectedMeal === meal.value ? '#ffffff' : theme.textSecondary} 
                    />
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
            {['Water', 'Coffee', 'Apple', 'Banana'].map((item) => (
              <Pressable
                key={item}
                style={[styles.quickAddButton, { backgroundColor: theme.surface }]}
                onPress={() => {
                  setSearchQuery(item);
                  handleSearch();
                }}
              >
                <FontAwesome name="plus" size={16} color={theme.primary} />
                <Text style={[styles.quickAddText, { color: theme.text }]}>
                  {item}
                </Text>
              </Pressable>
            ))}
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
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
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