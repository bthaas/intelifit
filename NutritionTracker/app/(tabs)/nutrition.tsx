import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Dimensions,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MaterialCommunityIcons, Feather, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import { useNutritionStore, useUserStore } from '../../src/stores';
import { NutritionCalculator, DateUtils } from '../../src/utils/calculations';
import { MealType, ConsumedFood } from '../../src/types';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: '#ffffff',
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

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
  onDeleteFood: (foodId: string, mealType: MealType) => void;
}

const MealSection: React.FC<MealSectionProps> = ({ 
  mealType, foods, calories, onAddFood, onDeleteFood 
}) => {
  const theme = useAppTheme();
  
  const mealIcons: Record<MealType, { pack: 'FontAwesome' | 'MaterialCommunityIcons' | 'Feather' | 'FontAwesome5'; name: string }> = {
    breakfast: { pack: 'Feather', name: 'sun' },
    lunch: { pack: 'FontAwesome5', name: 'cloud-sun' },
    dinner: { pack: 'FontAwesome', name: 'moon-o' },
    snack: { pack: 'MaterialCommunityIcons', name: 'fruit-cherries' },
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
          {(() => {
            const iconInfo = mealIcons[mealType];
            switch (iconInfo.pack) {
              case 'FontAwesome':
                return <FontAwesome name={iconInfo.name as any} size={20} color={theme.primary} />;
              case 'MaterialCommunityIcons':
                return <MaterialCommunityIcons name={iconInfo.name as any} size={20} color={theme.primary} />;
              case 'Feather':
                return <Feather name={iconInfo.name as any} size={20} color={theme.primary} />;
              case 'FontAwesome5':
                return <FontAwesome5 name={iconInfo.name as any} size={20} color={theme.primary} />;
              default:
                return null;
            }
          })()}
          <Text style={[styles.mealTitle, { color: theme.text }]}>
            {mealLabels[mealType]}
          </Text>
          <Text style={[styles.mealCalories, { color: theme.textSecondary }]}>
            {Math.round(calories)} cal
          </Text>
        </View>
      </View>
      
      {foods.length === 0 ? (
        <Pressable onPress={onAddFood} style={styles.emptyMeal} />
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
              <Pressable onPress={() => onDeleteFood(food.id, mealType)} style={styles.deleteButton}>
                <FontAwesome name="trash" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

import Svg, { Circle } from 'react-native-svg';

const ProgressCircle = ({ progress, size, strokeWidth, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        stroke={color}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

interface NutrientCardProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  icon: {
    pack: 'FontAwesome' | 'MaterialCommunityIcons' | 'Feather' | 'FontAwesome5' | 'FontAwesome6';
    name: string;
  };
  color: string;
}

const NutrientCard: React.FC<NutrientCardProps> = ({
  label, current, goal, unit, icon, color
}) => {
  const theme = useAppTheme();
  const percentage = goal > 0 ? Math.round((current / goal) * 100) : 0;
  const isOver = current > goal;

  return (
    <View style={[styles.nutrientCard, { backgroundColor: theme.surface }]}>
      <View style={styles.nutrientHeader}>
        {(() => {
          switch (icon.pack) {
            case 'FontAwesome':
              return <FontAwesome name={icon.name as any} size={20} color={color} />;
            case 'MaterialCommunityIcons':
              return <MaterialCommunityIcons name={icon.name as any} size={20} color={color} />;
            case 'Feather':
              return <Feather name={icon.name as any} size={20} color={color} />;
            case 'FontAwesome5':
              return <FontAwesome5 name={icon.name as any} size={20} color={color} />;
            case 'FontAwesome6':
              return <FontAwesome6 name={icon.name as any} size={20} color={color} />;
            default:
              return null;
          }
        })()}
        <Text style={[styles.nutrientLabel, { color: theme.text }]}>
          {label}
        </Text>
      </View>
      
      <View style={styles.nutrientValues}>
        <Text style={[styles.nutrientCurrent, { color: theme.text }]}>
          {Math.round(current * 10) / 10}{unit}
        </Text>
        <Text style={[styles.nutrientGoal, { color: theme.textSecondary }]}>
          / {Math.round(goal)}{unit}
        </Text>
      </View>
      
      <View style={styles.nutrientProgressContainer}>
        <View style={[styles.nutrientProgressBar, { backgroundColor: theme.border }]}>
          <View 
            style={[
              styles.nutrientProgressFill,
              { 
                backgroundColor: isOver ? theme.warning : color,
                width: `${Math.min(percentage, 100)}%`
              }
            ]} 
          />
        </View>
        <Text style={[
          styles.nutrientPercentage, 
          { color: isOver ? theme.warning : theme.textSecondary }
        ]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
};

interface WeeklyViewProps {
  weekData: { date: string; calories: number }[];
}

const WeeklyView: React.FC<WeeklyViewProps> = ({ weekData }) => {
  const theme = useAppTheme();

  const chartData = {
    labels: weekData.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [{
      data: weekData.map(d => d.calories),
      color: (opacity = 1) => theme.primary,
      strokeWidth: 2,
    }],
  };

  return (
    <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
      <Text style={[styles.chartTitle, { color: theme.text }]}>
        Weekly Calories
      </Text>
      <BarChart
        data={chartData}
        width={screenWidth - 64}
        height={200}
        chartConfig={{
          ...chartConfig,
          backgroundGradientFrom: theme.surface,
          backgroundGradientTo: theme.surface,
          color: (opacity = 1) => theme.primary,
        }}
        style={styles.chart}
        showValuesOnTopOfBars
        withInnerLines={false}
        yAxisLabel=""
        yAxisSuffix=""
      />
    </View>
  );
};

export default function NutritionScreen() {
  const theme = useAppTheme();
  const { user } = useUserStore();
  const { 
    dailyEntries, 
    currentDate, 
    setCurrentDate, 
    loadDailyEntry,
    updateWaterIntake,
    deleteFoodEntry,
  } = useNutritionStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const todayEntry = dailyEntries[currentDate];
  const totalNutrition = todayEntry?.totalNutrition || {
    calories: 0, protein: 0, carbs: 0, fat: 0,
    fiber: 0, sugar: 0, sodium: 0, cholesterol: 0,
  };

  const calorieGoal = user?.goals.calorieGoal || 2000;
  const macroGoals = user ? 
    NutritionCalculator.calculateMacroGoals(calorieGoal, user.goals.macroRatios) :
    { protein: 150, carbs: 250, fat: 67, fiber: 28, sugar: 50, sodium: 2300, cholesterol: 300 };

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

  // Generate week data for chart
  const weekData = DateUtils.getWeekDates().map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = dailyEntries[dateStr];
    return {
      date: dateStr,
      calories: entry?.totalNutrition.calories || 0,
    };
  });

  // Macro distribution for pie chart
  const macroDistribution = [
    {
      name: 'Protein',
      population: totalNutrition.protein * 4, // 4 calories per gram
      color: '#e74c3c',
      legendFontColor: theme.text,
      legendFontSize: 12,
    },
    {
      name: 'Carbs',
      population: totalNutrition.carbs * 4, // 4 calories per gram
      color: '#f39c12',
      legendFontColor: theme.text,
      legendFontSize: 12,
    },
    {
      name: 'Fat',
      population: totalNutrition.fat * 9, // 9 calories per gram
      color: '#9b59b6',
      legendFontColor: theme.text,
      legendFontSize: 12,
    },
  ];

  const totalMacroCalories = macroDistribution.reduce((sum, macro) => sum + macro.population, 0);

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

  const handleUpdateWater = async (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newWaterIntake = Math.max(0, (todayEntry?.waterIntake || 0) + amount);
    await updateWaterIntake(newWaterIntake);
  };

  const handleDeleteFood = (foodId: string, mealType: MealType) => {
    Alert.alert(
      "Delete Food Item",
      "Are you sure you want to delete this item from your meal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteFoodEntry(foodId, mealType);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
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
          <Pressable style={[styles.setupButton, { backgroundColor: theme.primary }]}>
            <Text style={styles.setupButtonText}>Set up your profile</Text>
          </Pressable>
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
      {/* Period selector */}
      <View style={[styles.periodSelector, { backgroundColor: theme.surface }]}>
        {(['today', 'week', 'month'] as const).map((period) => (
          <Pressable
            key={period}
            onPress={() => setSelectedPeriod(period)}
            style={[
              styles.periodButton,
              selectedPeriod === period && { backgroundColor: theme.primary }
            ]}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === period ? '#ffffff' : theme.text }
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {selectedPeriod === 'today' && (
        <>
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
            <View style={[styles.progressRing, { borderColor: theme.border, justifyContent: 'center', alignItems: 'center' }]}>
              <Svg width={120} height={120} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
                <Circle
                  stroke={theme.border}
                  fill="none"
                  cx={60}
                  cy={60}
                  r={56}
                  strokeWidth={8}
                />
              </Svg>
              <ProgressCircle
                progress={totalNutrition.calories / calorieGoal}
                size={120}
                strokeWidth={8}
                color={theme.primary}
              />
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
                {Math.round((todayEntry?.waterIntake || 0) / 250)} glasses ({todayEntry?.waterIntake || 0}ml)
              </Text>
            </View>
            <View style={styles.waterControls}>
              <Pressable 
                onPress={() => handleUpdateWater(-250)}
                style={[styles.waterButton, { backgroundColor: theme.border }]}
              >
                <FontAwesome name="minus" size={20} color={theme.text} />
              </Pressable>
              
              <View style={styles.waterGlasses}>
                {Array.from({ length: 8 }, (_, i) => (
                  <View key={i} style={styles.waterGlass}>
                    <FontAwesome
                      name="tint"
                      size={24}
                      color={i < Math.round((todayEntry?.waterIntake || 0) / 250) ? theme.primary : theme.border}
                    />
                  </View>
                ))}
              </View>

              <Pressable 
                onPress={() => handleUpdateWater(250)}
                style={[styles.waterButton, { backgroundColor: theme.primary }]}
              >
                <FontAwesome name="plus" size={20} color="#ffffff" />
              </Pressable>
            </View>
          </View>

          {/* Macro distribution pie chart */}
          {totalMacroCalories > 0 && (
            <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>
                Macro Distribution
              </Text>
              <PieChart
                data={macroDistribution}
                width={screenWidth - 32}
                height={200}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => theme.primary,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 10]}
                absolute
              />
            </View>
          )}

          {/* Detailed nutrients */}
          <Text style={[styles.sectionTitle, { color: theme.text, marginHorizontal: 16 }]}>
            Detailed Nutrition
          </Text>

          <View style={styles.nutrientsGrid}>
            <NutrientCard
              label="Protein"
              current={totalNutrition.protein}
              goal={macroGoals.protein}
              unit="g"
              icon={{ pack: 'MaterialCommunityIcons', name: 'food-steak' }}
              color="#e74c3c"
            />
            
            <NutrientCard
              label="Carbs"
              current={totalNutrition.carbs}
              goal={macroGoals.carbs}
              unit="g"
              icon={{ pack: 'MaterialCommunityIcons', name: 'bread-slice' }}
              color="#f39c12"
            />
            
            <NutrientCard
              label="Fat"
              current={totalNutrition.fat}
              goal={macroGoals.fat}
              unit="g"
              icon={{ pack: 'FontAwesome5', name: 'ice-cream' }}
              color="#9b59b6"
            />
            
            <NutrientCard
              label="Fiber"
              current={totalNutrition.fiber}
              goal={macroGoals.fiber}
              unit="g"
              icon={{ pack: 'MaterialCommunityIcons', name: 'seed' }}
              color="#27ae60"
            />
            
            <NutrientCard
              label="Sugar"
              current={totalNutrition.sugar}
              goal={macroGoals.sugar}
              unit="g"
              icon={{ pack: 'FontAwesome6', name: 'cubes-stacked' }}
              color="#f1c40f"
            />
            
            <NutrientCard
              label="Sodium"
              current={totalNutrition.sodium}
              goal={macroGoals.sodium}
              unit="mg"
              icon={{ pack: 'MaterialCommunityIcons', name: 'shaker' }}
              color={theme.textSecondary}
            />
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
            onDeleteFood={handleDeleteFood}
          />
          
          <MealSection
            mealType="lunch"
            foods={mealData.lunch.foods}
            calories={mealData.lunch.calories}
            onAddFood={() => handleAddFood('lunch')}
            onDeleteFood={handleDeleteFood}
          />
          
          <MealSection
            mealType="dinner"
            foods={mealData.dinner.foods}
            calories={mealData.dinner.calories}
            onAddFood={() => handleAddFood('dinner')}
            onDeleteFood={handleDeleteFood}
          />
          
          <MealSection
            mealType="snack"
            foods={mealData.snack.foods}
            calories={mealData.snack.calories}
            onAddFood={() => handleAddFood('snack')}
            onDeleteFood={handleDeleteFood}
          />
        </>
      )}

      {selectedPeriod === 'week' && (
        <WeeklyView weekData={weekData} />
      )}

      {selectedPeriod === 'month' && (
        <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>
            Monthly Analysis
          </Text>
          <Text style={[styles.comingSoon, { color: theme.textSecondary }]}>
            Monthly analytics coming soon...
          </Text>
        </View>
      )}

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
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
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
    position: 'absolute',
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
  waterControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  waterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterGlasses: {
    flexDirection: 'row',
  },
  waterGlass: {
    padding: 8,
  },
  chartContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
  },
  comingSoon: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 40,
  },
  nutrientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  nutrientCard: {
    width: (screenWidth - 48) / 2,
    margin: 8,
    padding: 16,
    borderRadius: 12,
  },
  nutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutrientLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  nutrientValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  nutrientCurrent: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nutrientGoal: {
    fontSize: 12,
    marginLeft: 4,
  },
  nutrientProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutrientProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  nutrientProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  nutrientPercentage: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
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
  deleteButton: {
    padding: 8,
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