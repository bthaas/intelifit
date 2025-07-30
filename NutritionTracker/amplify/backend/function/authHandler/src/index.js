/* Amplify Params - DO NOT EDIT
	API_TRANSCRIBE_APIID
	API_TRANSCRIBE_APINAME
	AUTH_AUTH1_USERPOOLID
	ENV
	REGION
Amplify Params - DO NOT EDIT *//**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log('Full event:', JSON.stringify(event, null, 2));

    let body = {};
    try {
        if (event.body) {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } else {
            body = event;
        }
    } catch (e) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Invalid request body" }),
        };
    }

    console.log('Parsed body:', JSON.stringify(body, null, 2));

    const aws = require('aws-sdk');
    const cognito = new aws.CognitoIdentityServiceProvider();

    // Hardcoded values for now
    const COGNITO_CLIENT_ID = '7tv7qthj4qnjqoss49rsh1qemd';
    const COGNITO_USER_POOL_ID = 'us-east-1_5AQYHXBd0';

    // Route based on event.path
    const path = event.path || '';
    if (path.endsWith('/register')) {
        // Registration
        if (body.username && body.password && body.email) {
            console.log('Processing registration request');
            try {
                await cognito.signUp({
                    ClientId: COGNITO_CLIENT_ID,
                    Username: body.username,
                    Password: body.password,
                    UserAttributes: [
                        { Name: 'email', Value: body.email },
                        ...(body.phoneNumber ? [{ Name: 'phone_number', Value: body.phoneNumber }] : []),
                        ...(body.name ? [{ Name: 'name', Value: body.name }] : []),
                        ...(body.preferredUsername ? [{ Name: 'preferred_username', Value: body.preferredUsername }] : []),
                    ],
                }).promise();
                return {
                    statusCode: 200,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ success: true, message: 'User created, OTP sent to email.' }),
                };
            } catch (err) {
                return {
                    statusCode: 500,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ error: err.message }),
                };
            }
        }
    } else if (path.endsWith('/verify')) {
        // Verification
        if (body.username && body.code) {
            console.log('Processing verification request');
            try {
                await cognito.confirmSignUp({
                    ClientId: COGNITO_CLIENT_ID,
                    Username: body.username,
                    ConfirmationCode: body.code,
                }).promise();
                return {
                    statusCode: 200,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ success: true, message: 'User verified.' }),
                };
            } catch (err) {
                return {
                    statusCode: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ error: err.message }),
                };
            }
        }
    } else if (path.endsWith('/login')) {
        // Login
        if (body.username && body.password) {
            console.log('Processing login request');
            try {
                const authResult = await cognito.adminInitiateAuth({
                    UserPoolId: COGNITO_USER_POOL_ID,
                    ClientId: COGNITO_CLIENT_ID,
                    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
                    AuthParameters: {
                        USERNAME: body.username,
                        PASSWORD: body.password,
                    },
                }).promise();

                if (authResult.AuthenticationResult) {
                    return {
                        statusCode: 200,
                        headers: { "Access-Control-Allow-Origin": "*" },
                        body: JSON.stringify({ 
                            success: true, 
                            message: 'Login successful.',
                            tokens: {
                                accessToken: authResult.AuthenticationResult.AccessToken,
                                refreshToken: authResult.AuthenticationResult.RefreshToken,
                                idToken: authResult.AuthenticationResult.IdToken,
                            }
                        }),
                    };
                } else {
                    return {
                        statusCode: 400,
                        headers: { "Access-Control-Allow-Origin": "*" },
                        body: JSON.stringify({ error: 'Login failed - additional authentication required.' }),
                    };
                }
            } catch (err) {
                console.log('Login error:', err.message);
                return {
                    statusCode: 401,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ error: err.message }),
                };
            }
        }
    }

    console.log('No matching request type found');
    return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Invalid request - missing required fields or path" }),
    };
};
