# AWS Cognito Transfer Checklist

## 🔍 **Step 1: Gather Configuration from Your Other Repo**

### **1.1 Find Your AWS Cognito Values**

Look in your other repo for these files:
- `.env` files
- `config.js` or `config.ts`
- AWS SDK configuration files
- Cognito setup files

**Values to Find:**
- [ ] **User Pool ID** (format: `us-east-1_XXXXXXXXX`)
- [ ] **App Client ID** (format: `XXXXXXXXXXXXXXXXXXXXXXXXXX`)
- [ ] **AWS Region** (e.g., `us-east-1`, `eu-west-1`)

### **1.2 Check Custom Attributes**

In your AWS Console, go to Cognito → User Pools → Your Pool → Sign-up experience → Custom attributes

**Check if you have these attributes:**
- [ ] `name` (String)
- [ ] `birthdate` (String)
- [ ] `gender` (String)
- [ ] `height` (Number)
- [ ] `weight` (Number)
- [ ] `activity_level` (String)
- [ ] `goal_type` (String)
- [ ] `calorie_goal` (Number)
- [ ] `macro_protein` (Number)
- [ ] `macro_carbs` (Number)
- [ ] `macro_fat` (Number)
- [ ] `units` (String)
- [ ] `theme` (String)

## 🔧 **Step 2: Update Configuration**

### **2.1 Update Auth Service**

Edit `src/services/auth.ts` and replace the placeholder values:

```typescript
const COGNITO_CONFIG = {
  UserPoolId: 'YOUR_ACTUAL_USER_POOL_ID',
  ClientId: 'YOUR_ACTUAL_CLIENT_ID',
  Region: 'YOUR_ACTUAL_REGION',
};
```

### **2.2 Create Environment File (Optional)**

Create `.env` file in the root directory:

```env
AWS_COGNITO_USER_POOL_ID=your_user_pool_id
AWS_COGNITO_CLIENT_ID=your_client_id
AWS_COGNITO_REGION=your_region
```

## 🧪 **Step 3: Test the Integration**

### **3.1 Test User Registration**
- [ ] Run app: `npm start`
- [ ] Navigate to login screen
- [ ] Try to sign up with a test email
- [ ] Check if verification email is received
- [ ] Verify the email with the code

### **3.2 Test User Login**
- [ ] Try logging in with verified credentials
- [ ] Check if user is redirected to main app
- [ ] Verify user data is loaded correctly

### **3.3 Test Password Reset**
- [ ] Try forgot password functionality
- [ ] Check if reset email is received
- [ ] Test password reset with code

## 🔍 **Step 4: Troubleshooting**

### **Common Issues & Solutions:**

**1. "User not found"**
- [ ] Check User Pool ID is correct
- [ ] Check App Client ID is correct
- [ ] Verify region matches

**2. "Invalid credentials"**
- [ ] Check password policy in AWS Console
- [ ] Verify email is confirmed
- [ ] Check if user exists in Cognito

**3. "Email not verified"**
- [ ] Check email verification settings in AWS Console
- [ ] Verify email templates are configured
- [ ] Check SES configuration if using custom email

**4. "Attribute not found"**
- [ ] Add missing custom attributes in AWS Console
- [ ] Check attribute names match exactly
- [ ] Verify attribute types are correct

## 📱 **Step 5: Verify App Functionality**

### **5.1 Authentication Flow**
- [ ] App shows login screen for unauthenticated users
- [ ] Sign up creates user in Cognito
- [ ] Login authenticates with Cognito
- [ ] User is redirected to main app after login
- [ ] Logout clears session

### **5.2 Onboarding Flow**
- [ ] New users can complete onboarding
- [ ] User data is saved to Cognito attributes
- [ ] Profile data is loaded correctly
- [ ] Goals are calculated properly

### **5.3 Data Persistence**
- [ ] User data persists between app sessions
- [ ] Profile updates are saved to Cognito
- [ ] Settings are synchronized

## 🔐 **Step 6: Security Verification**

### **6.1 Security Settings**
- [ ] Password policy is enforced
- [ ] Email verification is required
- [ ] Session tokens are managed properly
- [ ] No sensitive data in client code

### **6.2 Error Handling**
- [ ] Network errors are handled gracefully
- [ ] Invalid credentials show appropriate messages
- [ ] Email verification errors are clear
- [ ] Password reset errors are informative

## ✅ **Transfer Complete Checklist**

- [ ] Configuration values transferred
- [ ] Environment variables set (if using)
- [ ] User registration working
- [ ] User login working
- [ ] Password reset working
- [ ] Onboarding flow working
- [ ] Data persistence working
- [ ] Error handling working
- [ ] Security verified

## 🚀 **Next Steps After Transfer**

1. **Test thoroughly** with real user scenarios
2. **Monitor AWS CloudWatch** logs for any issues
3. **Set up production environment** if needed
4. **Configure analytics** and monitoring
5. **Plan user migration** if you have existing users

## 📞 **Need Help?**

If you encounter issues during the transfer:

1. **Check AWS CloudWatch logs** for detailed error messages
2. **Verify configuration values** are correct
3. **Test with AWS CLI** to isolate issues
4. **Check network connectivity** and permissions
5. **Review AWS Cognito documentation** for specific error codes

Your AWS Cognito setup should now be fully integrated with your Nutrition Tracker app! 🎉 