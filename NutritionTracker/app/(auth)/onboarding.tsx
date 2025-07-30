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
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';

import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import { useUserStore } from '../../src/stores';
import { Gender, ActivityLevel, GoalType } from '../../src/types';

interface OnboardingData {
  name: string;
  dateOfBirth: Date;
  gender: Gender;
  height: number;
  currentWeight: number;
  targetWeight?: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  weeklyWeightChange?: number;
}

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const { setUser } = useUserStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'other',
    height: 170,
    currentWeight: 70,
    targetWeight: undefined,
    activityLevel: 'moderate',
    goalType: 'maintain',
    weeklyWeightChange: undefined,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  
  // Date picker state
  const [selectedYear, setSelectedYear] = useState(1990);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);

  const steps = [
    {
      title: 'Welcome!',
      subtitle: 'Let\'s get to know you better',
      icon: 'heart',
    },
    {
      title: 'Basic Info',
      subtitle: 'Tell us about yourself',
      icon: 'user',
    },
    {
      title: 'Body Metrics',
      subtitle: 'Help us calculate your needs',
      icon: 'balance-scale',
    },
    {
      title: 'Activity Level',
      subtitle: 'How active are you?',
      icon: 'bolt',
    },
    {
      title: 'Goals',
      subtitle: 'What do you want to achieve?',
      icon: 'target',
    },
  ];

  const activityLevels: Array<{ value: ActivityLevel; label: string; description: string }> = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { value: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { value: 'active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
    { value: 'very_active', label: 'Extremely Active', description: 'Very hard exercise, physical job' },
  ];

  const goalTypes: Array<{ value: GoalType; label: string; description: string }> = [
    { value: 'lose_weight', label: 'Lose Weight', description: 'Reduce body weight' },
    { value: 'gain_weight', label: 'Gain Weight', description: 'Increase body weight' },
    { value: 'maintain', label: 'Maintain Weight', description: 'Keep current weight' },
    { value: 'build_muscle', label: 'Build Muscle', description: 'Gain muscle mass' },
  ];

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Calculate calorie goal based on user data
      const age = new Date().getFullYear() - (data.dateOfBirth?.getFullYear() || 1990);
      let bmr = 0;
      
      if (data.gender === 'male') {
        bmr = 10 * data.currentWeight + 6.25 * data.height - 5 * age + 5;
      } else {
        bmr = 10 * data.currentWeight + 6.25 * data.height - 5 * age - 161;
      }

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      };

      let tdee = bmr * activityMultipliers[data.activityLevel];
      
      // Adjust based on goal
      switch (data.goalType) {
        case 'lose_weight':
          tdee -= 500; // 500 calorie deficit
          break;
        case 'gain_weight':
          tdee += 300; // 300 calorie surplus
          break;
        case 'build_muscle':
          tdee += 200; // 200 calorie surplus
          break;
      }

      const user = {
        id: `user-${Date.now()}`,
        email: 'demo@example.com', // Will be set from login
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        height: data.height,
        currentWeight: data.currentWeight,
        activityLevel: data.activityLevel,
        goals: {
          goalType: data.goalType,
          targetWeight: data.targetWeight,
          weeklyWeightChange: data.weeklyWeightChange,
          calorieGoal: Math.round(tdee),
          macroRatios: { protein: 30, carbs: 40, fat: 30 },
        },
                 preferences: {
           units: 'metric' as const,
           theme: 'system' as const,
          notifications: {
            mealReminders: true,
            goalReminders: true,
            waterReminders: true,
            workoutReminders: true,
            mealReminderTimes: {
              breakfast: '08:00',
              lunch: '12:00',
              dinner: '18:00',
            },
          },
          privacy: {
            shareData: false,
            analytics: true,
            crashReporting: true,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setUser(user);
      // Mark onboarding as complete
      const { setOnboardingComplete } = useUserStore.getState();
      setOnboardingComplete(true);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <FontAwesome name="heart" size={64} color={theme.primary} />
            <Text style={[styles.stepTitle, { color: theme.text }]}>
              Welcome to Nutrition Tracker
            </Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              We'll help you set up your profile and nutrition goals in just a few steps.
            </Text>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Basic Information</Text>
            
            <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
              <FontAwesome name="user" size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Full Name"
                placeholderTextColor={theme.textSecondary}
                value={data.name}
                onChangeText={(name) => setData({ ...data, name })}
              />
            </View>

            <Pressable
              style={[styles.pickerContainer, { backgroundColor: theme.surface }]}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome name="calendar" size={16} color={theme.textSecondary} />
              <Text style={[styles.pickerText, { color: theme.text }]}>
                {data.dateOfBirth.toLocaleDateString()}
              </Text>
            </Pressable>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Gender</Text>
            <View style={styles.optionsContainer}>
              {(['male', 'female', 'other'] as Gender[]).map((gender) => (
                <Pressable
                  key={gender}
                  style={[
                    styles.optionButton,
                    { backgroundColor: theme.surface },
                    data.gender === gender && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setData({ ...data, gender })}
                >
                  <Text style={[
                    styles.optionText,
                    { color: data.gender === gender ? '#ffffff' : theme.text }
                  ]}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Body Metrics</Text>
            
            <Pressable
              style={[styles.pickerContainer, { backgroundColor: theme.surface }]}
              onPress={() => setShowHeightPicker(true)}
            >
              <FontAwesome name="arrows-v" size={16} color={theme.textSecondary} />
              <Text style={[styles.pickerText, { color: theme.text }]}>
                Height: {data.height} cm
              </Text>
            </Pressable>

            <Pressable
              style={[styles.pickerContainer, { backgroundColor: theme.surface }]}
              onPress={() => setShowWeightPicker(true)}
            >
              <FontAwesome name="balance-scale" size={16} color={theme.textSecondary} />
              <Text style={[styles.pickerText, { color: theme.text }]}>
                Current Weight: {data.currentWeight} kg
              </Text>
            </Pressable>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Activity Level</Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              Select your typical activity level
            </Text>
            
            {activityLevels.map((level) => (
              <Pressable
                key={level.value}
                style={[
                  styles.activityOption,
                  { backgroundColor: theme.surface },
                  data.activityLevel === level.value && { backgroundColor: theme.primary }
                ]}
                onPress={() => setData({ ...data, activityLevel: level.value })}
              >
                <View>
                  <Text style={[
                    styles.activityLabel,
                    { color: data.activityLevel === level.value ? '#ffffff' : theme.text }
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={[
                    styles.activityDescription,
                    { color: data.activityLevel === level.value ? '#ffffff' : theme.textSecondary }
                  ]}>
                    {level.description}
                  </Text>
                </View>
                {data.activityLevel === level.value && (
                  <FontAwesome name="check" size={16} color="#ffffff" />
                )}
              </Pressable>
            ))}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Your Goals</Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              What do you want to achieve?
            </Text>
            
            {goalTypes.map((goal) => (
              <Pressable
                key={goal.value}
                style={[
                  styles.activityOption,
                  { backgroundColor: theme.surface },
                  data.goalType === goal.value && { backgroundColor: theme.primary }
                ]}
                onPress={() => setData({ ...data, goalType: goal.value })}
              >
                <View>
                  <Text style={[
                    styles.activityLabel,
                    { color: data.goalType === goal.value ? '#ffffff' : theme.text }
                  ]}>
                    {goal.label}
                  </Text>
                  <Text style={[
                    styles.activityDescription,
                    { color: data.goalType === goal.value ? '#ffffff' : theme.textSecondary }
                  ]}>
                    {goal.description}
                  </Text>
                </View>
                {data.goalType === goal.value && (
                  <FontAwesome name="check" size={16} color="#ffffff" />
                )}
              </Pressable>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[theme.primary, theme.primary + '20']}
        style={styles.header}
      >
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>
        
        <View style={styles.stepHeader}>
          <FontAwesome name={steps[currentStep].icon as any} size={24} color="#ffffff" />
          <Text style={styles.stepHeaderTitle}>{steps[currentStep].title}</Text>
          <Text style={styles.stepHeaderSubtitle}>{steps[currentStep].subtitle}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <Pressable
            style={[styles.footerButton, { borderColor: theme.primary }]}
            onPress={handleBack}
          >
            <Text style={[styles.footerButtonText, { color: theme.primary }]}>
              Back
            </Text>
          </Pressable>
        )}
        
        <Pressable
          style={[
            styles.footerButton,
            { backgroundColor: theme.primary },
            !data.name && currentStep === 1 && { opacity: 0.5 }
          ]}
          onPress={handleNext}
          disabled={!data.name && currentStep === 1}
        >
          <Text style={styles.footerButtonText}>
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Text>
        </Pressable>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Date of Birth</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={(value) => setSelectedYear(value)}
                style={[styles.picker, { color: theme.text }]}
              >
                {Array.from({ length: 50 }, (_, i) => 1970 + i).map(year => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={(value) => setSelectedMonth(value)}
                style={[styles.picker, { color: theme.text }]}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <Picker.Item key={month} label={month.toString()} value={month} />
                ))}
              </Picker>
              <Picker
                selectedValue={selectedDay}
                onValueChange={(value) => setSelectedDay(value)}
                style={[styles.picker, { color: theme.text }]}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <Picker.Item key={day} label={day.toString()} value={day} />
                ))}
              </Picker>
            </View>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.error }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  const newDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                  setData({ ...data, dateOfBirth: newDate });
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Height Picker Modal */}
      <Modal
        visible={showHeightPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Height (cm)</Text>
            <Picker
              selectedValue={data.height}
              onValueChange={(value) => setData({ ...data, height: value })}
              style={[styles.picker, { color: theme.text }]}
            >
              {Array.from({ length: 100 }, (_, i) => 100 + i).map(height => (
                <Picker.Item key={height} label={`${height} cm`} value={height} />
              ))}
            </Picker>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.error }]}
                onPress={() => setShowHeightPicker(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowHeightPicker(false)}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weight Picker Modal */}
      <Modal
        visible={showWeightPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Select Weight (kg)</Text>
          <Picker
            selectedValue={data.currentWeight}
            onValueChange={(value) => setData({ ...data, currentWeight: value })}
            style={[styles.picker, { color: theme.text }]}
          >
            {Array.from({ length: 200 }, (_, i) => 30 + i).map(weight => (
              <Picker.Item key={weight} label={`${weight} kg`} value={weight} />
            ))}
          </Picker>
          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalButton, { backgroundColor: theme.error }]}
              onPress={() => setShowWeightPicker(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowWeightPicker(false)}
            >
              <Text style={styles.modalButtonText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
  stepHeader: {
    alignItems: 'center',
  },
  stepHeaderTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  stepHeaderSubtitle: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  inputPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  pickerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  footerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  picker: {
    flex: 1,
    height: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 