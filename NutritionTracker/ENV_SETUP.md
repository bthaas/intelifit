# Environment Variables Setup

## 🔐 **Secure Configuration Setup**

This guide will help you set up your AWS Cognito credentials securely using environment variables.

## 📁 **Files Created**

- `.env` - Your actual credentials (NOT tracked by Git)
- `.gitignore` - Updated to exclude .env files
- `src/services/auth.ts` - Updated to use environment variables

## 🔧 **Step 1: Configure Your .env File**

Edit the `.env` file in your project root and add your actual AWS Cognito values:

```env
# AWS Cognito Configuration
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_COGNITO_REGION=us-east-1
```

### **How to Find Your Values:**

1. **User Pool ID**: 
   - Go to AWS Console → Cognito → User Pools → Your Pool
   - Copy the Pool ID (format: `us-east-1_XXXXXXXXX`)

2. **App Client ID**:
   - Go to AWS Console → Cognito → User Pools → Your Pool → App Integration
   - Copy the App Client ID (format: `XXXXXXXXXXXXXXXXXXXXXXXXXX`)

3. **Region**:
   - Use the region where you created your User Pool (e.g., `us-east-1`, `eu-west-1`)

## 🔒 **Security Features**

### **What's Protected:**
- ✅ `.env` file is NOT tracked by Git
- ✅ Sensitive credentials are not in code
- ✅ Environment variables are validated
- ✅ Warning messages if not configured

### **What's Safe to Commit:**
- ✅ `.env.example` (template file)
- ✅ Configuration code (no real values)
- ✅ Documentation

## 🧪 **Step 2: Test Your Configuration**

1. **Start the app**: `npm start`
2. **Check console**: Look for warning messages
3. **Test login**: Try the authentication flow
4. **Verify**: Ensure no real credentials are in the code

## 🔍 **Step 3: Verify Security**

### **Check Git Status:**
```bash
git status
```
You should NOT see `.env` in the tracked files.

### **Check .gitignore:**
```bash
cat .gitignore | grep env
```
Should show:
```
.env
.env.example
```

## 🚨 **Important Security Notes**

### **Never Commit:**
- ❌ `.env` files with real credentials
- ❌ AWS access keys
- ❌ User Pool IDs in code
- ❌ Client secrets

### **Always Use:**
- ✅ Environment variables
- ✅ `.env` files for local development
- ✅ Secure credential management
- ✅ Environment-specific configurations

## 🔄 **For Different Environments**

### **Development:**
```env
AWS_COGNITO_USER_POOL_ID=us-east-1_dev_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=dev_XXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_COGNITO_REGION=us-east-1
NODE_ENV=development
```

### **Production:**
```env
AWS_COGNITO_USER_POOL_ID=us-east-1_prod_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=prod_XXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_COGNITO_REGION=us-east-1
NODE_ENV=production
```

## 🛠️ **Troubleshooting**

### **"Environment variables not set" warning:**
1. Check `.env` file exists
2. Verify variable names are correct
3. Restart the development server
4. Check for typos in values

### **"User not found" error:**
1. Verify User Pool ID is correct
2. Check App Client ID matches
3. Ensure region is correct
4. Verify user exists in Cognito

### **"Invalid credentials" error:**
1. Check password policy
2. Verify email is confirmed
3. Test with AWS Console

## ✅ **Verification Checklist**

- [ ] `.env` file created with real values
- [ ] `.env` file NOT tracked by Git
- [ ] App starts without credential warnings
- [ ] Login/signup works with Cognito
- [ ] No sensitive data in committed code
- [ ] Environment variables validated

## 🎯 **Next Steps**

1. **Test thoroughly** with your AWS Cognito setup
2. **Set up production environment** variables
3. **Configure CI/CD** with secure environment variables
4. **Monitor AWS CloudWatch** for any issues
5. **Set up backup** for your credentials

Your AWS Cognito configuration is now secure and ready for development! 🔐 