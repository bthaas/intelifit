import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LineChart } from 'react-native-chart-kit';

import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import {
  useWeightStore,
  useUserStore,
  useNutritionStore,
  useSettingsStore,
} from '../../src/stores';
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
  onLogPress?: () => void;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title, current, goal, unit, icon, color, showProgress = true, onLogPress
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
        {onLogPress && (
          <Pressable onPress={onLogPress} style={[styles.logButton, { borderColor: theme.primary }]}>
            <FontAwesome name="plus" size={16} color={theme.primary} />
            <Text style={[styles.logButtonText, { color: theme.primary }]}>Log</Text>
          </Pressable>
        )}
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
  onLogPress: () => void;
  periodLabel: string;
  displayUnit: 'kg' | 'lbs';
  convertWeight: (weight: number) => number;
}

const WeightTrend: React.FC<WeightTrendProps> = ({ weightEntries, onLogPress, periodLabel, displayUnit, convertWeight }) => {
  const theme = useAppTheme();

  if (weightEntries.length === 0) {
    return (
      <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>
            Weight Trend
          </Text>
          <Pressable onPress={onLogPress} style={[styles.logButton, { borderColor: theme.primary }]}>
            <FontAwesome name="plus" size={16} color={theme.primary} />
            <Text style={[styles.logButtonText, { color: theme.primary }]}>Log Weight</Text>
          </Pressable>
        </View>
        <View style={styles.emptyChart}>
          <FontAwesome name="line-chart" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>
            Log your weight to see your trend
          </Text>
        </View>
      </View>
    );
  }

  const entriesForChart = weightEntries;
  const dataPoints = entriesForChart.map(entry => convertWeight(entry.weight));
  
  // Dynamically create labels based on the period to avoid clutter
  const labels = entriesForChart.map((entry, index) => {
    const total = entriesForChart.length;
    // Show fewer labels for longer periods
    if (total > 10 && index % Math.floor(total / 5) !== 0) {
      return '';
    }
    return entry.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  });

  // If there's only one data point, duplicate it to draw a point on the chart
  if (dataPoints.length === 1) {
    dataPoints.push(dataPoints[0]);
    labels.push('');
  }

  const chartData = {
    labels,
    datasets: [{
      data: dataPoints,
      color: (opacity = 1) => theme.primary,
      strokeWidth: 3,
    }],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    backgroundGradientFromOpacity: 1,
    backgroundGradientToOpacity: 1,
    color: (opacity = 1) => theme.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
    yAxisLabel: ` ${displayUnit}`,
    yAxisSuffix: '',
  };

  return (
    <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>
          Weight Trend ({periodLabel})
        </Text>
        <Pressable onPress={onLogPress} style={[styles.logButton, { borderColor: theme.primary }]}>
          <FontAwesome name="plus" size={16} color={theme.primary} />
          <Text style={[styles.logButtonText, { color: theme.primary }]}>Log Weight</Text>
        </Pressable>
      </View>
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

interface WeightJourneyProps {
  startingWeight: number;
  currentWeight: number;
  targetWeight: number;
  unit: string;
}

const WeightJourney: React.FC<WeightJourneyProps> = ({ startingWeight, currentWeight, targetWeight, unit }) => {
  const theme = useAppTheme();

  const isLosingWeight = targetWeight < startingWeight;
  const totalDifference = Math.abs(startingWeight - targetWeight);
  const progressMade = isLosingWeight 
    ? startingWeight - currentWeight 
    : currentWeight - startingWeight;

  let progress = totalDifference > 0 ? (progressMade / totalDifference) * 100 : 0;
  progress = Math.max(0, Math.min(progress, 100)); // Clamp between 0 and 100

  return (
    <View style={[styles.journeyContainer, { backgroundColor: theme.surface }]}>
      <Text style={[styles.journeyTitle, { color: theme.text }]}>Your Weight Journey</Text>
      <View style={styles.journeyEndpoints}>
        <Text style={[styles.journeyEndpointText, { color: theme.textSecondary }]}>{startingWeight.toFixed(1)} {unit}</Text>
        <Text style={[styles.journeyEndpointText, { color: theme.textSecondary }]}>{targetWeight.toFixed(1)} {unit}</Text>
      </View>
      <View style={[styles.progressBarTrack, { backgroundColor: theme.border, marginVertical: 8 }]}>
        <View style={[styles.progressBarFill, { backgroundColor: theme.primary, width: `${progress}%` }]} />
        <View style={[styles.progressIndicator, { left: `${progress}%`, borderColor: theme.primary }]} />
      </View>
      <Text style={[styles.journeyCurrent, { color: theme.text }]}>
        Current: {currentWeight.toFixed(1)} {unit} ({progress.toFixed(0)}% to goal)
      </Text>
    </View>
  );
};

export default function ProgressScreen() {
  const theme = useAppTheme();
  const { user } = useUserStore();
  const { entries: weightEntries, getLatestWeight, addWeightEntry, getFirstWeight } = useWeightStore();
  const { dailyEntries } = useNutritionStore();
  const { units } = useSettingsStore();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [isModalVisible, setModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  const sortedWeightEntries = React.useMemo(() => 
    weightEntries
      .map(entry => ({
        ...entry,
        date: new Date(entry.date), // Ensure it's a Date object
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [weightEntries]
  );

  const { filteredWeightEntries, filteredNutritionEntries, periodLabel } = React.useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let label = '';

    switch (selectedPeriod) {
      case 'month':
        startDate.setDate(now.getDate() - 30);
        label = 'Last 30 Days';
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        label = 'Last Year';
        break;
      case 'week':
      default:
        startDate.setDate(now.getDate() - 7);
        label = 'Last 7 Days';
        break;
    }

    const fwe = sortedWeightEntries.filter(entry => entry.date >= startDate);
    const fne = Object.values(dailyEntries).filter(entry => new Date(entry.date + 'T00:00:00') >= startDate);

    return {
      filteredWeightEntries: fwe,
      filteredNutritionEntries: fne,
      periodLabel: label,
    };
  }, [selectedPeriod, sortedWeightEntries, dailyEntries]);


  const currentWeight = getLatestWeight()?.weight || user?.currentWeight || 0;
  const startingWeight = getFirstWeight()?.weight || currentWeight;
  const targetWeight = user?.goals.targetWeight || 0;
  const goalType = user?.goals.goalType || 'maintain';

  // Calculate progress towards weight goal based on the selected period
  const weightProgress = (() => {
    if (!targetWeight) return 0;
    
    const startWeight = filteredWeightEntries.length > 0 
      ? filteredWeightEntries[0].weight 
      : currentWeight;

    const endWeight = currentWeight;

    if (goalType === 'lose_weight') {
      if (targetWeight >= startWeight) return 0;
      const totalToLose = startWeight - targetWeight;
      const lostSoFar = startWeight - endWeight;
      return totalToLose > 0 ? (lostSoFar / totalToLose) * 100 : 0;
    } else if (goalType === 'gain_weight') {
      if (targetWeight <= startWeight) return 0;
      const totalToGain = targetWeight - startWeight;
      const gainedSoFar = endWeight - startWeight;
      return totalToGain > 0 ? (gainedSoFar / totalToGain) * 100 : 0;
    }
    
    return 100; // Maintain weight goal
  })();

  // Calculate average nutrition for the period
  const avgCalories = filteredNutritionEntries.length > 0 
    ? filteredNutritionEntries.reduce((sum, entry) => sum + entry.totalNutrition.calories, 0) / filteredNutritionEntries.length
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

  const handleLogWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid weight.');
      return;
    }

    const weightInKg = units === 'imperial' ? NutritionCalculator.convertWeight(weight, 'lbs', 'kg') : weight;

    try {
      await addWeightEntry(weightInKg, new Date());
      setNewWeight('');
      setModalVisible(false);
      Alert.alert('Success', 'Your weight has been logged.');
    } catch (error) {
      Alert.alert('Error', 'Failed to log weight. Please try again.');
    }
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

  const displayUnit = units === 'imperial' ? 'lbs' : 'kg';
  const convertDisplayWeight = (weight: number) => {
    return units === 'imperial' ? NutritionCalculator.convertWeight(weight, 'kg', 'lbs') : weight;
  };

  return (
    <>
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
            current={convertDisplayWeight(currentWeight)}
            goal={0}
            unit={displayUnit}
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
        {targetWeight > 0 && goalType !== 'maintain' && (
          <ProgressCard
            title={`Weight ${goalType === 'lose_weight' ? 'Loss' : 'Gain'}`}
            current={weightProgress}
            goal={100}
            unit="%"
            icon="bullseye"
            color={theme.success}
          />
        )}

        {/* Calorie Goal Progress */}
        <ProgressCard
          title={`Calorie Average (${periodLabel})`}
          current={avgCalories}
          goal={calorieGoal}
          unit=" cal"
          icon="pie-chart"
          color="#f39c12"
        />

        {/* Weight Trend Chart */}
        <WeightTrend 
          weightEntries={filteredWeightEntries} 
          onLogPress={() => setModalVisible(true)}
          periodLabel={periodLabel}
          displayUnit={displayUnit}
          convertWeight={convertDisplayWeight}
        />

        {/* Weight Journey */}
        {targetWeight > 0 && startingWeight > 0 && (
          <WeightJourney 
            startingWeight={convertDisplayWeight(startingWeight)}
            currentWeight={convertDisplayWeight(currentWeight)}
            targetWeight={convertDisplayWeight(targetWeight)}
            unit={displayUnit}
          />
        )}

        {/* Recent Weight Entries */}
        <View style={[styles.entriesContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Weight Entries ({periodLabel})
          </Text>
          
          {filteredWeightEntries.length === 0 ? (
            <View style={styles.emptyEntries}>
              <FontAwesome name="balance-scale" size={32} color={theme.textSecondary} />
              <Text style={[styles.emptyEntriesText, { color: theme.textSecondary }]}>
                No weight entries in this period
              </Text>
            </View>
          ) : (
            [...filteredWeightEntries].reverse().map((entry) => (
              <View key={entry.id} style={styles.weightEntry}>
                <View style={styles.weightEntryInfo}>
                  <Text style={[styles.weightEntryWeight, { color: theme.text }]}>
                    {convertDisplayWeight(entry.weight).toFixed(1)} {displayUnit}
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
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Log Your Weight</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder={`Enter weight in ${displayUnit}`}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={newWeight}
              onChangeText={setNewWeight}
            />
            <Pressable style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleLogWeight}>
              <Text style={styles.saveButtonText}>Save Weight</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
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
    flex: 1,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  logButtonText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 12,
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
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  cancelButton: {
    padding: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
  },
  journeyContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  journeyEndpoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  journeyEndpointText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressIndicator: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    transform: [{ translateX: -7 }], // Center the indicator on the line
  },
  journeyCurrent: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});