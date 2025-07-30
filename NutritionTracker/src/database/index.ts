import * as SQLite from 'expo-sqlite';
import { 
  FoodItem, 
  UserProfile, 
  DailyNutrition, 
  WorkoutSession, 
  WeightEntry, 
  Exercise,
  NutritionalInfo,
  ServingSize
} from '../types';

class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    if (this.db) return this.db;
    
    this.db = await SQLite.openDatabaseAsync('nutrition_tracker.db');
    await this.createTables();
    await this.seedInitialData();
    return this.db;
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        gender TEXT NOT NULL,
        height REAL NOT NULL,
        current_weight REAL NOT NULL,
        activity_level TEXT NOT NULL,
        goal_type TEXT NOT NULL,
        target_weight REAL,
        weekly_weight_change REAL,
        calorie_goal INTEGER NOT NULL,
        macro_protein INTEGER NOT NULL,
        macro_carbs INTEGER NOT NULL,
        macro_fat INTEGER NOT NULL,
        units TEXT NOT NULL DEFAULT 'metric',
        theme TEXT NOT NULL DEFAULT 'system',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS food_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        barcode TEXT,
        category TEXT NOT NULL,
        image_url TEXT,
        is_custom BOOLEAN NOT NULL DEFAULT 0,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        fiber REAL NOT NULL,
        sugar REAL NOT NULL,
        sodium REAL NOT NULL,
        cholesterol REAL NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS serving_sizes (
        id TEXT PRIMARY KEY,
        food_item_id TEXT NOT NULL,
        name TEXT NOT NULL,
        weight REAL NOT NULL,
        unit TEXT NOT NULL,
        FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS daily_nutrition (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        calorie_goal INTEGER NOT NULL,
        water_intake REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, date)
      );

      CREATE TABLE IF NOT EXISTS meal_entries (
        id TEXT PRIMARY KEY,
        daily_nutrition_id TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        location TEXT,
        FOREIGN KEY (daily_nutrition_id) REFERENCES daily_nutrition (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS consumed_foods (
        id TEXT PRIMARY KEY,
        meal_entry_id TEXT NOT NULL,
        food_item_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        serving_size_id TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        fiber REAL NOT NULL,
        sugar REAL NOT NULL,
        sodium REAL NOT NULL,
        cholesterol REAL NOT NULL,
        FOREIGN KEY (meal_entry_id) REFERENCES meal_entries (id) ON DELETE CASCADE,
        FOREIGN KEY (food_item_id) REFERENCES food_items (id),
        FOREIGN KEY (serving_size_id) REFERENCES serving_sizes (id)
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        met_value REAL,
        muscle_groups TEXT NOT NULL,
        instructions TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        total_duration INTEGER NOT NULL,
        calories_burned INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS exercise_sets (
        id TEXT PRIMARY KEY,
        workout_session_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        duration INTEGER,
        distance REAL,
        calories_burned INTEGER NOT NULL,
        FOREIGN KEY (workout_session_id) REFERENCES workout_sessions (id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises (id)
      );

      CREATE TABLE IF NOT EXISTS strength_sets (
        id TEXT PRIMARY KEY,
        exercise_set_id TEXT NOT NULL,
        reps INTEGER NOT NULL,
        weight REAL NOT NULL,
        rest_time INTEGER,
        FOREIGN KEY (exercise_set_id) REFERENCES exercise_sets (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS weight_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        weight REAL NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        food_item_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (food_item_id) REFERENCES food_items (id),
        UNIQUE(user_id, food_item_id)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_daily_nutrition_user_date ON daily_nutrition(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_food_items_name ON food_items(name);
      CREATE INDEX IF NOT EXISTS idx_food_items_barcode ON food_items(barcode);
      CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date);
    `);
  }

  private async seedInitialData() {
    if (!this.db) return;

    // Check if data already exists
    const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM food_items');
    if (result && (result as any).count > 0) return;

    // Seed common food items
    const commonFoods = [
      {
        id: 'apple-1',
        name: 'Apple',
        category: 'fruit',
        calories: 52, protein: 0.3, carbs: 14, fat: 0.2,
        fiber: 2.4, sugar: 10, sodium: 1, cholesterol: 0
      },
      {
        id: 'banana-1',
        name: 'Banana',
        category: 'fruit',
        calories: 89, protein: 1.1, carbs: 23, fat: 0.3,
        fiber: 2.6, sugar: 12, sodium: 1, cholesterol: 0
      },
      {
        id: 'chicken-breast-1',
        name: 'Chicken Breast',
        category: 'protein',
        calories: 165, protein: 31, carbs: 0, fat: 3.6,
        fiber: 0, sugar: 0, sodium: 74, cholesterol: 85
      },
      {
        id: 'brown-rice-1',
        name: 'Brown Rice',
        category: 'grain',
        calories: 123, protein: 2.6, carbs: 23, fat: 0.9,
        fiber: 1.8, sugar: 0.4, sodium: 5, cholesterol: 0
      },
      {
        id: 'broccoli-1',
        name: 'Broccoli',
        category: 'vegetable',
        calories: 34, protein: 2.8, carbs: 7, fat: 0.4,
        fiber: 2.6, sugar: 1.5, sodium: 33, cholesterol: 0
      }
    ];

    for (const food of commonFoods) {
      await this.db.runAsync(`
        INSERT INTO food_items (
          id, name, category, calories, protein, carbs, fat,
          fiber, sugar, sodium, cholesterol, is_custom,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `, [
        food.id, food.name, food.category,
        food.calories, food.protein, food.carbs, food.fat,
        food.fiber, food.sugar, food.sodium, food.cholesterol,
        new Date().toISOString(), new Date().toISOString()
      ]);

      // Add common serving sizes
      const servingSizes = [
        { name: '100g', weight: 100, unit: 'g' },
        { name: '1 medium', weight: 150, unit: 'piece' },
        { name: '1 cup', weight: 150, unit: 'cup' }
      ];

      for (const size of servingSizes) {
        await this.db.runAsync(`
          INSERT INTO serving_sizes (id, food_item_id, name, weight, unit)
          VALUES (?, ?, ?, ?, ?)
        `, [
          `${food.id}-${size.unit}`,
          food.id,
          size.name,
          size.weight,
          size.unit
        ]);
      }
    }

    // Seed common exercises
    const commonExercises = [
      { id: 'running-1', name: 'Running', category: 'cardio', metValue: 8.0, muscleGroups: ['legs'] },
      { id: 'cycling-1', name: 'Cycling', category: 'cardio', metValue: 6.8, muscleGroups: ['legs'] },
      { id: 'pushups-1', name: 'Push-ups', category: 'strength', metValue: 4.0, muscleGroups: ['chest', 'arms'] },
      { id: 'squats-1', name: 'Squats', category: 'strength', metValue: 5.0, muscleGroups: ['legs', 'glutes'] },
      { id: 'planks-1', name: 'Planks', category: 'strength', metValue: 3.5, muscleGroups: ['abs'] }
    ];

    for (const exercise of commonExercises) {
      await this.db.runAsync(`
        INSERT INTO exercises (id, name, category, met_value, muscle_groups, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        exercise.id,
        exercise.name,
        exercise.category,
        exercise.metValue,
        JSON.stringify(exercise.muscleGroups),
        new Date().toISOString()
      ]);
    }
  }

  // User operations
  async createUser(user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `user-${Date.now()}`;
    const now = new Date().toISOString();

    await this.db.runAsync(`
      INSERT INTO users (
        id, email, name, date_of_birth, gender, height, current_weight,
        activity_level, goal_type, target_weight, weekly_weight_change,
        calorie_goal, macro_protein, macro_carbs, macro_fat,
        units, theme, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, user.email, user.name, user.dateOfBirth.toISOString(),
      user.gender, user.height, user.currentWeight, user.activityLevel,
      user.goals.goalType, user.goals.targetWeight, user.goals.weeklyWeightChange,
      user.goals.calorieGoal, user.goals.macroRatios.protein,
      user.goals.macroRatios.carbs, user.goals.macroRatios.fat,
      user.preferences.units, user.preferences.theme, now, now
    ]);

    return id;
  }

  async getUser(id: string): Promise<UserProfile | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(`
      SELECT * FROM users WHERE id = ?
    `, [id]);

    if (!result) return null;

    const user = result as any;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      dateOfBirth: new Date(user.date_of_birth),
      gender: user.gender,
      height: user.height,
      currentWeight: user.current_weight,
      activityLevel: user.activity_level,
      goals: {
        goalType: user.goal_type,
        targetWeight: user.target_weight,
        weeklyWeightChange: user.weekly_weight_change,
        calorieGoal: user.calorie_goal,
        macroRatios: {
          protein: user.macro_protein,
          carbs: user.macro_carbs,
          fat: user.macro_fat,
        },
      },
      preferences: {
        units: user.units,
        theme: user.theme,
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
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    };
  }

  // Food operations
  async createFoodItem(food: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `food-${Date.now()}`;
    const now = new Date().toISOString();

    await this.db.runAsync(`
      INSERT INTO food_items (
        id, name, brand, barcode, category, image_url, is_custom,
        calories, protein, carbs, fat, fiber, sugar, sodium, cholesterol,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, food.name, food.brand, food.barcode, food.category,
      food.imageUrl, food.isCustom ? 1 : 0,
      food.nutritionPer100g.calories, food.nutritionPer100g.protein,
      food.nutritionPer100g.carbs, food.nutritionPer100g.fat,
      food.nutritionPer100g.fiber, food.nutritionPer100g.sugar,
      food.nutritionPer100g.sodium, food.nutritionPer100g.cholesterol,
      now, now
    ]);

    // Add serving sizes
    for (const servingSize of food.servingSizes) {
      await this.db.runAsync(`
        INSERT INTO serving_sizes (id, food_item_id, name, weight, unit)
        VALUES (?, ?, ?, ?, ?)
      `, [
        `${id}-${servingSize.unit}-${Date.now()}`,
        id,
        servingSize.name,
        servingSize.weight,
        servingSize.unit
      ]);
    }

    return id;
  }

  async searchFoodItems(query: string, limit: number = 20): Promise<FoodItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM food_items 
      WHERE name LIKE ? 
      ORDER BY name 
      LIMIT ?
    `, [`%${query}%`, limit]);

    const foodItems: FoodItem[] = [];

    for (const result of results) {
      const food = result as any;
      
      // Get serving sizes for this food item
      const servingSizes = await this.db.getAllAsync(`
        SELECT * FROM serving_sizes WHERE food_item_id = ?
      `, [food.id]);

      foodItems.push({
        id: food.id,
        name: food.name,
        brand: food.brand,
        barcode: food.barcode,
        category: food.category,
        imageUrl: food.image_url,
        isCustom: Boolean(food.is_custom),
        nutritionPer100g: {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          sugar: food.sugar,
          sodium: food.sodium,
          cholesterol: food.cholesterol,
        },
        servingSizes: servingSizes.map((ss: any) => ({
          id: ss.id,
          name: ss.name,
          weight: ss.weight,
          unit: ss.unit,
        })),
        createdAt: new Date(food.created_at),
        updatedAt: new Date(food.updated_at),
      });
    }

    return foodItems;
  }

  async getFoodItem(id: string): Promise<FoodItem | null> {
    if (!this.db) throw new Error('Database not initialized');

    const food = await this.db.getFirstAsync(`
      SELECT * FROM food_items WHERE id = ?
    `, [id]) as any;

    if (!food) return null;

    const servingSizes = await this.db.getAllAsync(`
      SELECT * FROM serving_sizes WHERE food_item_id = ?
    `, [id]);

    return {
      id: food.id,
      name: food.name,
      brand: food.brand,
      barcode: food.barcode,
      category: food.category,
      imageUrl: food.image_url,
      isCustom: Boolean(food.is_custom),
      nutritionPer100g: {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
        sugar: food.sugar,
        sodium: food.sodium,
        cholesterol: food.cholesterol,
      },
      servingSizes: servingSizes.map((ss: any) => ({
        id: ss.id,
        name: ss.name,
        weight: ss.weight,
        unit: ss.unit,
      })),
      createdAt: new Date(food.created_at),
      updatedAt: new Date(food.updated_at),
    };
  }

  async addToFavorites(userId: string, foodItemId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      INSERT OR IGNORE INTO favorites (id, user_id, food_item_id, created_at)
      VALUES (?, ?, ?, ?)
    `, [`fav-${Date.now()}`, userId, foodItemId, new Date().toISOString()]);
  }

  async getFavorites(userId: string): Promise<FoodItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT f.* FROM food_items f
      JOIN favorites fav ON f.id = fav.food_item_id
      WHERE fav.user_id = ?
      ORDER BY fav.created_at DESC
    `, [userId]);

    const foodItems: FoodItem[] = [];

    for (const result of results) {
      const food = result as any;
      
      const servingSizes = await this.db.getAllAsync(`
        SELECT * FROM serving_sizes WHERE food_item_id = ?
      `, [food.id]);

      foodItems.push({
        id: food.id,
        name: food.name,
        brand: food.brand,
        barcode: food.barcode,
        category: food.category,
        imageUrl: food.image_url,
        isCustom: Boolean(food.is_custom),
        nutritionPer100g: {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          sugar: food.sugar,
          sodium: food.sodium,
          cholesterol: food.cholesterol,
        },
        servingSizes: servingSizes.map((ss: any) => ({
          id: ss.id,
          name: ss.name,
          weight: ss.weight,
          unit: ss.unit,
        })),
        createdAt: new Date(food.created_at),
        updatedAt: new Date(food.updated_at),
      });
    }

    return foodItems;
  }

  // Exercise operations
  async getAllExercises(): Promise<Exercise[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM exercises ORDER BY name
    `);

    return results.map((result: any) => ({
      id: result.id,
      name: result.name,
      category: result.category,
      metValue: result.met_value,
      equipment: [],
      muscleGroups: JSON.parse(result.muscle_groups || '[]'),
      instructions: result.instructions,
    }));
  }

  // Utility methods
  async executeRaw(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.runAsync(sql, params);
  }

  async close() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const db = new DatabaseManager();