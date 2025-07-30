import { UserProfile, ActivityLevel, NutritionalInfo, ConsumedFood, MacroRatios } from '../types';

export class NutritionCalculator {
  /**
   * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
   */
  static calculateBMR(user: UserProfile): number {
    const { gender, currentWeight, height, dateOfBirth } = user;
    const age = new Date().getFullYear() - dateOfBirth.getFullYear();
    
    if (gender === 'male') {
      return 10 * currentWeight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * currentWeight + 6.25 * height - 5 * age - 161;
    }
  }

  /**
   * Calculate Total Daily Energy Expenditure
   */
  static calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    return Math.round(bmr * multipliers[activityLevel]);
  }

  /**
   * Calculate daily calorie goal based on user goals
   */
  static calculateCalorieGoal(user: UserProfile): number {
    const bmr = this.calculateBMR(user);
    const tdee = this.calculateTDEE(bmr, user.activityLevel);
    
    const { goalType, weeklyWeightChange = 0 } = user.goals;
    
    switch (goalType) {
      case 'lose_weight':
        // 1 kg = 7700 calories, so daily deficit = (weeklyWeightChange * 7700) / 7
        const dailyDeficit = (weeklyWeightChange * 7700) / 7;
        return Math.max(1200, tdee - dailyDeficit); // Minimum 1200 calories
      case 'gain_weight':
        const dailySurplus = (weeklyWeightChange * 7700) / 7;
        return tdee + dailySurplus;
      case 'build_muscle':
        return tdee + 300; // Slight surplus for muscle building
      case 'maintain':
      default:
        return tdee;
    }
  }

  /**
   * Calculate macro goals in grams based on calorie goal and ratios
   */
  static calculateMacroGoals(calorieGoal: number, macroRatios: MacroRatios): NutritionalInfo {
    const proteinCalories = (calorieGoal * macroRatios.protein) / 100;
    const carbCalories = (calorieGoal * macroRatios.carbs) / 100;
    const fatCalories = (calorieGoal * macroRatios.fat) / 100;

    return {
      calories: calorieGoal,
      protein: Math.round(proteinCalories / 4), // 4 calories per gram
      carbs: Math.round(carbCalories / 4), // 4 calories per gram
      fat: Math.round(fatCalories / 9), // 9 calories per gram
      fiber: Math.round(calorieGoal / 1000 * 14), // 14g per 1000 calories (recommended)
      sugar: Math.round(calorieGoal * 0.1 / 4), // Max 10% of calories from added sugar
      sodium: 2300, // 2300mg daily limit
      cholesterol: 300, // 300mg daily limit
    };
  }

  /**
   * Calculate nutrition consumed from a consumed food item
   */
  static calculateNutritionConsumed(
    nutritionPer100g: NutritionalInfo,
    quantity: number,
    servingSizeWeight: number
  ): NutritionalInfo {
    const totalWeight = (quantity * servingSizeWeight) / 100; // Convert to 100g units
    
    return {
      calories: Math.round(nutritionPer100g.calories * totalWeight),
      protein: Math.round(nutritionPer100g.protein * totalWeight * 10) / 10,
      carbs: Math.round(nutritionPer100g.carbs * totalWeight * 10) / 10,
      fat: Math.round(nutritionPer100g.fat * totalWeight * 10) / 10,
      fiber: Math.round(nutritionPer100g.fiber * totalWeight * 10) / 10,
      sugar: Math.round(nutritionPer100g.sugar * totalWeight * 10) / 10,
      sodium: Math.round(nutritionPer100g.sodium * totalWeight),
      cholesterol: Math.round(nutritionPer100g.cholesterol * totalWeight),
    };
  }

  /**
   * Sum up nutrition values from multiple food items
   */
  static sumNutrition(nutritionValues: NutritionalInfo[]): NutritionalInfo {
    return nutritionValues.reduce(
      (total, nutrition) => ({
        calories: total.calories + nutrition.calories,
        protein: Math.round((total.protein + nutrition.protein) * 10) / 10,
        carbs: Math.round((total.carbs + nutrition.carbs) * 10) / 10,
        fat: Math.round((total.fat + nutrition.fat) * 10) / 10,
        fiber: Math.round((total.fiber + nutrition.fiber) * 10) / 10,
        sugar: Math.round((total.sugar + nutrition.sugar) * 10) / 10,
        sodium: total.sodium + nutrition.sodium,
        cholesterol: total.cholesterol + nutrition.cholesterol,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
      }
    );
  }

  /**
   * Calculate nutrition from consumed foods
   */
  static calculateTotalNutrition(consumedFoods: ConsumedFood[]): NutritionalInfo {
    const nutritionValues = consumedFoods.map(food => food.nutritionConsumed);
    return this.sumNutrition(nutritionValues);
  }

  /**
   * Convert units between metric and imperial
   */
  static convertWeight(value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
    if (from === to) return value;
    
    if (from === 'kg' && to === 'lbs') {
      return Math.round(value * 2.20462 * 10) / 10;
    } else if (from === 'lbs' && to === 'kg') {
      return Math.round(value / 2.20462 * 10) / 10;
    }
    
    return value;
  }

  static convertHeight(value: number, from: 'cm' | 'ft', to: 'cm' | 'ft'): number {
    if (from === to) return value;
    
    if (from === 'cm' && to === 'ft') {
      return Math.round(value / 30.48 * 10) / 10;
    } else if (from === 'ft' && to === 'cm') {
      return Math.round(value * 30.48);
    }
    
    return value;
  }

  /**
   * Calculate percentage of goal achieved
   */
  static calculateProgress(current: number, goal: number): number {
    if (goal === 0) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  }

  /**
   * Determine if nutrition goals are met
   */
  static isGoalMet(current: number, goal: number, tolerance: number = 0.1): boolean {
    const lowerBound = goal * (1 - tolerance);
    const upperBound = goal * (1 + tolerance);
    return current >= lowerBound && current <= upperBound;
  }

  /**
   * Calculate calories burned for exercise based on MET values
   */
  static calculateCaloriesBurned(
    metValue: number,
    weightKg: number,
    durationMinutes: number
  ): number {
    // Calories burned = MET × weight in kg × time in hours
    return Math.round(metValue * weightKg * (durationMinutes / 60));
  }

  /**
   * Estimate calories burned for strength training
   */
  static calculateStrengthCalories(
    weightKg: number,
    durationMinutes: number,
    intensity: 'light' | 'moderate' | 'vigorous' = 'moderate'
  ): number {
    const metValues = {
      light: 3.0,
      moderate: 6.0,
      vigorous: 8.0,
    };
    
    return this.calculateCaloriesBurned(metValues[intensity], weightKg, durationMinutes);
  }
}

export class FoodUtils {
  /**
   * Generate common serving sizes for a food item
   */
  static generateCommonServingSizes(category: string) {
    const commonSizes = {
      protein: [
        { name: '100g', weight: 100, unit: 'g' as const },
        { name: '1 piece (85g)', weight: 85, unit: 'piece' as const },
        { name: '1 oz', weight: 28.35, unit: 'oz' as const },
      ],
      grain: [
        { name: '100g', weight: 100, unit: 'g' as const },
        { name: '1 cup cooked', weight: 195, unit: 'cup' as const },
        { name: '1 slice', weight: 30, unit: 'slice' as const },
      ],
      vegetable: [
        { name: '100g', weight: 100, unit: 'g' as const },
        { name: '1 cup', weight: 150, unit: 'cup' as const },
        { name: '1 medium', weight: 120, unit: 'piece' as const },
      ],
      fruit: [
        { name: '100g', weight: 100, unit: 'g' as const },
        { name: '1 medium', weight: 150, unit: 'piece' as const },
        { name: '1 cup', weight: 150, unit: 'cup' as const },
      ],
      dairy: [
        { name: '100g', weight: 100, unit: 'g' as const },
        { name: '1 cup', weight: 240, unit: 'cup' as const },
        { name: '1 tbsp', weight: 15, unit: 'tbsp' as const },
      ],
      beverage: [
        { name: '100ml', weight: 100, unit: 'ml' as const },
        { name: '1 cup (240ml)', weight: 240, unit: 'cup' as const },
        { name: '1 bottle (330ml)', weight: 330, unit: 'piece' as const },
      ],
      default: [
        { name: '100g', weight: 100, unit: 'g' as const },
        { name: '1 serving', weight: 100, unit: 'piece' as const },
      ],
    };

    return commonSizes[category as keyof typeof commonSizes] || commonSizes.default;
  }

  /**
   * Search foods by name (mock implementation)
   */
  static searchFoods(query: string): Promise<any[]> {
    // This would typically call an external API like Edamam or Spoonacular
    return Promise.resolve([]);
  }

  /**
   * Get food data from barcode (mock implementation)
   */
  static getFoodFromBarcode(barcode: string): Promise<any> {
    // This would typically call Open Food Facts API
    return Promise.resolve(null);
  }
}

export class DateUtils {
  /**
   * Get today's date in ISO format
   */
  static getTodayISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  }

  /**
   * Get week dates starting from Monday
   */
  static getWeekDates(date: Date = new Date()): Date[] {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + i);
      week.push(weekDay);
    }

    return week;
  }

  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    return d1.toDateString() === d2.toDateString();
  }
}