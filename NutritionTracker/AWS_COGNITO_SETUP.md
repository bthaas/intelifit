# AWS Cognito Setup Guide for Nutrition Tracker

## 🚀 **Complete AWS Cognito Integration**

This guide will walk you through setting up AWS Cognito for user authentication in your Nutrition Tracker app.

## 📋 **Prerequisites**

1. **AWS Account**: You need an active AWS account
2. **AWS CLI**: Install and configure AWS CLI
3. **Node.js**: Ensure you have Node.js installed

## 🔧 **Step 1: Create AWS Cognito User Pool**

### 1.1 Navigate to AWS Console
- Go to [AWS Console](https://console.aws.amazon.com/)
- Search for "Cognito" and select "Amazon Cognito"

### 1.2 Create User Pool
1. Click "Create user pool"
2. Choose "Cognito user pool" (not hosted UI)
3. Click "Next"

### 1.3 Configure Sign-in Experience
```
Pool name: nutrition-tracker-users
How do you want your end users to be able to sign in?
☑ Email
☑ Username (optional)

Cognito-assisted sign-in and sign-up:
☑ Enable username (optional)
☑ Allow email addresses when a user signs up
```

### 1.4 Configure Password Policy
```
Password policy: Cognito defaults
☑ Require uppercase letters
☑ Require lowercase letters
☑ Require numbers
☑ Require special characters
☑ Minimum length: 8

Temporary password:
☑ Allow Cognito to create temporary passwords
```

### 1.5 Configure Multi-factor Authentication
```
MFA: Optional
☑ No MFA

User account recovery:
☑ Self-service account recovery
☑ Email
```

### 1.6 Configure App Integration
```
App client name: nutrition-tracker-client
☑ Generate client secret: No
☑ Enable username password auth for admin APIs
☑ Enable SRP (secure remote password) protocol
☑ Enable refresh token rotation
☑ Enable refresh token revocation
```

### 1.7 Review and Create
- Review your settings
- Click "Create user pool"

## 🔑 **Step 2: Get Your Configuration**

After creating the user pool, you'll need these values:

1. **User Pool ID**: Found in the user pool details
2. **App Client ID**: Found in "App integration" → "App client and analytics"

## 📱 **Step 3: Update App Configuration**

### 3.1 Update Auth Service Configuration

Edit `src/services/auth.ts` and replace the placeholder values:

```typescript
const COGNITO_CONFIG = {
  UserPoolId: 'us-east-1_XXXXXXXXX', // Your User Pool ID
  ClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Your App Client ID
  Region: 'us-east-1', // Your AWS region
};
```

### 3.2 Update Login Screen

Edit `app/(auth)/login.tsx` and uncomment the AWS Cognito calls:

```typescript
// Replace the TODO comments with actual AWS Cognito calls
import { AuthService } from '../../src/services/auth';

const handleLogin = async () => {
  // ... existing validation ...
  
  try {
    const result = await AuthService.signIn(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Failed', result.error || 'An error occurred');
    }
  } catch (error) {
    Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
  }
};

const handleSignUp = async () => {
  // ... existing validation ...
  
  try {
    const result = await AuthService.signUp(email, password);
    if (result.success) {
      Alert.alert(
        'Success', 
        'Account created! Please check your email for verification.',
        [{ text: 'OK', onPress: () => setIsSignUp(false) }]
      );
    } else {
      Alert.alert('Sign Up Failed', result.error || 'An error occurred');
    }
  } catch (error) {
    Alert.alert('Sign Up Failed', error instanceof Error ? error.message : 'An error occurred');
  }
};
```

## 🔐 **Step 4: Configure User Pool Attributes**

### 4.1 Add Custom Attributes

In your AWS Cognito User Pool console:

1. Go to "Sign-up experience" → "Custom attributes"
2. Add these custom attributes:

```
name (String)
birthdate (String)
gender (String)
height (Number)
weight (Number)
activity_level (String)
goal_type (String)
target_weight (Number)
weekly_weight_change (Number)
calorie_goal (Number)
macro_protein (Number)
macro_carbs (Number)
macro_fat (Number)
units (String)
theme (String)
meal_reminders (String)
goal_reminders (String)
water_reminders (String)
workout_reminders (String)
breakfast_time (String)
lunch_time (String)
dinner_time (String)
share_data (String)
analytics (String)
crash_reporting (String)
created_at (String)
```

### 4.2 Configure Message Templates

1. Go to "Messaging" → "Message templates"
2. Customize the verification message
3. Set up email configuration

## 🧪 **Step 5: Test the Integration**

### 5.1 Test User Registration
1. Run your app: `npm start`
2. Navigate to the login screen
3. Switch to "Sign Up" mode
4. Create a test account
5. Check your email for verification code

### 5.2 Test User Login
1. Verify your email with the code
2. Try logging in with your credentials
3. Verify you're redirected to the main app

## 🔄 **Step 6: Update Onboarding Flow**

### 6.1 Update Onboarding to Save to Cognito

Edit `app/(auth)/onboarding.tsx` and update the `handleComplete` function:

```typescript
const handleComplete = async () => {
  try {
    // Calculate user profile as before...
    const user = {
      // ... user profile calculation ...
    };

    // Save user attributes to Cognito
    const attributes = AuthService.userProfileToAttributes(user);
    const result = await AuthService.updateUserAttributes(attributes);
    
    if (result.success) {
      setUser(user);
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', 'Failed to save profile to cloud');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to complete setup');
  }
};
```

## 🛡️ **Step 7: Security Best Practices**

### 7.1 Environment Variables
Create a `.env` file (don't commit to git):

```env
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_COGNITO_REGION=us-east-1
```

### 7.2 Update Configuration
Update `src/services/auth.ts`:

```typescript
const COGNITO_CONFIG = {
  UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
  ClientId: process.env.AWS_COGNITO_CLIENT_ID!,
  Region: process.env.AWS_COGNITO_REGION!,
};
```

## 🔍 **Step 8: Troubleshooting**

### Common Issues:

1. **"User not found"**: Check User Pool ID and Client ID
2. **"Invalid credentials"**: Verify password policy
3. **"Email not verified"**: Check email verification settings
4. **"Attribute not found"**: Ensure custom attributes are created

### Debug Steps:
1. Check AWS CloudWatch logs
2. Verify Cognito configuration
3. Test with AWS CLI
4. Check network connectivity

## 📊 **Step 9: Advanced Features**

### 9.1 Social Sign-in (Optional)
- Configure Facebook, Google, or Apple sign-in
- Update app to support social authentication

### 9.2 Multi-factor Authentication
- Enable SMS or TOTP MFA
- Update app to handle MFA challenges

### 9.3 User Groups
- Create user groups for different subscription tiers
- Implement role-based access control

## ✅ **Verification Checklist**

- [ ] User Pool created successfully
- [ ] App Client configured
- [ ] Custom attributes added
- [ ] Configuration updated in app
- [ ] User registration working
- [ ] User login working
- [ ] Email verification working
- [ ] Profile data saving to Cognito
- [ ] Environment variables configured
- [ ] Security best practices implemented

## 🎯 **Next Steps**

1. **Deploy to Production**: Set up production Cognito environment
2. **Monitoring**: Set up CloudWatch monitoring
3. **Backup**: Configure user data backup
4. **Compliance**: Ensure GDPR/CCPA compliance
5. **Analytics**: Add user behavior analytics

Your Nutrition Tracker app now has enterprise-grade authentication with AWS Cognito! 🚀 