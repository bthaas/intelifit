import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Dimensions,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LineChart } from 'react-native-chart-kit';

import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import { useWeightStore, useUserStore, useNutritionStore } from '../../src/stores';
import { NutritionCalculator, DateUtils } from '../../src/utils/calculations';

const screenWidth = Dimensions.get('window').width;

interface ProgressCardProps {
  title: string;
  current: number;
  goal: number;
  unit: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  showProgress?: boolean;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title, current, goal, unit, icon, color, showProgress = true
}) => {
  const theme = useAppTheme();
  const progress = goal > 0 ? (current / goal) * 100 : 0;
  const isComplete = progress >= 100;

  return (
    <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
      <View style={styles.progressHeader}>
        <FontAwesome name={icon} size={20} color={color} />
        <Text style={[styles.progressTitle, { color: theme.text }]}>
          {title}
        </Text>
      </View>
      
      <View style={styles.progressValues}>
        <Text style={[styles.progressCurrent, { color: theme.text }]}>
          {current.toFixed(1)}{unit}
        </Text>
        {goal > 0 && (
          <Text style={[styles.progressGoal, { color: theme.textSecondary }]}>
            / {goal.toFixed(1)}{unit}
          </Text>
        )}
      </View>
      
      {showProgress && goal > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
            <View 
              style={[
                styles.progressBarFill,
                { 
                  backgroundColor: isComplete ? theme.success : color,
                  width: `${Math.min(progress, 100)}%`
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressPercentage, { color: theme.textSecondary }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
    </View>
  );
};

interface WeightTrendProps {
  weightEntries: Array<{ date: Date; weight: number }>;
}

const WeightTrend: React.FC<WeightTrendProps> = ({ weightEntries }) => {
  const theme = useAppTheme();

  if (weightEntries.length < 2) {
    return (
      <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>
          Weight Trend
        </Text>
        <View style={styles.emptyChart}>
          <FontAwesome name="line-chart" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>
            Add more weight entries to see your trend
          </Text>
        </View>
      </View>
    );
  }

  const chartData = {
    labels: weightEntries.slice(-7).map(entry => 
      entry.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    ),
    datasets: [{
      data: weightEntries.slice(-7).map(entry => entry.weight),
      color: (opacity = 1) => theme.primary,
      strokeWidth: 3,
    }],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.surface,
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: theme.surface,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => theme.primary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
  };

  return (
    <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
      <Text style={[styles.chartTitle, { color: theme.text }]}>
        Weight Trend (Last 7 Days)
      </Text>
      <LineChart
        data={chartData}
        width={screenWidth - 64}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        withDots={true}
        withShadow={false}
      />
    </View>
  );
};

export default function ProgressScreen() {
  const theme = useAppTheme();
  const { user } = useUserStore();
  const { entries: weightEntries, getLatestWeight } = useWeightStore();
  const { dailyEntries, currentDate } = useNutritionStore();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const currentWeight = getLatestWeight() || user?.currentWeight || 0;
  const targetWeight = user?.goals.targetWeight || 0;
  const goalType = user?.goals.goalType || 'maintain';

  // Calculate progress towards weight goal
  const weightProgress = (() => {
    if (!user?.currentWeight || !targetWeight) return 0;
    
    const startWeight = user.currentWeight;
    const currentWeightValue = currentWeight;
    
    if (goalType === 'lose_weight') {
      const totalToLose = startWeight - targetWeight;
      const lostSoFar = startWeight - currentWeightValue;
      return totalToLose > 0 ? (lostSoFar / totalToLose) * 100 : 0;
    } else if (goalType === 'gain_weight') {
      const totalToGain = targetWeight - startWeight;
      const gainedSoFar = currentWeightValue - startWeight;
      return totalToGain > 0 ? (gainedSoFar / totalToGain) * 100 : 0;
    }
    
    return 100; // Maintain weight goal
  })();

  // Calculate average nutrition for the period
  const periodEntries = Object.values(dailyEntries).slice(-7); // Last 7 days
  const avgCalories = periodEntries.length > 0 
    ? periodEntries.reduce((sum, entry) => sum + entry.totalNutrition.calories, 0) / periodEntries.length
    : 0;

  const calorieGoal = user?.goals.calorieGoal || 2000;

  // Calculate streak
  const streak = (() => {
    let count = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (dailyEntries[dateStr]?.totalNutrition.calories > 0) {
        count++;
      } else {
        break;
      }
    }
    
    return count;
  })();

  const handleAddWeight = () => {
    // Navigate to weight entry modal
    console.log('Add weight entry');
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <FontAwesome name="line-chart" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Set up your profile to track progress
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Period Selector */}
      <View style={[styles.periodSelector, { backgroundColor: theme.surface }]}>
        {(['week', 'month', 'year'] as const).map((period) => (
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

      {/* Overview Cards */}
      <View style={styles.overviewGrid}>
        <ProgressCard
          title="Current Weight"
          current={currentWeight}
          goal={0}
          unit="kg"
          icon="balance-scale"
          color={theme.primary}
          showProgress={false}
        />
        
        <ProgressCard
          title="Logging Streak"
          current={streak}
          goal={0}
          unit=" days"
          icon="fire"
          color="#ff6b6b"
          showProgress={false}
        />
      </View>

      {/* Weight Goal Progress */}
      {targetWeight > 0 && (
        <ProgressCard
          title={`Weight ${goalType === 'lose_weight' ? 'Loss' : goalType === 'gain_weight' ? 'Gain' : 'Maintenance'}`}
          current={weightProgress}
          goal={100}
          unit="%"
          icon="bullseye"
          color={theme.success}
        />
      )}

      {/* Calorie Goal Progress */}
      <ProgressCard
        title="Daily Calorie Average"
        current={avgCalories}
        goal={calorieGoal}
        unit=" cal"
        icon="pie-chart"
        color="#f39c12"
      />

      {/* Weight Trend Chart */}
      <WeightTrend weightEntries={weightEntries} />

      {/* Quick Actions */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Quick Actions
        </Text>
        
        <Pressable 
          onPress={handleAddWeight}
          style={[styles.actionButton, { borderColor: theme.primary }]}
        >
          <FontAwesome name="plus" size={20} color={theme.primary} />
          <Text style={[styles.actionButtonText, { color: theme.primary }]}>
            Log Weight
          </Text>
        </Pressable>
      </View>

      {/* Recent Weight Entries */}
      <View style={[styles.entriesContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Recent Weight Entries
        </Text>
        
        {weightEntries.length === 0 ? (
          <View style={styles.emptyEntries}>
            <FontAwesome name="balance-scale" size={32} color={theme.textSecondary} />
            <Text style={[styles.emptyEntriesText, { color: theme.textSecondary }]}>
              No weight entries yet
            </Text>
          </View>
        ) : (
          weightEntries.slice(0, 5).map((entry) => (
            <View key={entry.id} style={styles.weightEntry}>
              <View style={styles.weightEntryInfo}>
                <Text style={[styles.weightEntryWeight, { color: theme.text }]}>
                  {entry.weight.toFixed(1)} kg
                </Text>
                <Text style={[styles.weightEntryDate, { color: theme.textSecondary }]}>
                  {DateUtils.formatDate(entry.date)}
                </Text>
              </View>
              {entry.notes && (
                <Text style={[styles.weightEntryNotes, { color: theme.textSecondary }]}>
                  {entry.notes}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

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
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
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
  overviewGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  progressCard: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressCurrent: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressGoal: {
    fontSize: 14,
    marginLeft: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
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
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  entriesContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  emptyEntries: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyEntriesText: {
    fontSize: 14,
    marginTop: 8,
  },
  weightEntry: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  weightEntryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightEntryWeight: {
    fontSize: 16,
    fontWeight: '600',
  },
  weightEntryDate: {
    fontSize: 14,
  },
  weightEntryNotes: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 20,
  },
});