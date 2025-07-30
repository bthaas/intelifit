# 🥗 Nutrition Tracker App - TypeScript & Expo Implementation Outline

## 🎯 **CORE FEATURES WITH TYPESCRIPT IMPLEMENTATION**

### **1. Food Input & Recognition**

#### **TypeScript Interfaces & Types**
```typescript
// Core food data types
interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
}

interface FoodItem {
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

interface ServingSize {
  id: string;
  name: string;
  weight: number; // in grams
  unit: MeasurementUnit;
}

type MeasurementUnit = 'g' | 'oz' | 'ml' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'slice';
type FoodCategory = 'protein' | 'grain' | 'vegetable' | 'fruit' | 'dairy' | 'fat' | 'other';
```

#### **Implementation Features**
- **Multi-modal Input**: Camera (Expo Camera), Voice (Expo Speech), Manual entry
- **AI-Powered Analysis**: Integration with Edamam/Spoonacular APIs
- **Barcode Scanning**: Expo Barcode Scanner + Open Food Facts API
- **Voice Recognition**: Expo Speech-to-Text
- **Custom Food Creation**: TypeScript forms with validation

#### **Expo Libraries Needed**
```typescript
// expo install expo-camera expo-barcode-scanner expo-speech expo-av
// expo install expo-file-system expo-image-picker expo-haptics
```

### **2. Nutrition Tracking**

#### **TypeScript Data Models**
```typescript
interface DailyNutrition {
  id: string;
  userId: string;
  date: string; // ISO date string
  meals: MealEntry[];
  totalNutrition: NutritionalInfo;
  calorieGoal: number;
  waterIntake: number; // in ml
  notes?: string;
}

interface MealEntry {
  id: string;
  mealType: MealType;
  foodItems: ConsumedFood[];
  timestamp: Date;
  location?: string;
}

interface ConsumedFood {
  id: string;
  foodItem: FoodItem;
  quantity: number;
  servingSize: ServingSize;
  nutritionConsumed: NutritionalInfo;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
```

#### **State Management with Zustand (TypeScript)**
```typescript
interface NutritionStore {
  dailyEntries: DailyNutrition[];
  currentDate: string;
  favorites: FoodItem[];
  recentFoods: FoodItem[];
  
  // Actions
  addFoodEntry: (mealType: MealType, food: ConsumedFood) => void;
  updateFoodEntry: (entryId: string, updates: Partial<ConsumedFood>) => void;
  deleteFoodEntry: (entryId: string) => void;
  addToFavorites: (food: FoodItem) => void;
  calculateDailyNutrition: (date: string) => NutritionalInfo;
}
```

### **3. User Profile & Goals**

#### **TypeScript User Models**
```typescript
interface UserProfile {
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

interface NutritionGoals {
  goalType: GoalType;
  targetWeight?: number;
  weeklyWeightChange?: number; // kg per week
  calorieGoal: number;
  macroRatios: MacroRatios;
  customGoals?: CustomNutritionGoals;
}

interface MacroRatios {
  protein: number; // percentage 0-100
  carbs: number;
  fat: number;
}

interface UserPreferences {
  units: UnitSystem;
  theme: ThemeMode;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

type Gender = 'male' | 'female' | 'other';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type GoalType = 'lose_weight' | 'gain_weight' | 'maintain' | 'build_muscle';
type UnitSystem = 'metric' | 'imperial';
type ThemeMode = 'light' | 'dark' | 'system';
```

#### **BMR/TDEE Calculations**
```typescript
class NutritionCalculator {
  static calculateBMR(user: UserProfile): number {
    // Mifflin-St Jeor Equation
    const { gender, currentWeight, height, dateOfBirth } = user;
    const age = new Date().getFullYear() - dateOfBirth.getFullYear();
    
    if (gender === 'male') {
      return 10 * currentWeight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * currentWeight + 6.25 * height - 5 * age - 161;
    }
  }

  static calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    return bmr * multipliers[activityLevel];
  }
}
```

### **4. Data Visualization**

#### **Chart Components with TypeScript**
```typescript
interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

interface Dataset {
  data: number[];
  color?: string;
  strokeWidth?: number;
}

interface MacroChartProps {
  nutrition: NutritionalInfo;
  goals: MacroRatios;
  size?: number;
}

// React Native Chart Kit with TypeScript
const MacroChart: React.FC<MacroChartProps> = ({ nutrition, goals, size = 200 }) => {
  const chartData: ChartData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{
      data: [nutrition.protein, nutrition.carbs, nutrition.fat]
    }]
  };

  return (
    <PieChart
      data={chartData}
      width={size}
      height={size}
      chartConfig={chartConfig}
      accessor="data"
      backgroundColor="transparent"
    />
  );
};
```

### **5. Workout Integration**

#### **Exercise Data Models**
```typescript
interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  metValue?: number; // for cardio
  equipment?: string[];
  muscleGroups: MuscleGroup[];
}

interface WorkoutSession {
  id: string;
  userId: string;
  date: Date;
  exercises: ExerciseSet[];
  totalDuration: number; // minutes
  caloriesBurned: number;
  notes?: string;
}

interface ExerciseSet {
  exerciseId: string;
  sets?: StrengthSet[]; // for strength training
  duration?: number; // for cardio
  distance?: number; // for cardio
  caloriesBurned: number;
}

interface StrengthSet {
  reps: number;
  weight: number; // in kg
  restTime?: number; // seconds
}

type ExerciseCategory = 'cardio' | 'strength' | 'flexibility' | 'sports';
type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'abs' | 'glutes';
```

## 🚀 **OPTIMIZATION OPPORTUNITIES WITH TYPESCRIPT**

### **1. Performance Optimizations**

#### **Database with TypeORM & SQLite**
```typescript
// expo install expo-sqlite
import { DataSource } from 'typeorm';
import { openDatabase } from 'expo-sqlite';

@Entity()
export class FoodItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('simple-json')
  nutritionPer100g: NutritionalInfo;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index() // For performance
  @Column()
  category: FoodCategory;
}

// Database configuration
const dataSource = new DataSource({
  database: 'nutrition_tracker.db',
  type: 'expo',
  entities: [FoodItemEntity, UserProfileEntity, DailyNutritionEntity],
  synchronize: true,
  logging: __DEV__,
});
```

#### **Image Caching with Expo**
```typescript
import { Image } from 'expo-image';

interface CachedImageProps {
  uri: string;
  placeholder?: string;
  style?: any;
}

const CachedImage: React.FC<CachedImageProps> = ({ uri, placeholder, style }) => {
  return (
    <Image
      source={{ uri }}
      placeholder={placeholder}
      style={style}
      cachePolicy="memory-disk" // Expo Image caching
      transition={200}
    />
  );
};
```

#### **Background Sync with Expo TaskManager**
```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_SYNC_TASK = 'background-sync';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Sync data with server
    await syncNutritionData();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background sync failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background task
const registerBackgroundSync = async (): Promise<void> => {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
};
```

### **2. User Experience Enhancements**

#### **Smart Suggestions with TypeScript**
```typescript
interface FoodSuggestion {
  food: FoodItem;
  confidence: number;
  reason: SuggestionReason;
}

type SuggestionReason = 'frequent' | 'time_based' | 'nutritional_gap' | 'similar_users';

class FoodSuggestionEngine {
  static async getSuggestions(
    userId: string,
    mealType: MealType,
    currentNutrition: NutritionalInfo
  ): Promise<FoodSuggestion[]> {
    // AI-powered suggestion logic
    const frequentFoods = await this.getFrequentFoods(userId);
    const timeBasedSuggestions = await this.getTimeBasedSuggestions(mealType);
    const nutritionalGapFoods = await this.getNutritionalGapFoods(currentNutrition);
    
    return this.rankSuggestions([
      ...frequentFoods,
      ...timeBasedSuggestions,
      ...nutritionalGapFoods
    ]);
  }
}
```

#### **Offline Mode with AsyncStorage**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineDataManager {
  private static readonly PENDING_SYNC_KEY = 'pending_sync_operations';
  
  static async storePendingOperation(operation: SyncOperation): Promise<void> {
    const pending = await this.getPendingOperations();
    pending.push(operation);
    await AsyncStorage.setItem(this.PENDING_SYNC_KEY, JSON.stringify(pending));
  }
  
  static async syncPendingOperations(): Promise<void> {
    const operations = await this.getPendingOperations();
    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error('Failed to sync operation:', error);
      }
    }
    await AsyncStorage.removeItem(this.PENDING_SYNC_KEY);
  }
}

interface SyncOperation {
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: Date;
}
```

#### **Dark Mode with Expo**
```typescript
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  text: string;
  border: string;
}

const lightTheme: ThemeColors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  primary: '#4CAF50',
  text: '#212529',
  border: '#dee2e6',
};

const darkTheme: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  primary: '#81C784',
  text: '#ffffff',
  border: '#333333',
};

export const useTheme = (): ThemeColors => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};
```

### **3. Advanced Analytics with TypeScript**

#### **Analytics Engine**
```typescript
interface NutritionAnalytics {
  averageDailyCalories: number;
  macroTrends: MacroTrend[];
  nutritionalGaps: NutritionalGap[];
  progressMetrics: ProgressMetric[];
  insights: NutritionInsight[];
}

interface MacroTrend {
  nutrient: keyof NutritionalInfo;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  period: number; // days
}

class AnalyticsEngine {
  static async generateInsights(
    userId: string,
    period: number = 30
  ): Promise<NutritionAnalytics> {
    const entries = await this.getNutritionEntries(userId, period);
    
    return {
      averageDailyCalories: this.calculateAverageCalories(entries),
      macroTrends: this.analyzeMacroTrends(entries),
      nutritionalGaps: this.identifyNutritionalGaps(entries),
      progressMetrics: this.calculateProgress(entries),
      insights: this.generateAIInsights(entries),
    };
  }
}
```

### **4. Health Integration**

#### **Apple Health/Google Fit Integration**
```typescript
// expo install expo-health
import { Health } from 'expo-health';

interface HealthData {
  weight: number;
  steps: number;
  heartRate: number;
  sleepHours: number;
  activeCalories: number;
}

class HealthIntegration {
  static async requestPermissions(): Promise<boolean> {
    const permissions = [
      Health.HealthPermission.WEIGHT,
      Health.HealthPermission.STEPS,
      Health.HealthPermission.HEART_RATE,
    ];
    
    return await Health.requestPermissionsAsync(permissions);
  }
  
  static async syncHealthData(): Promise<HealthData> {
    const weight = await Health.getLatestWeightAsync();
    const steps = await Health.getDailyStepsAsync();
    const heartRate = await Health.getLatestHeartRateAsync();
    
    return {
      weight: weight?.value || 0,
      steps: steps?.value || 0,
      heartRate: heartRate?.value || 0,
      sleepHours: 0, // Implement sleep tracking
      activeCalories: 0, // Calculate from activities
    };
  }
}
```

### **5. AI & Machine Learning**

#### **TensorFlow Lite Integration**
```typescript
// expo install expo-gl expo-gl-cpp expo-three
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-platform-react-native';

interface FoodRecognitionResult {
  foodName: string;
  confidence: number;
  estimatedWeight: number;
  nutrition: NutritionalInfo;
}

class AIFoodRecognition {
  private static model: tf.LayersModel | null = null;
  
  static async loadModel(): Promise<void> {
    if (!this.model) {
      this.model = await tf.loadLayersModel('path/to/food-recognition-model.json');
    }
  }
  
  static async recognizeFood(imageUri: string): Promise<FoodRecognitionResult[]> {
    await this.loadModel();
    
    // Process image and run inference
    const tensor = await this.preprocessImage(imageUri);
    const predictions = this.model!.predict(tensor) as tf.Tensor;
    
    return this.postprocessPredictions(predictions);
  }
}
```

## 📊 **PRIORITY IMPLEMENTATION PHASES**

### **Phase 1: Foundation (High Impact, Low Effort)**

#### **Week 1-2: Project Setup**
```bash
# Initialize Expo TypeScript project
npx create-expo-app NutritionTracker --template tabs@50
cd NutritionTracker

# Install essential dependencies
expo install expo-sqlite expo-file-system expo-image-picker
expo install expo-camera expo-barcode-scanner expo-haptics
npm install zustand react-native-chart-kit @react-native-async-storage/async-storage
npm install typeorm reflect-metadata
```

#### **Week 3-4: Core Data Models & Storage**
- Set up TypeScript interfaces and types
- Implement SQLite database with TypeORM
- Create basic CRUD operations
- Set up state management with Zustand

#### **Week 5-6: Basic UI & Food Entry**
- Create responsive UI components
- Implement manual food entry
- Add barcode scanning
- Basic meal tracking

### **Phase 2: Enhancement (Medium Impact, Medium Effort)**

#### **Month 2: Advanced Features**
- AI-powered food recognition
- Advanced analytics and charts
- Health app integration
- Offline mode implementation

#### **Month 3: User Experience**
- Smart suggestions engine
- Dark mode and themes
- Performance optimizations
- Push notifications

### **Phase 3: Advanced Features (High Impact, High Effort)**

#### **Month 4-5: AI & ML Integration**
- TensorFlow Lite food recognition
- Personalized recommendations
- Predictive analytics
- Voice integration

#### **Month 6: Social & Advanced Analytics**
- Social features and challenges
- Advanced health insights
- Wearable device integration
- Professional coach integration

## 🛠 **TECHNICAL STACK SUMMARY**

### **Frontend (TypeScript + Expo)**
- **Framework**: Expo SDK 50+ with TypeScript
- **State Management**: Zustand with TypeScript
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native Elements + Custom components
- **Charts**: React Native Chart Kit
- **Images**: Expo Image with caching

### **Backend (TypeScript + Node.js)**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Expo AuthSession + JWT
- **File Storage**: AWS S3 or Cloudinary
- **Real-time**: Socket.io for live sync

### **Data & Analytics**
- **Local Storage**: SQLite with TypeORM
- **Caching**: AsyncStorage + React Query
- **Analytics**: Expo Analytics + Custom analytics
- **AI/ML**: TensorFlow Lite + Expo GL

### **External APIs**
- **Nutrition Data**: Edamam Food Database API
- **Barcode Lookup**: Open Food Facts API
- **Health Integration**: Apple HealthKit / Google Fit
- **Image Analysis**: Google Vision API / AWS Rekognition

This comprehensive outline provides a robust foundation for building a modern, TypeScript-first nutrition tracking app with Expo, focusing on performance, user experience, and scalability.