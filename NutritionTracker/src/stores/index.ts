import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  FoodItem,
  DailyNutrition,
  ConsumedFood,
  MealType,
  Exercise,
  WorkoutSession,
  WeightEntry,
  NutritionalInfo,
  ThemeMode,
  UnitSystem,
} from '../types';
import { db } from '../database';
import { NutritionCalculator, DateUtils } from '../utils/calculations';

// User Store
interface UserStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setOnboardingComplete: (completed: boolean) => void;
  clearAllData: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      isLoading: false,

      setUser: (user) => 
        set({ user, isAuthenticated: true }),

      updateUserProfile: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...updates, updatedAt: new Date() };
        set({ user: updatedUser });

        // This is where you might also update the database
        try {
          await db.initialize();
          await db.updateUser(updatedUser);
        } catch (error) {
          console.error("Failed to update user in DB:", error);
        }
      },

      logout: () => 
        set({ user: null, isAuthenticated: false, hasCompletedOnboarding: false }),
      
      clearAllData: () => 
        set({ user: null, isAuthenticated: false, hasCompletedOnboarding: false, isLoading: false }),

      setLoading: (loading) => 
        set({ isLoading: loading }),

      setOnboardingComplete: (completed) =>
        set({ hasCompletedOnboarding: completed }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding
      }),
    }
  )
);

// Nutrition Store
interface NutritionStore {
  dailyEntries: Record<string, DailyNutrition>; // date -> DailyNutrition
  currentDate: string;
  favorites: FoodItem[];
  recentFoods: FoodItem[];
  isLoading: boolean;

  // Actions
  setCurrentDate: (date: string) => void;
  getDailyEntry: (date: string) => DailyNutrition | null;
  addFoodEntry: (mealType: MealType, food: ConsumedFood) => Promise<void>;
  updateFoodEntry: (entryId: string, updates: Partial<ConsumedFood>) => Promise<void>;
  deleteFoodEntry: (entryId: string, mealType: MealType) => Promise<void>;
  addToFavorites: (food: FoodItem) => Promise<void>;
  removeFromFavorites: (foodId: string) => Promise<void>;
  addToRecent: (food: FoodItem) => void;
  updateWaterIntake: (amount: number) => Promise<void>;
  calculateDailyNutrition: (date: string) => NutritionalInfo;
  setLoading: (loading: boolean) => void;
  loadDailyEntry: (date: string) => Promise<void>;
}

export const useNutritionStore = create<NutritionStore>()(
  persist(
    (set, get) => ({
      dailyEntries: {},
      currentDate: DateUtils.getTodayISO(),
      favorites: [],
      recentFoods: [],
      isLoading: false,

      setCurrentDate: (date) => {
        set({ currentDate: date });
        get().loadDailyEntry(date);
      },

      getDailyEntry: (date) => {
        return get().dailyEntries[date] || null;
      },

      addFoodEntry: async (mealType, food) => {
        const { currentDate, dailyEntries } = get();
        const user = useUserStore.getState().user;
        if (!user) return;

        const currentEntry = dailyEntries[currentDate] || {
          id: `daily-${currentDate}`,
          userId: user.id,
          date: currentDate,
          meals: [],
          totalNutrition: {
            calories: 0, protein: 0, carbs: 0, fat: 0,
            fiber: 0, sugar: 0, sodium: 0, cholesterol: 0,
          },
          calorieGoal: user.goals.calorieGoal,
          waterIntake: 0,
        };

        // Find or create meal entry
        let mealEntry = currentEntry.meals.find(m => m.mealType === mealType);
        if (!mealEntry) {
          mealEntry = {
            id: `meal-${Date.now()}`,
            mealType,
            foodItems: [],
            timestamp: new Date(),
          };
          currentEntry.meals.push(mealEntry);
        }

        // Add food to meal
        mealEntry.foodItems.push(food);

        // Recalculate total nutrition
        const allFoods = currentEntry.meals.flatMap(m => m.foodItems);
        currentEntry.totalNutrition = NutritionCalculator.calculateTotalNutrition(allFoods);

        set({
          dailyEntries: {
            ...dailyEntries,
            [currentDate]: currentEntry,
          },
        });

        // Add to recent foods
        get().addToRecent(food.foodItem);
      },

      updateFoodEntry: async (entryId, updates) => {
        const { currentDate, dailyEntries } = get();
        const currentEntry = dailyEntries[currentDate];
        if (!currentEntry) return;

        // Find and update the food entry
        for (const meal of currentEntry.meals) {
          const foodIndex = meal.foodItems.findIndex(f => f.id === entryId);
          if (foodIndex !== -1) {
            meal.foodItems[foodIndex] = { 
              ...meal.foodItems[foodIndex], 
              ...updates 
            };
            break;
          }
        }

        // Recalculate total nutrition
        const allFoods = currentEntry.meals.flatMap(m => m.foodItems);
        currentEntry.totalNutrition = NutritionCalculator.calculateTotalNutrition(allFoods);

        set({
          dailyEntries: {
            ...dailyEntries,
            [currentDate]: currentEntry,
          },
        });
      },

      deleteFoodEntry: async (entryId, mealType) => {
        const { currentDate, dailyEntries } = get();
        const currentEntry = dailyEntries[currentDate];
        if (!currentEntry) return;

        // Find and remove the food entry
        const meal = currentEntry.meals.find(m => m.mealType === mealType);
        if (meal) {
          meal.foodItems = meal.foodItems.filter(f => f.id !== entryId);
        }

        // Recalculate total nutrition
        const allFoods = currentEntry.meals.flatMap(m => m.foodItems);
        currentEntry.totalNutrition = NutritionCalculator.calculateTotalNutrition(allFoods);

        set({
          dailyEntries: {
            ...dailyEntries,
            [currentDate]: currentEntry,
          },
        });
      },

      addToFavorites: async (food) => {
        const { favorites } = get();
        const user = useUserStore.getState().user;
        if (!user) return;

        if (!favorites.find(f => f.id === food.id)) {
          const newFavorites = [...favorites, food];
          set({ favorites: newFavorites });

          try {
            await db.initialize();
            await db.addToFavorites(user.id, food.id);
          } catch (error) {
            console.error('Failed to add to favorites:', error);
          }
        }
      },

      removeFromFavorites: async (foodId) => {
        const { favorites } = get();
        set({ favorites: favorites.filter(f => f.id !== foodId) });
      },

      addToRecent: (food) => {
        const { recentFoods } = get();
        const newRecent = [
          food,
          ...recentFoods.filter(f => f.id !== food.id),
        ].slice(0, 10); // Keep only 10 recent items
        set({ recentFoods: newRecent });
      },

      updateWaterIntake: async (amount) => {
        const { currentDate, dailyEntries } = get();
        const currentEntry = dailyEntries[currentDate];
        if (!currentEntry) return;

        currentEntry.waterIntake = amount;
        set({
          dailyEntries: {
            ...dailyEntries,
            [currentDate]: currentEntry,
          },
        });
      },

      calculateDailyNutrition: (date) => {
        const entry = get().dailyEntries[date];
        if (!entry) {
          return {
            calories: 0, protein: 0, carbs: 0, fat: 0,
            fiber: 0, sugar: 0, sodium: 0, cholesterol: 0,
          };
        }
        return entry.totalNutrition;
      },

      setLoading: (loading) => set({ isLoading: loading }),

      loadDailyEntry: async (date) => {
        // This would load from database in a real implementation
        // For now, we'll create a default entry if it doesn't exist
        const { dailyEntries } = get();
        const user = useUserStore.getState().user;
        
        if (!dailyEntries[date] && user) {
          const defaultEntry: DailyNutrition = {
            id: `daily-${date}`,
            userId: user.id,
            date,
            meals: [],
            totalNutrition: {
              calories: 0, protein: 0, carbs: 0, fat: 0,
              fiber: 0, sugar: 0, sodium: 0, cholesterol: 0,
            },
            calorieGoal: user.goals.calorieGoal,
            waterIntake: 0,
          };

          set({
            dailyEntries: {
              ...dailyEntries,
              [date]: defaultEntry,
            },
          });
        }
      },
    }),
    {
      name: 'nutrition-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dailyEntries: state.dailyEntries,
        favorites: state.favorites,
        recentFoods: state.recentFoods,
      }),
    }
  )
);

// Food Store
interface FoodStore {
  searchResults: FoodItem[];
  searchQuery: string;
  isSearching: boolean;
  selectedFood: FoodItem | null;

  // Actions
  searchFoods: (query: string) => Promise<void>;
  setSelectedFood: (food: FoodItem | null) => void;
  clearSearch: () => void;
}

export const useFoodStore = create<FoodStore>((set, get) => ({
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  selectedFood: null,

  searchFoods: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: '' });
      return;
    }

    set({ isSearching: true, searchQuery: query });

    try {
      await db.initialize();
      const results = await db.searchFoodItems(query, 20);
      set({ searchResults: results, isSearching: false });
    } catch (error) {
      console.error('Search failed:', error);
      set({ searchResults: [], isSearching: false });
    }
  },

  setSelectedFood: (food) => set({ selectedFood: food }),

  clearSearch: () => set({ 
    searchResults: [], 
    searchQuery: '', 
    selectedFood: null 
  }),
}));

// Workout Store
interface WorkoutStore {
  workouts: WorkoutSession[];
  exercises: Exercise[];
  currentWorkout: WorkoutSession | null;
  isLoading: boolean;

  // Actions
  loadExercises: () => Promise<void>;
  startWorkout: () => void;
  endWorkout: (workout: Omit<WorkoutSession, 'id'>) => Promise<void>;
  addWorkout: (workout: WorkoutSession) => void;
  deleteWorkout: (workoutId: string) => void;
  getWorkoutsForDate: (date: string) => WorkoutSession[];
  setLoading: (loading: boolean) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      workouts: [],
      exercises: [],
      currentWorkout: null,
      isLoading: false,

      loadExercises: async () => {
        try {
          await db.initialize();
          const exercises = await db.getAllExercises();
          set({ exercises });
        } catch (error) {
          console.error('Failed to load exercises:', error);
        }
      },

      startWorkout: () => {
        const user = useUserStore.getState().user;
        if (!user) return;

        const newWorkout: WorkoutSession = {
          id: `workout-${Date.now()}`,
          userId: user.id,
          date: new Date(),
          exercises: [],
          totalDuration: 0,
          caloriesBurned: 0,
        };
        set({ currentWorkout: newWorkout });
      },

      endWorkout: async (workoutData) => {
        const workout: WorkoutSession = {
          ...workoutData,
          id: `workout-${Date.now()}`,
        };

        const { workouts } = get();
        set({ 
          workouts: [...workouts, workout],
          currentWorkout: null,
        });
      },

      addWorkout: (workout) => {
        const { workouts } = get();
        set({ workouts: [workout, ...workouts] });
      },

      deleteWorkout: (workoutId) => {
        const { workouts } = get();
        set({ workouts: workouts.filter((w) => w.id !== workoutId) });
      },

      getWorkoutsForDate: (date) => {
        const { workouts } = get();
        return workouts.filter(w => 
          DateUtils.isSameDay(w.date, date)
        );
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        workouts: state.workouts,
      }),
    }
  )
);

// Weight Store
interface WeightStore {
  entries: WeightEntry[];
  isLoading: boolean;

  // Actions
  addWeightEntry: (weight: number, date: Date, notes?: string) => Promise<void>;
  getWeightEntries: (days?: number) => WeightEntry[];
  getLatestWeight: () => WeightEntry | null;
  getFirstWeight: () => WeightEntry | null;
  setLoading: (loading: boolean) => void;
}

export const useWeightStore = create<WeightStore>()(
  persist(
    (set, get) => ({
      entries: [],
      isLoading: false,

      addWeightEntry: async (weight, date, notes) => {
        const user = useUserStore.getState().user;
        if (!user) return;

        const entry: WeightEntry = {
          id: `weight-${Date.now()}`,
          userId: user.id,
          weight,
          date,
          notes,
        };

        const { entries } = get();
        const newEntries = [...entries, entry].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        set({ entries: newEntries });

        // Update user's current weight
        const currentUser = useUserStore.getState().user;
        if (currentUser) {
          await useUserStore.getState().updateUserProfile({ currentWeight: weight });
        }
      },

      getWeightEntries: (days = 30) => {
        const { entries } = get();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return entries.filter(entry => 
          new Date(entry.date) >= cutoffDate
        );
      },

      getLatestWeight: () => {
        const { entries } = get();
        return entries.length > 0 ? entries[0] : null;
      },

      getFirstWeight: () => {
        const { entries } = get();
        return entries.length > 0 ? entries[entries.length - 1] : null;
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'weight-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries: state.entries,
      }),
    }
  )
);

// Settings Store
interface SettingsStore {
  theme: ThemeMode;
  units: UnitSystem;
  notifications: {
    enabled: boolean;
    mealReminders: boolean;
    workoutReminders: boolean;
  };

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setUnits: (units: UnitSystem) => void;
  updateNotifications: (notifications: Partial<SettingsStore['notifications']>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      units: 'metric',
      notifications: {
        enabled: true,
        mealReminders: true,
        workoutReminders: true,
      },

      setTheme: (theme) => set({ theme }),

      setUnits: (units) => set({ units }),

      updateNotifications: (updates) => {
        const { notifications } = get();
        set({
          notifications: { ...notifications, ...updates },
        });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);