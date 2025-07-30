import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../../src/components/ui/ThemeProvider';
import { useUserStore, useSettingsStore } from '../../src/stores';
import { NutritionCalculator } from '../../src/utils/calculations';

interface SettingItemProps {
  icon: string;
  title: string;
  value?: string;
  showArrow?: boolean;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon, title, value, showArrow = true, onPress, rightComponent
}) => {
  const theme = useAppTheme();

  return (
    <Pressable 
      onPress={onPress}
      style={[styles.settingItem, { backgroundColor: theme.surface }]}
    >
      <View style={styles.settingLeft}>
        <FontAwesome name={icon} size={20} color={theme.primary} />
        <Text style={[styles.settingTitle, { color: theme.text }]}>
          {title}
        </Text>
      </View>
      
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
            {value}
          </Text>
        )}
        {rightComponent}
        {showArrow && !rightComponent && (
          <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
        )}
      </View>
    </Pressable>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  const theme = useAppTheme();

  return (
    <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
      <FontAwesome name={icon} size={24} color={color} />
      <Text style={[styles.statsValue, { color: theme.text }]}>
        {value}
      </Text>
      <Text style={[styles.statsTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
    </View>
  );
};

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { user, logout } = useUserStore();
  const { 
    theme: themeMode, 
    units, 
    notifications,
    setTheme, 
    setUnits, 
    updateNotifications 
  } = useSettingsStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(notifications.enabled);
  const [mealReminders, setMealReminders] = useState(notifications.mealReminders);
  const [workoutReminders, setWorkoutReminders] = useState(notifications.workoutReminders);

  const handleThemeChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(themeMode);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const handleUnitsChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUnits(units === 'metric' ? 'imperial' : 'metric');
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to profile edit screen
    console.log('Edit profile');
  };

  const handleEditGoals = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to goals edit screen
    console.log('Edit goals');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logout();
          }
        }
      ]
    );
  };

  const handleNotificationToggle = (type: 'enabled' | 'meals' | 'workouts', value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (type) {
      case 'enabled':
        setNotificationsEnabled(value);
        updateNotifications({ enabled: value });
        break;
      case 'meals':
        setMealReminders(value);
        updateNotifications({ mealReminders: value });
        break;
      case 'workouts':
        setWorkoutReminders(value);
        updateNotifications({ workoutReminders: value });
        break;
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <FontAwesome name="user" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No profile found
          </Text>
          <Pressable 
            onPress={handleEditProfile}
            style={[styles.setupButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.setupButtonText}>
              Create Profile
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const bmr = NutritionCalculator.calculateBMR(user);
  const tdee = NutritionCalculator.calculateTDEE(bmr, user.activityLevel);

  const themeDisplayMap = {
    light: 'Light',
    dark: 'Dark',
    system: 'System'
  };

  const unitsDisplayMap = {
    metric: 'Metric (kg, cm)',
    imperial: 'Imperial (lbs, ft)'
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
        <View style={styles.profileInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {user.name}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
              {user.email}
            </Text>
          </View>
        </View>
        
        <Pressable 
          onPress={handleEditProfile}
          style={[styles.editButton, { borderColor: theme.primary }]}
        >
          <FontAwesome name="edit" size={16} color={theme.primary} />
        </Pressable>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <StatsCard
          title="Current Weight"
          value={`${user.currentWeight} kg`}
          icon="balance-scale"
          color={theme.primary}
        />
        <StatsCard
          title="BMR"
          value={`${Math.round(bmr)} cal`}
          icon="fire"
          color="#e74c3c"
        />
        <StatsCard
          title="TDEE"
          value={`${Math.round(tdee)} cal`}
          icon="bolt"
          color="#f39c12"
        />
      </View>

      {/* Goals Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Goals
        </Text>
        
        <SettingItem
          icon="target"
          title="Nutrition Goals"
          value={`${user.goals.calorieGoal} cal/day`}
          onPress={handleEditGoals}
        />
        
        <SettingItem
          icon="trending-up"
          title="Weight Goal"
          value={user.goals.targetWeight ? `${user.goals.targetWeight} kg` : 'Not set'}
          onPress={handleEditGoals}
        />
        
        <SettingItem
          icon="activity"
          title="Activity Level"
          value={user.activityLevel.replace('_', ' ')}
          onPress={handleEditGoals}
        />
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          App Settings
        </Text>
        
        <SettingItem
          icon="paint-brush"
          title="Theme"
          value={themeDisplayMap[themeMode]}
          onPress={handleThemeChange}
        />
        
        <SettingItem
          icon="globe"
          title="Units"
          value={unitsDisplayMap[units]}
          onPress={handleUnitsChange}
        />
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Notifications
        </Text>
        
        <SettingItem
          icon="bell"
          title="Enable Notifications"
          showArrow={false}
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => handleNotificationToggle('enabled', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          }
        />
        
        {notificationsEnabled && (
          <>
            <SettingItem
              icon="cutlery"
              title="Meal Reminders"
              showArrow={false}
              rightComponent={
                <Switch
                  value={mealReminders}
                  onValueChange={(value) => handleNotificationToggle('meals', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={mealReminders ? '#ffffff' : '#f4f3f4'}
                />
              }
            />
            
            <SettingItem
              icon="heart"
              title="Workout Reminders"
              showArrow={false}
              rightComponent={
                <Switch
                  value={workoutReminders}
                  onValueChange={(value) => handleNotificationToggle('workouts', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={workoutReminders ? '#ffffff' : '#f4f3f4'}
                />
              }
            />
          </>
        )}
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Support
        </Text>
        
        <SettingItem
          icon="question-circle"
          title="Help & Support"
          onPress={() => console.log('Help')}
        />
        
        <SettingItem
          icon="shield"
          title="Privacy Policy"
          onPress={() => console.log('Privacy')}
        />
        
        <SettingItem
          icon="file-text"
          title="Terms of Service"
          onPress={() => console.log('Terms')}
        />
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <Pressable 
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: theme.error }]}
        >
          <FontAwesome name="sign-out" size={20} color="#ffffff" />
          <Text style={styles.logoutButtonText}>
            Logout
          </Text>
        </Pressable>
      </View>

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
    marginBottom: 20,
  },
  setupButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    margin: 8,
    borderRadius: 12,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statsTitle: {
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
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});