# 🥗 Nutrition Tracker App

A comprehensive nutrition and fitness tracking application built with **React Native Expo** and **TypeScript**. Track your daily food intake, monitor nutritional goals, log workouts, and visualize your progress with beautiful charts and analytics.

## ✨ Features

### 🍎 **Nutrition Tracking**
- **Daily Food Logging**: Track meals across breakfast, lunch, dinner, and snacks
- **Comprehensive Nutrition Data**: Monitor calories, macros (protein, carbs, fat), fiber, sugar, sodium, and cholesterol
- **Smart Food Database**: Searchable database with common foods and their nutritional information
- **Custom Food Creation**: Add your own foods with complete nutritional breakdown
- **Serving Size Management**: Multiple units (grams, ounces, cups, tablespoons, etc.)
- **Favorites System**: Save frequently consumed foods for quick access
- **Water Intake Tracking**: Visual water consumption tracker

### 📊 **Analytics & Visualization**
- **Daily Nutrition Dashboard**: Real-time macro breakdown with progress bars
- **Interactive Charts**: Pie charts for macro distribution, bar charts for weekly trends
- **Detailed Nutrition Analysis**: Track 8+ nutrients with goal progress indicators
- **Weekly/Monthly Views**: Comprehensive nutrition analysis over time
- **Progress Tracking**: Visual indicators showing goal achievement

### 🏋️ **Workout Integration**
- **Exercise Database**: Common exercises with MET values for calorie calculations
- **Workout Logging**: Track both cardio and strength training sessions
- **Quick Start Workouts**: Pre-defined workout templates (7-minute workout, yoga, etc.)
- **Calorie Burn Calculation**: Accurate calorie estimation based on user weight and exercise intensity
- **Workout History**: Complete log of all exercise sessions with details

### 📈 **Progress Monitoring**
- **Weight Tracking**: Log and visualize weight changes over time
- **Goal Progress**: Track progress toward weight and nutrition goals
- **Streak Tracking**: Motivational daily logging streaks
- **BMR/TDEE Calculations**: Scientifically accurate metabolic rate calculations using Mifflin-St Jeor equation
- **Trend Analysis**: Visual charts showing progress patterns

### 👤 **User Profile & Goals**
- **Personalized Onboarding**: Set up age, gender, height, weight, and activity level
- **Smart Goal Setting**: Weight loss, gain, maintenance, or muscle building goals
- **Automatic Calorie Calculation**: AI-powered daily calorie recommendations
- **Flexible Macro Ratios**: Customize protein, carb, and fat percentages
- **Activity Level Adjustment**: Account for different lifestyle activity levels

### 🎨 **User Experience**
- **Dark/Light Mode**: Full theme support with system preference detection
- **Haptic Feedback**: Tactile responses for better user interaction
- **Offline Functionality**: Core features work without internet connection
- **Responsive Design**: Optimized for all screen sizes
- **Intuitive Navigation**: Clean, modern interface with easy navigation

### ⚙️ **Settings & Customization**
- **Unit Preferences**: Switch between metric and imperial systems
- **Notification Management**: Customizable meal and workout reminders
- **Theme Selection**: Light, dark, or system automatic themes
- **Data Export**: Export nutrition data for healthcare providers
- **Privacy Controls**: Granular control over data sharing

## 🛠 **Technical Stack**

### **Frontend**
- **Framework**: Expo SDK 50+ with TypeScript
- **State Management**: Zustand with persistent storage
- **Navigation**: Expo Router (file-based routing)
- **Charts**: React Native Chart Kit for data visualization
- **Database**: SQLite with custom database manager
- **Storage**: AsyncStorage for offline data persistence

### **Core Libraries**
```json
{
  "expo": "~50.0.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "zustand": "^4.4.0",
  "expo-sqlite": "~13.2.0",
  "react-native-chart-kit": "^6.12.0",
  "expo-haptics": "~12.8.0",
  "expo-linear-gradient": "~12.7.0"
}
```

### **Architecture Highlights**
- **Type-Safe**: 100% TypeScript implementation with comprehensive type definitions
- **Modular Design**: Clean separation of concerns with reusable components
- **Performance Optimized**: Efficient database queries with indexing
- **Offline-First**: Core functionality available without internet
- **Scalable**: Easy to extend with new features and integrations

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd NutritionTracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npx expo start
```

4. **Run on device/simulator**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app for physical device

### **Building for Production**

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android
```

## 📱 **App Structure**

```
NutritionTracker/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Today/Dashboard screen
│   │   ├── nutrition.tsx    # Nutrition analysis
│   │   ├── workouts.tsx     # Workout tracking
│   │   ├── progress.tsx     # Progress monitoring
│   │   └── profile.tsx      # User profile & settings
│   └── _layout.tsx          # Root layout with navigation
├── src/
│   ├── components/          # Reusable UI components
│   │   └── ui/             # Theme and base components
│   ├── database/           # SQLite database management
│   ├── stores/             # Zustand state management
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Helper functions & calculations
└── assets/                 # Images, fonts, and static assets
```

## 🎯 **Key Features Implementation**

### **Nutrition Calculations**
- **BMR Calculation**: Uses scientifically accurate Mifflin-St Jeor equation
- **TDEE Estimation**: Factors in activity level for accurate calorie needs
- **Macro Distribution**: Flexible macro ratio calculations
- **Nutritional Analysis**: Real-time nutrition tracking with goal comparison

### **Data Management**
- **Local Database**: SQLite for offline data storage
- **Type-Safe Queries**: Custom database manager with TypeScript
- **State Synchronization**: Zustand stores with persistent storage
- **Performance Optimization**: Indexed queries and efficient data structures

### **User Interface**
- **Modern Design**: Clean, intuitive interface following mobile design patterns
- **Accessibility**: Screen reader support and color-blind friendly design
- **Responsive Layout**: Adapts to different screen sizes and orientations
- **Theme System**: Dynamic theming with light/dark mode support

## 📊 **Data Models**

### **Core Types**
```typescript
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
  nutritionPer100g: NutritionalInfo;
  servingSizes: ServingSize[];
  category: FoodCategory;
}

interface UserProfile {
  id: string;
  name: string;
  goals: NutritionGoals;
  preferences: UserPreferences;
}
```

## 🔮 **Future Enhancements**

### **Phase 1 Extensions**
- [ ] Barcode scanning for quick food entry
- [ ] Recipe builder and management
- [ ] Meal planning and prep features
- [ ] Enhanced food search with external APIs

### **Phase 2 Advanced Features**
- [ ] AI-powered food recognition from photos
- [ ] Social features and friend challenges
- [ ] Integration with fitness wearables
- [ ] Professional nutritionist consultation

### **Phase 3 Enterprise Features**
- [ ] Healthcare provider integration
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Cloud synchronization

## 🤝 **Contributing**

We welcome contributions! Please see our contributing guidelines for details on:
- Code style and conventions
- Pull request process
- Issue reporting
- Feature requests

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 **Acknowledgments**

- **Nutrition Data**: Powered by comprehensive food database
- **Design Inspiration**: Modern mobile nutrition apps
- **Health Calculations**: Based on scientifically validated formulas
- **Open Source Libraries**: Built on excellent React Native ecosystem

---

**Made with ❤️ using TypeScript, React Native, and Expo**

*Transform your health journey with data-driven nutrition tracking!*