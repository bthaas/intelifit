import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import { useNutritionStore, useUserStore } from '../../src/stores';
import { NutritionCalculator, DateUtils } from '../../src/utils/calculations';
import { MealType, ConsumedFood } from '../../src/types';

interface MacroProgressProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit: string;
}

const MacroProgress: React.FC<MacroProgressProps> = ({ 
  label, current, goal, color, unit 
}) => {
  const theme = useAppTheme();
  const progress = Math.min(current / goal, 1);
  
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
        <View 
          style={[
            styles.progressFill, 
            { backgroundColor: color, width: `${progress * 100}%` }
          ]} 
        />
      </View>
      <Text style={[styles.macroValue, { color: theme.text }]}>
        {Math.round(current)}{unit} / {Math.round(goal)}{unit}
      </Text>
    </View>
  );
};

interface MealSectionProps {
  mealType: MealType;
  foods: ConsumedFood[];
  calories: number;
  onAddFood: () => void;
}

const MealSection: React.FC<MealSectionProps> = ({ 
  mealType, foods, calories, onAddFood 
}) => {
  const theme = useAppTheme();
  
  const mealIcons = {
    breakfast: 'sun-o',
    lunch: 'clock-o',
    dinner: 'moon-o',
    snack: 'apple',
  };

  const mealLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snacks',
  };

  return (
    <View style={[styles.mealSection, { backgroundColor: theme.surface }]}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleContainer}>
          <FontAwesome 
            name={mealIcons[mealType]} 
            size={20} 
            color={theme.primary} 
          />
          <Text style={[styles.mealTitle, { color: theme.text }]}>
            {mealLabels[mealType]}
          </Text>
          <Text style={[styles.mealCalories, { color: theme.textSecondary }]}>
            {Math.round(calories)} cal
          </Text>
        </View>
        <Pressable 
          onPress={onAddFood}
          style={[styles.addButton, { borderColor: theme.primary }]}
        >
          <FontAwesome name="plus" size={16} color={theme.primary} />
        </Pressable>
      </View>
      
      {foods.length === 0 ? (
        <Pressable onPress={onAddFood} style={styles.emptyMeal}>
          <Text style={[styles.emptyMealText, { color: theme.textSecondary }]}>
            Tap to add food
          </Text>
        </Pressable>
      ) : (
        <View style={styles.foodList}>
          {foods.map((food) => (
            <View key={food.id} style={styles.foodItem}>
              <View style={styles.foodInfo}>
                <Text style={[styles.foodName, { color: theme.text }]}>
                  {food.foodItem.name}
                </Text>
                <Text style={[styles.foodDetails, { color: theme.textSecondary }]}>
                  {food.quantity} {food.servingSize.name} • {Math.round(food.nutritionConsumed.calories)} cal
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function TodayScreen() {
  const theme = useAppTheme();
  const { user } = useUserStore();
  const { 
    dailyEntries, 
    currentDate, 
    setCurrentDate, 
    loadDailyEntry,
    updateWaterIntake 
  } = useNutritionStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(0);

  const todayEntry = dailyEntries[currentDate];
  const totalNutrition = todayEntry?.totalNutrition || {
    calories: 0, protein: 0, carbs: 0, fat: 0,
    fiber: 0, sugar: 0, sodium: 0, cholesterol: 0,
  };

  const calorieGoal = user?.goals.calorieGoal || 2000;
  const macroGoals = user ? 
    NutritionCalculator.calculateMacroGoals(calorieGoal, user.goals.macroRatios) :
    { protein: 150, carbs: 250, fat: 67 };

  const caloriesRemaining = calorieGoal - totalNutrition.calories;

  // Group foods by meal type
  const mealData = {
    breakfast: { foods: [] as ConsumedFood[], calories: 0 },
    lunch: { foods: [] as ConsumedFood[], calories: 0 },
    dinner: { foods: [] as ConsumedFood[], calories: 0 },
    snack: { foods: [] as ConsumedFood[], calories: 0 },
  };

  todayEntry?.meals.forEach(meal => {
    mealData[meal.mealType].foods = meal.foodItems;
    mealData[meal.mealType].calories = meal.foodItems.reduce(
      (sum, food) => sum + food.nutritionConsumed.calories, 0
    );
  });

  useEffect(() => {
    loadDailyEntry(currentDate);
  }, [currentDate]);

  useEffect(() => {
    // Initialize water glasses from stored data
    if (todayEntry?.waterIntake) {
      setWaterGlasses(Math.round(todayEntry.waterIntake / 250)); // 250ml per glass
    }
  }, [todayEntry?.waterIntake]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDailyEntry(currentDate);
    setRefreshing(false);
  };

  const handleAddWater = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newGlasses = waterGlasses + 1;
    setWaterGlasses(newGlasses);
    await updateWaterIntake(newGlasses * 250);
  };

  const handleAddFood = (mealType: MealType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // This would navigate to food search with meal type
    console.log(`Add food to ${mealType}`);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>
            Welcome to Nutrition Tracker
          </Text>
          <Link href="/profile-setup" asChild>
            <Pressable style={[styles.setupButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.setupButtonText}>Set up your profile</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with date and calories */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={styles.dateContainer}>
          <Text style={[styles.date, { color: theme.text }]}>
            {DateUtils.formatDate(currentDate)}
          </Text>
          <Text style={[styles.dayOfWeek, { color: theme.textSecondary }]}>
            {new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long' })}
          </Text>
        </View>
        
        <View style={styles.calorieContainer}>
          <Text style={[styles.caloriesRemaining, { color: theme.text }]}>
            {Math.max(0, caloriesRemaining)}
          </Text>
          <Text style={[styles.caloriesLabel, { color: theme.textSecondary }]}>
            calories remaining
          </Text>
        </View>
      </View>

      {/* Calorie progress ring */}
      <View style={styles.progressRingContainer}>
        <View style={[styles.progressRing, { borderColor: theme.border }]}>
          <View style={styles.progressRingInner}>
            <Text style={[styles.progressRingCalories, { color: theme.text }]}>
              {Math.round(totalNutrition.calories)}
            </Text>
            <Text style={[styles.progressRingGoal, { color: theme.textSecondary }]}>
              of {calorieGoal}
            </Text>
          </View>
        </View>
      </View>

      {/* Macro breakdown */}
      <View style={[styles.macroContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Macronutrients
        </Text>
        <MacroProgress 
          label="Protein"
          current={totalNutrition.protein}
          goal={macroGoals.protein}
          color="#e74c3c"
          unit="g"
        />
        <MacroProgress 
          label="Carbs"
          current={totalNutrition.carbs}
          goal={macroGoals.carbs}
          color="#f39c12"
          unit="g"
        />
        <MacroProgress 
          label="Fat"
          current={totalNutrition.fat}
          goal={macroGoals.fat}
          color="#9b59b6"
          unit="g"
        />
      </View>

      {/* Water intake */}
      <View style={[styles.waterContainer, { backgroundColor: theme.surface }]}>
        <View style={styles.waterHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Water Intake
          </Text>
          <Text style={[styles.waterCount, { color: theme.textSecondary }]}>
            {waterGlasses} glasses ({waterGlasses * 250}ml)
          </Text>
        </View>
        <View style={styles.waterGlasses}>
          {Array.from({ length: 8 }, (_, i) => (
            <Pressable
              key={i}
              onPress={i === waterGlasses ? handleAddWater : undefined}
              style={styles.waterGlass}
            >
              <FontAwesome
                name="tint"
                size={24}
                color={i < waterGlasses ? theme.primary : theme.border}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Meals */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginHorizontal: 16 }]}>
        Meals
      </Text>
      
      <MealSection
        mealType="breakfast"
        foods={mealData.breakfast.foods}
        calories={mealData.breakfast.calories}
        onAddFood={() => handleAddFood('breakfast')}
      />
      
      <MealSection
        mealType="lunch"
        foods={mealData.lunch.foods}
        calories={mealData.lunch.calories}
        onAddFood={() => handleAddFood('lunch')}
      />
      
      <MealSection
        mealType="dinner"
        foods={mealData.dinner.foods}
        calories={mealData.dinner.calories}
        onAddFood={() => handleAddFood('dinner')}
      />
      
      <MealSection
        mealType="snack"
        foods={mealData.snack.foods}
        calories={mealData.snack.calories}
        onAddFood={() => handleAddFood('snack')}
      />

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  setupButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  dateContainer: {
    flex: 1,
  },
  date: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dayOfWeek: {
    fontSize: 14,
    marginTop: 2,
  },
  calorieContainer: {
    alignItems: 'flex-end',
  },
  caloriesRemaining: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  caloriesLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  progressRingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingInner: {
    alignItems: 'center',
  },
  progressRingCalories: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressRingGoal: {
    fontSize: 12,
    marginTop: 2,
  },
  macroContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  macroItem: {
    marginBottom: 12,
  },
  macroLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroValue: {
    fontSize: 12,
  },
  waterContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterCount: {
    fontSize: 14,
  },
  waterGlasses: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterGlass: {
    padding: 8,
  },
  mealSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  mealCalories: {
    fontSize: 14,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMeal: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyMealText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  foodList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
  },
  foodDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 20,
  },
});
