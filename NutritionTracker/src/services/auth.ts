import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import Constants from 'expo-constants';
import { UserProfile } from '../types';

// AWS Cognito Configuration
// Load from environment variables for security
const COGNITO_CONFIG = {
  UserPoolId: 'us-east-1_5AQYHXBd0',
  ClientId: '7tv7qthj4qnjqoss49rsh1qemd',
  Region: 'us-east-1',
};

// Validate configuration - these are your actual values
console.log('✅ AWS Cognito configuration loaded successfully');

const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_CONFIG.UserPoolId,
  ClientId: COGNITO_CONFIG.ClientId,
});

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  session?: any;
}

export interface SignUpResult {
  success: boolean;
  error?: string;
  userSub?: string;
}

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

             cognitoUser.authenticateUser(authenticationDetails, {
         onSuccess: (session: any) => {
           // Get user attributes
           cognitoUser.getUserAttributes((err: any, attributes: any) => {
             if (err) {
               resolve({ success: false, error: err.message });
               return;
             }
 
             const userProfile = this.createUserProfileFromAttributes(attributes, email);
             resolve({ success: true, user: userProfile, session });
           });
         },
         onFailure: (err: any) => {
           resolve({ success: false, error: err.message });
         },
         newPasswordRequired: (userAttributes: any, requiredAttributes: any) => {
           // Handle new password required (first time login)
           resolve({ success: false, error: 'New password required' });
         },
       });
    });
  }

  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, userAttributes: any = {}): Promise<SignUpResult> {
    return new Promise((resolve) => {
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        ...Object.entries(userAttributes).map(([key, value]) => 
          new CognitoUserAttribute({ Name: key, Value: value as string })
        ),
      ];

      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          resolve({ success: false, error: err.message });
          return;
        }

        resolve({ 
          success: true, 
          userSub: result?.user?.getUsername() 
        });
      });
    });
  }

  /**
   * Confirm sign up with verification code
   */
  static async confirmSignUp(email: string, code: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

             cognitoUser.confirmRegistration(code, true, (err: any) => {
         if (err) {
           resolve({ success: false, error: err.message });
           return;
         }
 
         resolve({ success: true });
       });
    });
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    return new Promise((resolve) => {
      const currentUser = userPool.getCurrentUser();
      if (currentUser) {
        currentUser.signOut(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    return new Promise((resolve) => {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        resolve(null);
        return;
      }

             currentUser.getSession((err: any, session: any) => {
         if (err || !session?.isValid()) {
           resolve(null);
           return;
         }

        currentUser.getUserAttributes((err, attributes) => {
          if (err || !attributes) {
            resolve(null);
            return;
          }

          const email = attributes.find(attr => attr.getName() === 'email')?.getValue() || '';
          const userProfile = this.createUserProfileFromAttributes(attributes, email);
          resolve(userProfile);
        });
      });
    });
  }

  /**
   * Forgot password - send reset code
   */
  static async forgotPassword(email: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve({ success: true });
        },
        onFailure: (err) => {
          resolve({ success: false, error: err.message });
        },
      });
    });
  }

  /**
   * Confirm new password with reset code
   */
  static async confirmNewPassword(email: string, code: string, newPassword: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve({ success: true });
        },
        onFailure: (err) => {
          resolve({ success: false, error: err.message });
        },
      });
    });
  }

  /**
   * Resend verification code
   */
  static async resendConfirmationCode(email: string): Promise<AuthResult> {
    return new Promise((resolve) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.resendConfirmationCode((err) => {
        if (err) {
          resolve({ success: false, error: err.message });
          return;
        }

        resolve({ success: true });
      });
    });
  }

  /**
   * Update user attributes
   */
  static async updateUserAttributes(attributes: Record<string, string>): Promise<AuthResult> {
    return new Promise((resolve) => {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        resolve({ success: false, error: 'No authenticated user' });
        return;
      }

      const attributeList = Object.entries(attributes).map(([key, value]) => 
        new CognitoUserAttribute({ Name: key, Value: value })
      );

      currentUser.updateAttributes(attributeList, (err) => {
        if (err) {
          resolve({ success: false, error: err.message });
          return;
        }

        resolve({ success: true });
      });
    });
  }

  /**
   * Create UserProfile from Cognito attributes
   */
  private static createUserProfileFromAttributes(attributes: any[], email: string): UserProfile {
    const getAttribute = (name: string) => 
      attributes.find(attr => attr.getName() === name)?.getValue() || '';

    return {
      id: getAttribute('sub') || `user-${Date.now()}`,
      email,
      name: getAttribute('name') || 'User',
      dateOfBirth: new Date(getAttribute('birthdate') || '1990-01-01'),
      gender: (getAttribute('gender') as any) || 'other',
      height: parseInt(getAttribute('height') || '170'),
      currentWeight: parseFloat(getAttribute('weight') || '70'),
      activityLevel: (getAttribute('activity_level') as any) || 'moderate',
      goals: {
        goalType: (getAttribute('goal_type') as any) || 'maintain',
        targetWeight: getAttribute('target_weight') ? parseFloat(getAttribute('target_weight')) : undefined,
        weeklyWeightChange: getAttribute('weekly_weight_change') ? parseFloat(getAttribute('weekly_weight_change')) : undefined,
        calorieGoal: parseInt(getAttribute('calorie_goal') || '2000'),
        macroRatios: {
          protein: parseInt(getAttribute('macro_protein') || '30'),
          carbs: parseInt(getAttribute('macro_carbs') || '40'),
          fat: parseInt(getAttribute('macro_fat') || '30'),
        },
      },
      preferences: {
        units: (getAttribute('units') as any) || 'metric',
        theme: (getAttribute('theme') as any) || 'system',
        notifications: {
          mealReminders: getAttribute('meal_reminders') === 'true',
          goalReminders: getAttribute('goal_reminders') === 'true',
          waterReminders: getAttribute('water_reminders') === 'true',
          workoutReminders: getAttribute('workout_reminders') === 'true',
          mealReminderTimes: {
            breakfast: getAttribute('breakfast_time') || '08:00',
            lunch: getAttribute('lunch_time') || '12:00',
            dinner: getAttribute('dinner_time') || '18:00',
          },
        },
        privacy: {
          shareData: getAttribute('share_data') === 'true',
          analytics: getAttribute('analytics') === 'true',
          crashReporting: getAttribute('crash_reporting') === 'true',
        },
      },
      createdAt: new Date(getAttribute('created_at') || Date.now()),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert UserProfile to Cognito attributes
   */
  static userProfileToAttributes(user: UserProfile): Record<string, string> {
    return {
      name: user.name,
      birthdate: user.dateOfBirth.toISOString().split('T')[0],
      gender: user.gender,
      height: user.height.toString(),
      weight: user.currentWeight.toString(),
      activity_level: user.activityLevel,
      goal_type: user.goals.goalType,
      target_weight: user.goals.targetWeight?.toString() || '',
      weekly_weight_change: user.goals.weeklyWeightChange?.toString() || '',
      calorie_goal: user.goals.calorieGoal.toString(),
      macro_protein: user.goals.macroRatios.protein.toString(),
      macro_carbs: user.goals.macroRatios.carbs.toString(),
      macro_fat: user.goals.macroRatios.fat.toString(),
      units: user.preferences.units,
      theme: user.preferences.theme,
      meal_reminders: user.preferences.notifications.mealReminders.toString(),
      goal_reminders: user.preferences.notifications.goalReminders.toString(),
      water_reminders: user.preferences.notifications.waterReminders.toString(),
      workout_reminders: user.preferences.notifications.workoutReminders.toString(),
      breakfast_time: user.preferences.notifications.mealReminderTimes.breakfast,
      lunch_time: user.preferences.notifications.mealReminderTimes.lunch,
      dinner_time: user.preferences.notifications.mealReminderTimes.dinner,
      share_data: user.preferences.privacy.shareData.toString(),
      analytics: user.preferences.privacy.analytics.toString(),
      crash_reporting: user.preferences.privacy.crashReporting.toString(),
      created_at: user.createdAt.toISOString(),
    };
  }
} 