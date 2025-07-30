import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Dimensions,
  Pressable,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { PieChart, BarChart } from 'react-native-chart-kit';

import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import { useNutritionStore, useUserStore } from '../../src/stores';
import { NutritionCalculator, DateUtils } from '../../src/utils/calculations';
import { ChartData, Dataset } from '../../src/types';

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

interface NutrientCardProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  icon: string;
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
        <FontAwesome name={icon} size={20} color={color} />
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
      />
    </View>
  );
};

export default function NutritionScreen() {
  const theme = useAppTheme();
  const { user } = useUserStore();
  const { dailyEntries, currentDate } = useNutritionStore();
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
          {/* Calorie summary */}
          <View style={[styles.summaryContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Today's Summary
            </Text>
            
            <View style={styles.calorieRow}>
              <View style={styles.calorieItem}>
                <Text style={[styles.calorieValue, { color: theme.text }]}>
                  {Math.round(totalNutrition.calories)}
                </Text>
                <Text style={[styles.calorieLabel, { color: theme.textSecondary }]}>
                  Consumed
                </Text>
              </View>
              
              <FontAwesome name="minus" size={16} color={theme.textSecondary} />
              
              <View style={styles.calorieItem}>
                <Text style={[styles.calorieValue, { color: theme.text }]}>
                  {calorieGoal}
                </Text>
                <Text style={[styles.calorieLabel, { color: theme.textSecondary }]}>
                  Goal
                </Text>
              </View>
              
              <FontAwesome name="equals" size={16} color={theme.textSecondary} />
              
              <View style={styles.calorieItem}>
                <Text style={[
                  styles.calorieValue, 
                  { color: calorieGoal - totalNutrition.calories >= 0 ? theme.success : theme.error }
                ]}>
                  {Math.abs(calorieGoal - totalNutrition.calories)}
                </Text>
                <Text style={[styles.calorieLabel, { color: theme.textSecondary }]}>
                  {calorieGoal - totalNutrition.calories >= 0 ? 'Remaining' : 'Over'}
                </Text>
              </View>
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
              icon="cutlery"
              color="#e74c3c"
            />
            
            <NutrientCard
              label="Carbs"
              current={totalNutrition.carbs}
              goal={macroGoals.carbs}
              unit="g"
              icon="leaf"
              color="#f39c12"
            />
            
            <NutrientCard
              label="Fat"
              current={totalNutrition.fat}
              goal={macroGoals.fat}
              unit="g"
              icon="tint"
              color="#9b59b6"
            />
            
            <NutrientCard
              label="Fiber"
              current={totalNutrition.fiber}
              goal={macroGoals.fiber}
              unit="g"
              icon="tree"
              color="#27ae60"
            />
            
            <NutrientCard
              label="Sugar"
              current={totalNutrition.sugar}
              goal={macroGoals.sugar}
              unit="g"
              icon="heart"
              color="#f1c40f"
            />
            
            <NutrientCard
              label="Sodium"
              current={totalNutrition.sodium}
              goal={macroGoals.sodium}
              unit="mg"
              icon="warning"
              color="#e67e22"
            />
          </View>
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
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calorieItem: {
    alignItems: 'center',
    flex: 1,
  },
  calorieValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  calorieLabel: {
    fontSize: 12,
    marginTop: 4,
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
  bottomSpacer: {
    height: 20,
  },
});