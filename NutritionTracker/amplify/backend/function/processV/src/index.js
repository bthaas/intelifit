/*
Use the following code to retrieve configured secrets from SSM:

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["OPENAI_API_KEY"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/

const aws = require('aws-sdk');
const OpenAI = require('openai');

const cognito = new aws.CognitoIdentityServiceProvider();

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    // Log the full event for debugging
    console.log('Full event:', JSON.stringify(event, null, 2));

    // Defensive body parsing
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

    // Try all possible locations for the path
    const path =
        event.resource ||
        event.rawPath ||
        event.path ||
        (event.requestContext && event.requestContext.http && event.requestContext.http.path) ||
        (event.requestContext && event.requestContext.resourcePath);
    console.log('Lambda resolved path:', path);

    // All registration and verification logic removed.
    // Only OpenAI or other logic should remain here.

    // OpenAI or other logic
    try {
        // Get the OpenAI API key from SSM Parameter Store
        const ssm = new aws.SSM();
        const { Parameters } = await ssm
          .getParameters({
            Names: [process.env.OPENAI_API_KEY],
            WithDecryption: true,
          })
          .promise();

        const apiKey = Parameters[0].Value;
        const openai = new OpenAI({ apiKey });

        // Get the input from the event body
        const { transcription, base64Image } = JSON.parse(event.body);
        
        if (!transcription && !base64Image) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*", // Required for CORS
                },
                body: JSON.stringify({ message: 'No transcription or image provided.' }),
            };
        }

        let completion;
        
        // Handle image analysis
        if (base64Image) {
            completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional nutritionist and food recognition expert. Analyze food images accurately and provide detailed nutritional information. IMPORTANT: Return ONLY a valid JSON object with no markdown formatting."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this food image and identify all food items visible. For each food item, provide:
- Accurate food name (be specific, e.g. "Goldfish Crackers" not "unnamed food")
- Most specific and culturally accurate name possible
- Realistic serving size based on what you see
- Brand name if recognizable, otherwise use "Generic"
- Detailed nutritional information
- Categorize each food into one of the following categories: 
    Sandwiches & Wraps
    Seafood
    Pasta & Noodles
    Soups & Stews
    Salads
    Grain Bowls
    Pizza & Flatbreads
    Curries & Saucy Dishes
    Rice & Stir-Fry Dishes
    Meat-Based Entrées
    Vegetarian/Vegan Main Dishes
    Casseroles & Bakes
    Appetizers & Tapas
    Breads & Baked Goods
    Savory Snacks
    Sweet Snacks
    Cakes & Pies
    Cookies & Bars
    Frozen Desserts
    Custards & Puddings
    Sweet Breads & Pastries
    Coffee & Tea
    Smoothies & Juices
    Soft Drinks & Flavored Waters
    Alcoholic Drinks
    Dairy & Eggs
    Breakfast Foods
    Fast Food & Takeout
    Cultural / Regional Foods
    Raw Foods


Return as JSON in this exact format:
{
  "items": [
    {
      "name": "specific food name",
      "brand": "brand name or Generic",
      "category": "category from the list above",
      "serving_size": "realistic amount (e.g., 30 pieces, 1 cup, 1 slice)",
      "calories": number,
      "protein": "Xg",
      "carbs": "Xg", 
      "fat": "Xg",
      "fiber": "Xg",
      "sugar": "Xg",
      "sodium": "Xmg"
    }
  ]
}`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1500
            });
        } 
        // Handle text transcription
        else if (transcription) {
            completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a professional nutritionist. For each food item mentioned, 
                        provide detailed nutritional information. IMPORTANT: Your response must be 
                        only the JSON object, with no extra text or markdown formatting. When 
                        identifying food items, use the most specific and culturally accurate name possible`
                    },
                    {
                        role: "user",
                        content: `Analyze these food items: ${transcription}

Return nutritional information as a single JSON object in this exact format:
{
  "items": [
    {
      "name": "specific food name", 
      "brand": "Generic",
      "serving_size": "standard serving",
      "calories": number,
      "protein": "Xg",
      "carbs": "Xg",
      "fat": "Xg", 
      "fiber": "Xg",
      "sugar": "Xg",
      "sodium": "Xmg"
    }
  ]
}`
                    }
                ],
            });
        }
        
        let responseBody = completion.choices[0].message.content;
        
        console.log('Raw OpenAI Response:', responseBody);
        
        // More aggressive cleaning to remove all markdown formatting
        responseBody = responseBody
            .replace(/```json/g, '')  // Remove ```json markers
            .replace(/```/g, '')      // Remove ``` markers
            .replace(/`/g, '')        // Remove individual backticks
            .replace(/\*/g, '')       // Remove asterisks
            .replace(/#+/g, '')       // Remove hash symbols (headers)
            .replace(/\n+/g, '\n')    // Normalize line breaks
            .trim();                  // Remove leading/trailing whitespace
            
        console.log('Cleaned Response:', responseBody);
            
        // Try to extract JSON if there's still explanatory text
        const jsonMatch = responseBody.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            responseBody = jsonMatch[0];
            console.log('Extracted JSON:', responseBody);
        }
        
        // Try to parse and validate the JSON
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseBody);
            console.log('Parsed Response:', JSON.stringify(parsedResponse, null, 2));
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Failed to parse responseBody:', responseBody);
            
            // If JSON parsing fails, create a fallback response
            parsedResponse = {
                items: [{
                    name: "Unknown Food Item",
                    brand: "Generic",
                    serving_size: "1 serving",
                    calories: 100,
                    protein: "2g",
                    carbs: "15g",
                    fat: "3g",
                    fiber: "1g",
                    sugar: "2g",
                    sodium: "150mg"
                }],
                debug_info: {
                    raw_response: responseBody,
                    error: "Failed to parse OpenAI response as JSON"
                }
            };
        }
        
        // Ensure the response has the expected structure
        if (!parsedResponse.items || !Array.isArray(parsedResponse.items) || parsedResponse.items.length === 0) {
            console.log('Invalid response structure, creating fallback');
            parsedResponse = {
                items: [{
                    name: "Unidentified Food",
                    brand: "Generic", 
                    serving_size: "1 serving",
                    calories: 150,
                    protein: "3g",
                    carbs: "20g",
                    fat: "5g",
                    fiber: "2g",
                    sugar: "3g",
                    sodium: "200mg"
                }],
                debug_info: {
                    raw_response: responseBody,
                    original_structure: parsedResponse,
                    error: "Response missing items array"
                }
            };
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Required for CORS
                "Content-Type": "application/json"
            },
            body: JSON.stringify(parsedResponse),
        };
    } catch (error) {
        console.error("Error calling OpenAI:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        let errorMessage = 'Error processing your request with OpenAI.';
        
        // Handle specific OpenAI errors
        if (error.status === 401) {
            errorMessage = 'Invalid OpenAI API key. Please check your API key.';
        } else if (error.status === 429) {
            errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
        } else if (error.status === 400) {
            errorMessage = 'Invalid request to OpenAI API. The image might be too large.';
        }
        
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ 
                message: errorMessage,
                details: error.message 
            }),
        };
    }
};
