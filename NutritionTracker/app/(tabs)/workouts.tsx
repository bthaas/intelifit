import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import { useWorkoutStore, useUserStore } from '../../src/stores';
import { NutritionCalculator, DateUtils } from '../../src/utils/calculations';
import { WorkoutSession, ExerciseSet } from '../../src/types';

// Exercise data with MET values and intensity levels
const CARDIO_EXERCISES = [
  { name: 'Running', MET: 9.8, category: 'cardio' },
  { name: 'Cycling', MET: 7.5, category: 'cardio' },
  { name: 'Swimming', MET: 8.0, category: 'cardio' },
  { name: 'Rowing', MET: 7.0, category: 'cardio' },
  { name: 'Jump Rope', MET: 12.3, category: 'cardio' },
  { name: 'Stair Climbing', MET: 8.8, category: 'cardio' },
  { name: 'High-Intensity Interval Training (HIIT)', MET: 9.0, category: 'cardio' },
  { name: 'Kickboxing', MET: 7.7, category: 'cardio' },
  { name: 'Dancing (Zumba)', MET: 6.8, category: 'cardio' },
  { name: 'Elliptical Trainer', MET: 5.0, category: 'cardio' },
  { name: 'Hiking (uphill)', MET: 7.3, category: 'cardio' },
  { name: 'Step Aerobics', MET: 6.5, category: 'cardio' },
  { name: 'Martial Arts', MET: 10.3, category: 'cardio' },
  { name: 'Walking (brisk, 4 mph)', MET: 5.0, category: 'cardio' },
  { name: 'Cross-Country Skiing', MET: 9.0, category: 'cardio' }
];

const STRENGTH_EXERCISES = [
  { name: 'Bench Press', effort: 'high', MET: 6, category: 'strength' },
  { name: 'Squats', effort: 'high', MET: 8, category: 'strength' },
  { name: 'Deadlift', effort: 'high', MET: 8, category: 'strength' },
  { name: 'Pull-ups', effort: 'moderate', MET: 5, category: 'strength' },
  { name: 'Push-ups', effort: 'moderate', MET: 4, category: 'strength' },
  { name: 'Overhead Press', effort: 'high', MET: 6, category: 'strength' },
  { name: 'Barbell Row', effort: 'high', MET: 6, category: 'strength' },
  { name: 'Dumbbell Shoulder Press', effort: 'moderate', MET: 5, category: 'strength' },
  { name: 'Lunges', effort: 'moderate', MET: 5, category: 'strength' },
  { name: 'Bicep Curls', effort: 'low', MET: 3, category: 'strength' },
  { name: 'Tricep Dips', effort: 'moderate', MET: 4, category: 'strength' },
  { name: 'Leg Press', effort: 'moderate', MET: 5, category: 'strength' },
  { name: 'Plank', effort: 'low', MET: 3, category: 'strength' },
  { name: 'Kettlebell Swing', effort: 'high', MET: 7, category: 'strength' },
  { name: 'Cable Row', effort: 'moderate', MET: 5, category: 'strength' },
];

// Intensity multipliers for calorie calculations
const INTENSITY_MULTIPLIERS = {
  low: 0.7,
  moderate: 1.0,
  high: 1.3,
};

// Calculate calories burned based on MET, weight, duration, and intensity
const calculateCaloriesBurned = (
  met: number, 
  weightKg: number, 
  durationMinutes: number, 
  intensity: 'low' | 'moderate' | 'high' = 'moderate'
): number => {
  const intensityMultiplier = INTENSITY_MULTIPLIERS[intensity];
  const adjustedMET = met * intensityMultiplier;
  return Math.round((adjustedMET * weightKg * durationMinutes) / 60);
};

interface WorkoutCardProps {
  workout: WorkoutSession;
  onPress: () => void;
  onDelete: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onPress, onDelete }) => {
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
        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <FontAwesome name="trash" size={20} color={theme.error} />
        </Pressable>
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
    addWorkout,
    getWorkoutsForDate,
    deleteWorkout,
  } = useWorkoutStore();

  const [selectedDate, setSelectedDate] = useState(DateUtils.getTodayISO());
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [exerciseDuration, setExerciseDuration] = useState('30');
  const [exerciseIntensity, setExerciseIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cardio' | 'strength'>('all');

  useEffect(() => {
    loadExercises();
  }, []);

  const todayWorkouts = getWorkoutsForDate(selectedDate);
  const totalCaloriesBurned = todayWorkouts.reduce(
    (sum, workout) => sum + workout.caloriesBurned, 0
  );

  // Calculate estimated calories for quick workouts based on user weight
  const userWeight = user?.currentWeight || 70; // Default 70kg
  const quickWorkouts = [
    { 
      name: '7-Minute Workout', 
      duration: 7, 
      estimatedCalories: calculateCaloriesBurned(8, userWeight, 7, 'moderate') 
    },
    { 
      name: 'Quick Cardio', 
      duration: 15, 
      estimatedCalories: calculateCaloriesBurned(7.5, userWeight, 15, 'moderate') 
    },
    { 
      name: 'Strength Training', 
      duration: 30, 
      estimatedCalories: calculateCaloriesBurned(6, userWeight, 30, 'moderate') 
    },
    { 
      name: 'Yoga Flow', 
      duration: 20, 
      estimatedCalories: calculateCaloriesBurned(3, userWeight, 20, 'low') 
    },
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

  const handleDeleteWorkout = (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteWorkout(workoutId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const handleAddCustomWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowExerciseModal(true);
  };

  const handleExerciseSelect = (exercise: any) => {
    setSelectedExercise(exercise);
    setExerciseDuration('30');
    setExerciseIntensity('moderate');
  };

  const handleStartExercise = () => {
    if (!selectedExercise || !exerciseDuration) {
      Alert.alert('Error', 'Please select an exercise and enter duration');
      return;
    }

    const duration = parseInt(exerciseDuration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User profile not found.');
      return;
    }

    const userWeight = user.currentWeight || 70;
    const caloriesBurned = calculateCaloriesBurned(
      selectedExercise.MET,
      userWeight,
      duration,
      exerciseIntensity
    );

    const newWorkout: WorkoutSession = {
      id: `workout-${Date.now()}`,
      userId: user.id,
      date: new Date(),
      exercises: [
        {
          id: `ex-${Date.now()}`,
          exerciseId: selectedExercise.id || selectedExercise.name,
          name: selectedExercise.name,
          type: selectedExercise.type,
          caloriesBurned,
          sets: [
            {
              id: `set-${Date.now()}`,
              duration,
              intensity: exerciseIntensity,
            },
          ],
        },
      ],
      totalDuration: duration,
      caloriesBurned,
    };

    addWorkout(newWorkout);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Workout Logged!',
      `${selectedExercise.name} for ${duration} minutes has been added to your activity.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowExerciseModal(false);
            setSelectedExercise(null);
            setExerciseDuration('30');
            setExerciseIntensity('moderate');
          },
        },
      ]
    );
  };

  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(DateUtils.getTodayISO(currentDate));
  };

  const handleNextDay = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(DateUtils.getTodayISO(currentDate));
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
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Today's Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <View style={styles.summaryHeader}>
            <Pressable onPress={handlePreviousDay} style={styles.navButton}>
              <FontAwesome name="chevron-left" size={18} color={theme.primary} />
            </Pressable>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>
              {DateUtils.formatDate(selectedDate)}
            </Text>
            <Pressable onPress={handleNextDay} style={styles.navButton}>
              <FontAwesome name="chevron-right" size={18} color={theme.primary} />
            </Pressable>
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
                  onDelete={() => handleDeleteWorkout(workout.id)}
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

      {/* Exercise Selection Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Exercise
            </Text>
            <Pressable
              onPress={() => setShowExerciseModal(false)}
              style={styles.closeButton}
            >
              <FontAwesome name="times" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedExercise ? (
              // Exercise Configuration View
              <View style={styles.configView}>
                {/* Selected Exercise Header */}
                <View style={[styles.selectedExerciseHeader, { backgroundColor: theme.surface }]}>
                  <View style={styles.exerciseHeaderInfo}>
                    <Text style={[styles.selectedExerciseName, { color: theme.text }]}>
                      {selectedExercise.name}
                    </Text>
                    <View style={[
                      styles.exerciseTypeBadge,
                      { backgroundColor: theme.primary }
                    ]}>
                      <Text style={[styles.exerciseTypeText, { color: '#ffffff' }]}>
                        {selectedExercise.type}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setSelectedExercise(null)}
                    style={styles.changeExerciseButton}
                  >
                    <FontAwesome name="edit" size={16} color={theme.primary} />
                    <Text style={[styles.changeExerciseText, { color: theme.primary }]}>
                      Change
                    </Text>
                  </Pressable>
                </View>

                {/* Exercise Configuration */}
                <View style={[styles.exerciseConfig, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.configTitle, { color: theme.text }]}>
                    Configure Your Workout
                  </Text>
                  
                  <View style={styles.configRow}>
                    <Text style={[styles.configLabel, { color: theme.text }]}>Duration (minutes)</Text>
                    <TextInput
                      style={[styles.configInput, { backgroundColor: theme.background, color: theme.text }]}
                      value={exerciseDuration}
                      onChangeText={setExerciseDuration}
                      keyboardType="numeric"
                      placeholder="30"
                      placeholderTextColor={theme.textSecondary}
                    />
                  </View>

                  <View style={styles.configRow}>
                    <Text style={[styles.configLabel, { color: theme.text }]}>Intensity Level</Text>
                    <View style={styles.intensityButtons}>
                      {(['low', 'moderate', 'high'] as const).map((intensity) => (
                        <Pressable
                          key={intensity}
                          style={[
                            styles.intensityButton,
                            { backgroundColor: theme.background },
                            exerciseIntensity === intensity && { backgroundColor: theme.primary }
                          ]}
                          onPress={() => setExerciseIntensity(intensity)}
                        >
                          <Text style={[
                            styles.intensityButtonText,
                            { color: exerciseIntensity === intensity ? '#ffffff' : theme.text }
                          ]}>
                            {intensity.replace('_', ' ')}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {user?.currentWeight && (
                    <View style={styles.caloriePreview}>
                      <Text style={[styles.caloriePreviewText, { color: theme.textSecondary }]}>
                        Estimated calories burned: ~{calculateCaloriesBurned(
                          selectedExercise.MET,
                          user.currentWeight,
                          parseInt(exerciseDuration) || 30,
                          exerciseIntensity
                        )} cal
                      </Text>
                    </View>
                  )}

                  <Pressable
                    style={[styles.startExerciseButton, { backgroundColor: theme.primary }]}
                    onPress={handleStartExercise}
                  >
                    <FontAwesome name="play" size={20} color="#ffffff" />
                    <Text style={styles.startExerciseButtonText}>
                      Start {selectedExercise.name}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              // Exercise Selection View
              <>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <View style={[styles.searchInput, { backgroundColor: theme.surface }]}>
                    <FontAwesome name="search" size={16} color={theme.textSecondary} />
                    <TextInput
                      style={[styles.searchTextInput, { color: theme.text }]}
                      placeholder="Search exercises..."
                      placeholderTextColor={theme.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>

                {/* Category Filter */}
                <View style={styles.categoryFilter}>
                  {(['all', 'cardio', 'strength'] as const).map((category) => (
                    <Pressable
                      key={category}
                      style={[
                        styles.categoryButton,
                        { backgroundColor: theme.surface },
                        selectedCategory === category && { backgroundColor: theme.primary }
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        { color: selectedCategory === category ? '#ffffff' : theme.text }
                      ]}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Exercise List */}
                <View style={styles.exerciseList}>
                  {(() => {
                    // Combine all exercises
                    const allExercises = [
                      ...CARDIO_EXERCISES.map(ex => ({ ...ex, type: 'cardio' as const })),
                      ...STRENGTH_EXERCISES.map(ex => ({ ...ex, type: 'strength' as const }))
                    ];

                    // Filter by category
                    let filteredExercises = allExercises;
                    if (selectedCategory !== 'all') {
                      filteredExercises = allExercises.filter(ex => ex.type === selectedCategory);
                    }

                    // Filter by search query
                    if (searchQuery.trim()) {
                      filteredExercises = filteredExercises.filter(ex =>
                        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                    }

                    return filteredExercises.map((exercise, index) => (
                      <Pressable
                        key={`${exercise.type}-${index}`}
                        style={[
                          styles.exerciseItem,
                          { backgroundColor: theme.surface }
                        ]}
                        onPress={() => handleExerciseSelect(exercise)}
                      >
                        <View style={styles.exerciseInfo}>
                          <View style={styles.exerciseHeader}>
                            <Text style={[styles.exerciseName, { color: theme.text }]}>
                              {exercise.name}
                            </Text>
                            <View style={[
                              styles.exerciseTypeBadge,
                              { backgroundColor: theme.primary }
                            ]}>
                              <Text style={[styles.exerciseTypeText, { color: '#ffffff' }]}>
                                {exercise.type}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <FontAwesome 
                          name="chevron-right" 
                          size={16} 
                          color={theme.textSecondary} 
                        />
                      </Pressable>
                    ));
                  })()}
                </View>
              </>
            )}
          </ScrollView>
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
    textAlign: 'center',
  },
  navButton: {
    padding: 8,
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
  deleteButton: {
    padding: 8,
    marginLeft: 8,
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
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  exerciseSection: {
    marginBottom: 24,
  },
  exerciseSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseMET: {
    fontSize: 12,
  },
  exerciseConfig: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  configRow: {
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  configInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  intensityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intensityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  intensityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  caloriePreview: {
    marginBottom: 16,
  },
  caloriePreviewText: {
    fontSize: 14,
    textAlign: 'center',
  },
  startExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startExerciseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Search and filter styles
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchTextInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  categoryFilter: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseList: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  exerciseTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Configuration view styles
  configView: {
    flex: 1,
  },
  selectedExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  exerciseHeaderInfo: {
    flex: 1,
  },
  selectedExerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  changeExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  changeExerciseText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});