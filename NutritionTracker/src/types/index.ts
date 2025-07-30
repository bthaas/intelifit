// Core nutrition and food types
export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
}

export interface ServingSize {
  id: string;
  name: string;
  weight: number; // in grams
  unit: MeasurementUnit;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  nutritionPer100g: NutritionalInfo;
  servingSizes: ServingSize[];
  category: FoodCategory;
  imageUrl?: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsumedFood {
  id: string;
  foodItem: FoodItem;
  quantity: number;
  servingSize: ServingSize;
  nutritionConsumed: NutritionalInfo;
}

export interface MealEntry {
  id: string;
  mealType: MealType;
  foodItems: ConsumedFood[];
  timestamp: Date;
  location?: string;
}

export interface DailyNutrition {
  id: string;
  userId: string;
  date: string; // ISO date string
  meals: MealEntry[];
  totalNutrition: NutritionalInfo;
  calorieGoal: number;
  waterIntake: number; // in ml
  notes?: string;
}

// User profile and goals
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  dateOfBirth: Date;
  gender: Gender;
  height: number; // in cm
  currentWeight: number; // in kg
  activityLevel: ActivityLevel;
  goals: NutritionGoals;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionGoals {
  goalType: GoalType;
  targetWeight?: number;
  weeklyWeightChange?: number; // kg per week
  calorieGoal: number;
  macroRatios: MacroRatios;
  customGoals?: CustomNutritionGoals;
}

export interface MacroRatios {
  protein: number; // percentage 0-100
  carbs: number;
  fat: number;
}

export interface CustomNutritionGoals {
  fiber?: number;
  sodium?: number;
  sugar?: number;
  cholesterol?: number;
}

export interface UserPreferences {
  units: UnitSystem;
  theme: ThemeMode;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  mealReminders: boolean;
  goalReminders: boolean;
  waterReminders: boolean;
  workoutReminders: boolean;
  mealReminderTimes: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
}

export interface PrivacySettings {
  shareData: boolean;
  analytics: boolean;
  crashReporting: boolean;
}

// Exercise and workout types
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  metValue?: number; // for cardio
  equipment?: string[];
  muscleGroups: MuscleGroup[];
  instructions?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: Date;
  exercises: ExerciseSet[];
  totalDuration: number; // minutes
  caloriesBurned: number;
  notes?: string;
}

export interface ExerciseSet {
  id: string;
  exerciseId: string;
  sets?: StrengthSet[]; // for strength training
  duration?: number; // for cardio (minutes)
  distance?: number; // for cardio (km)
  caloriesBurned: number;
}

export interface StrengthSet {
  reps: number;
  weight: number; // in kg
  restTime?: number; // seconds
}

// Weight tracking
export interface WeightEntry {
  id: string;
  userId: string;
  weight: number; // in kg
  date: Date;
  notes?: string;
}

// Analytics and insights
export interface NutritionAnalytics {
  averageDailyCalories: number;
  macroTrends: MacroTrend[];
  nutritionalGaps: NutritionalGap[];
  progressMetrics: ProgressMetric[];
  weeklyAverages: WeeklyAverages;
}

export interface MacroTrend {
  nutrient: keyof NutritionalInfo;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  period: number; // days
}

export interface NutritionalGap {
  nutrient: keyof NutritionalInfo;
  recommended: number;
  actual: number;
  deficitPercentage: number;
}

export interface ProgressMetric {
  metric: string;
  current: number;
  target: number;
  progress: number; // percentage
}

export interface WeeklyAverages {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  data: number[];
  color?: (opacity: number) => string;
  strokeWidth?: number;
}

// Type unions and enums
export type MeasurementUnit = 'g' | 'oz' | 'ml' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'slice';
export type FoodCategory = 'protein' | 'grain' | 'vegetable' | 'fruit' | 'dairy' | 'fat' | 'beverage' | 'snack' | 'other';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'lose_weight' | 'gain_weight' | 'maintain' | 'build_muscle';
export type UnitSystem = 'metric' | 'imperial';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ExerciseCategory = 'cardio' | 'strength' | 'flexibility' | 'sports';
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'abs' | 'glutes';

// FontAwesome icon names for type safety
export type FontAwesomeIconName = 
  | 'home' | 'pie-chart' | 'heart' | 'line-chart' | 'user'
  | 'plus' | 'edit' | 'sun-o' | 'clock-o' | 'moon-o' | 'apple'
  | 'tint' | 'cutlery' | 'leaf' | 'tree' | 'fire' | 'bolt'
  | 'target' | 'trending-up' | 'activity' | 'paint-brush' | 'globe'
  | 'bell' | 'question-circle' | 'shield' | 'file-text' | 'sign-out'
  | 'balance-scale' | 'play' | 'heart-o' | 'line-chart' | 'fire'
  | 'target' | 'pie-chart' | 'equals' | 'minus' | 'chevron-right'
  | 'male' | 'female' | 'sort' | 'map' | 'filter' | 'at' | 'barcode'
  | 'search' | 'repeat' | 'anchor' | 'bold' | 'link' | 'code'
  | 'header' | 'table' | 'th' | 'circle' | 'image' | 'meetup';

// API and database types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchFilters {
  category?: FoodCategory;
  brand?: string;
  minCalories?: number;
  maxCalories?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// Component prop types
export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export interface FoodSuggestion {
  food: FoodItem;
  confidence: number;
  reason: SuggestionReason;
}

export type SuggestionReason = 'frequent' | 'time_based' | 'nutritional_gap' | 'similar_users';

// Form types
export interface AddFoodForm {
  foodId: string;
  quantity: number;
  servingSizeId: string;
  mealType: MealType;
}

export interface CreateFoodForm {
  name: string;
  brand?: string;
  category: FoodCategory;
  nutritionPer100g: NutritionalInfo;
  servingSizes: Omit<ServingSize, 'id'>[];
}

export interface UserRegistrationForm {
  email: string;
  name: string;
  password: string;
  dateOfBirth: Date;
  gender: Gender;
  height: number;
  currentWeight: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  targetWeight?: number;
}

export interface WorkoutForm {
  exercises: {
    exerciseId: string;
    sets?: Omit<StrengthSet, 'restTime'>[];
    duration?: number;
    distance?: number;
  }[];
  notes?: string;
}

// Utility types
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;