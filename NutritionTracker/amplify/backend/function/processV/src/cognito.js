import AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider();

// Replace with your actual User Pool ID and Client ID
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'YOUR_USER_POOL_ID';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || 'YOUR_CLIENT_ID';

/**
 * Create a Cognito user and send an OTP (verification code) to their phone/email
 * @param {string} username - The username (usually email or phone)
 * @param {string} password - The user's password
 * @param {string} phoneNumber - The user's phone number in E.164 format
 * @param {string} email - The user's email address
 */
export async function createCognitoUserAndSendOTP({ username, password, phoneNumber, email }) {
  // Create the user
  const params = {
    UserPoolId: USER_POOL_ID,
    Username: username,
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'phone_number', Value: phoneNumber },
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'phone_number_verified', Value: 'false' },
    ],
    MessageAction: 'SUPPRESS', // Don't send default welcome email
  };
  await cognito.adminCreateUser(params).promise();

  // Send OTP (verification code) to phone
  const otpParams = {
    ClientId: CLIENT_ID,
    Username: username,
  };
  await cognito.forgotPassword(otpParams).promise();
} 