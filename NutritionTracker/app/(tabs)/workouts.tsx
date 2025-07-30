import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import { useWorkoutStore, useUserStore } from '../../src/stores';
import { NutritionCalculator, DateUtils } from '../../src/utils/calculations';
import { WorkoutSession, ExerciseSet } from '../../src/types';

interface WorkoutCardProps {
  workout: WorkoutSession;
  onPress: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onPress }) => {
  const theme = useAppTheme();

  return (
    <Pressable 
      onPress={onPress}
      style={[styles.workoutCard, { backgroundColor: theme.surface }]}
    >
      <View style={styles.workoutHeader}>
        <FontAwesome name="heart" size={20} color={theme.primary} />
        <Text style={[styles.workoutDate, { color: theme.text }]}>
          {DateUtils.formatDate(workout.date)}
        </Text>
        <Text style={[styles.workoutCalories, { color: theme.textSecondary }]}>
          {workout.caloriesBurned} cal
        </Text>
      </View>
      
      <View style={styles.workoutStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {workout.totalDuration}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            minutes
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {workout.exercises.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            exercises
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

interface QuickWorkoutProps {
  name: string;
  duration: number;
  estimatedCalories: number;
  onStart: () => void;
}

const QuickWorkout: React.FC<QuickWorkoutProps> = ({ 
  name, duration, estimatedCalories, onStart 
}) => {
  const theme = useAppTheme();

  return (
    <Pressable 
      onPress={onStart}
      style={[styles.quickWorkout, { backgroundColor: theme.surface }]}
    >
      <View style={styles.quickWorkoutContent}>
        <Text style={[styles.quickWorkoutName, { color: theme.text }]}>
          {name}
        </Text>
        <Text style={[styles.quickWorkoutDetails, { color: theme.textSecondary }]}>
          {duration} min • ~{estimatedCalories} cal
        </Text>
      </View>
      <FontAwesome name="play" size={16} color={theme.primary} />
    </Pressable>
  );
};

export default function WorkoutsScreen() {
  const theme = useAppTheme();
  const { user } = useUserStore();
  const { 
    workouts, 
    exercises, 
    currentWorkout, 
    loadExercises,
    startWorkout,
    getWorkoutsForDate,
  } = useWorkoutStore();

  const [selectedDate, setSelectedDate] = useState(DateUtils.getTodayISO());

  useEffect(() => {
    loadExercises();
  }, []);

  const todayWorkouts = getWorkoutsForDate(selectedDate);
  const totalCaloriesBurned = todayWorkouts.reduce(
    (sum, workout) => sum + workout.caloriesBurned, 0
  );

  const quickWorkouts = [
    { name: '7-Minute Workout', duration: 7, estimatedCalories: 50 },
    { name: 'Quick Cardio', duration: 15, estimatedCalories: 120 },
    { name: 'Strength Training', duration: 30, estimatedCalories: 200 },
    { name: 'Yoga Flow', duration: 20, estimatedCalories: 80 },
  ];

  const handleStartQuickWorkout = (workoutName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Start Workout',
      `Ready to start ${workoutName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            startWorkout();
            // Navigate to workout screen
            console.log(`Starting ${workoutName}`);
          }
        }
      ]
    );
  };

  const handleWorkoutPress = (workout: WorkoutSession) => {
    // Navigate to workout details
    console.log('View workout details:', workout.id);
  };

  const handleAddCustomWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to add workout modal
    console.log('Add custom workout');
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <FontAwesome name="heart" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Set up your profile to start tracking workouts
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Today's Summary */}
      <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Today's Activity
          </Text>
          <Text style={[styles.summaryDate, { color: theme.textSecondary }]}>
            {DateUtils.formatDate(selectedDate)}
          </Text>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: theme.primary }]}>
              {todayWorkouts.length}
            </Text>
            <Text style={[styles.summaryStatLabel, { color: theme.textSecondary }]}>
              Workouts
            </Text>
          </View>
          
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: theme.primary }]}>
              {totalCaloriesBurned}
            </Text>
            <Text style={[styles.summaryStatLabel, { color: theme.textSecondary }]}>
              Calories
            </Text>
          </View>
          
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: theme.primary }]}>
              {todayWorkouts.reduce((sum, w) => sum + w.totalDuration, 0)}
            </Text>
            <Text style={[styles.summaryStatLabel, { color: theme.textSecondary }]}>
              Minutes
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Start Workouts */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Quick Start
        </Text>
        
        {quickWorkouts.map((workout, index) => (
          <QuickWorkout
            key={index}
            name={workout.name}
            duration={workout.duration}
            estimatedCalories={workout.estimatedCalories}
            onStart={() => handleStartQuickWorkout(workout.name)}
          />
        ))}
        
        <Pressable 
          onPress={handleAddCustomWorkout}
          style={[styles.addCustomWorkout, { borderColor: theme.primary }]}
        >
          <FontAwesome name="plus" size={20} color={theme.primary} />
          <Text style={[styles.addCustomWorkoutText, { color: theme.primary }]}>
            Add Custom Workout
          </Text>
        </Pressable>
      </View>

      {/* Recent Workouts */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Recent Workouts
        </Text>
        
        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="heart-o" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No workouts yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Start your first workout above
            </Text>
          </View>
        ) : (
          workouts
            .slice(0, 10) // Show last 10 workouts
            .map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onPress={() => handleWorkoutPress(workout)}
              />
            ))
        )}
      </View>

      {/* Current Workout Status */}
      {currentWorkout && (
        <View style={[styles.currentWorkout, { backgroundColor: theme.primary }]}>
          <View style={styles.currentWorkoutContent}>
            <FontAwesome name="play" size={20} color="#ffffff" />
            <Text style={styles.currentWorkoutText}>
              Workout in progress
            </Text>
          </View>
          <Pressable style={styles.currentWorkoutButton}>
            <Text style={styles.currentWorkoutButtonText}>
              Continue
            </Text>
          </Pressable>
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
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDate: {
    fontSize: 14,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickWorkoutContent: {
    flex: 1,
  },
  quickWorkoutName: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickWorkoutDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  addCustomWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addCustomWorkoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  workoutCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  workoutCalories: {
    fontSize: 14,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  currentWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  currentWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentWorkoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  currentWorkoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  currentWorkoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});