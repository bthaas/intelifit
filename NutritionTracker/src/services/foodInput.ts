import { Amplify } from 'aws-amplify';
import { post } from 'aws-amplify/api';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import * as BarcodeScanner from 'expo-barcode-scanner';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { FoodItem } from '../types';

export interface FoodInputResult {
  success: boolean;
  foodItem?: FoodItem;
  error?: string;
  confidence?: number;
}

export interface VoiceTranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
}

export class FoodInputService {
  private static instance: FoodInputService;
  private recording: Audio.Recording | null = null;
  private recordingActive = false;

  static getInstance(): FoodInputService {
    if (!FoodInputService.instance) {
      FoodInputService.instance = new FoodInputService();
    }
    return FoodInputService.instance;
  }

  // Camera capture
  async captureFromCamera(): Promise<FoodInputResult> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Camera permission denied' };
      }

                              const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        return await this.processImage(result.assets[0].uri);
      }

      return { success: false, error: 'No image captured' };
    } catch (error) {
      return { success: false, error: `Camera error: ${error}` };
    }
  }

  // Gallery picker
  async pickFromGallery(): Promise<FoodInputResult> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Gallery permission denied' };
      }

                              const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        return await this.processImage(result.assets[0].uri);
      }

      return { success: false, error: 'No image selected' };
    } catch (error) {
      return { success: false, error: `Gallery error: ${error}` };
    }
  }

  // Barcode scanning
  async scanBarcode(): Promise<FoodInputResult> {
    try {
      const { status } = await BarcodeScanner.requestPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Camera permission denied for barcode scanning' };
      }

      // For now, return a mock barcode result
      // In a real implementation, you'd use the actual barcode scanner
      return await this.processBarcode('123456789');
    } catch (error) {
      return { success: false, error: `Barcode scanning error: ${error}` };
    }
  }

  // Voice transcription
  async startVoiceRecording(): Promise<VoiceTranscriptionResult> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Microphone permission denied' };
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      this.recording = new Audio.Recording();
      await this.recording.startAsync();
      this.recordingActive = true;

      return { success: true };
    } catch (error) {
      return { success: false, error: `Recording error: ${error}` };
    }
  }

  async stopVoiceRecording(): Promise<VoiceTranscriptionResult> {
    try {
      if (!this.recording || !this.recordingActive) {
        return { success: false, error: 'No active recording' };
      }

      await this.recording.stopAndUnloadAsync();
      this.recordingActive = false;

      const uri = this.recording.getURI();
      if (!uri) {
        return { success: false, error: 'No recording URI' };
      }

      // Convert audio to text using your Lambda function
      const transcription = await this.transcribeAudio(uri);
      this.recording = null;

      return transcription;
    } catch (error) {
      return { success: false, error: `Stop recording error: ${error}` };
    }
  }

  // Text input processing
  async processTextInput(text: string): Promise<FoodInputResult> {
    if (!text.trim()) {
      return { success: false, error: 'Input is empty' };
    }
    try {
      const result = await this.callFoodTranscriptionLambda({
        inputType: 'text',
        content: text,
      });

      return this.parseLambdaResponse(result);
    } catch (error) {
      return { success: false, error: `Text processing error: ${error}` };
    }
  }

  // Private methods
  private async processImage(imageUri: string): Promise<FoodInputResult> {
    try {
      // Convert image to base64 or upload to S3
      const base64Image = await this.imageToBase64(imageUri);
      
      const result = await this.callFoodTranscriptionLambda({
        inputType: 'image',
        content: base64Image,
      });

      return this.parseLambdaResponse(result);
    } catch (error) {
      return { success: false, error: `Image processing error: ${error}` };
    }
  }

  private async processBarcode(barcodeData: string): Promise<FoodInputResult> {
    try {
      const result = await this.callFoodTranscriptionLambda({
        inputType: 'barcode',
        content: barcodeData,
      });

      return this.parseLambdaResponse(result);
    } catch (error) {
      return { success: false, error: `Barcode processing error: ${error}` };
    }
  }

  private async transcribeAudio(audioUri: string): Promise<VoiceTranscriptionResult> {
    try {
      const base64Audio = await this.audioToBase64(audioUri);
      
      const result = await this.callFoodTranscriptionLambda({
        inputType: 'audio',
        content: base64Audio,
      });

      if (result.success && result.transcription) {
        return { success: true, text: result.transcription };
      }

      return { success: false, error: 'Failed to transcribe audio' };
    } catch (error) {
      return { success: false, error: `Audio transcription error: ${error}` };
    }
  }

  private async callFoodTranscriptionLambda(payload: {
    inputType: 'text' | 'image' | 'audio' | 'barcode';
    content: string;
  }): Promise<any> {
    try {
      console.log('Calling Lambda with payload:', JSON.stringify(payload, null, 2));

      let body = {};
      if (payload.inputType === 'text' || payload.inputType === 'audio') {
        body = { transcription: payload.content };
      } else if (payload.inputType === 'image') {
        body = { base64Image: payload.content };
      } else {
        // Handle barcode or other types if necessary
        body = { content: payload.content };
      }

      const restOperation = post({
        apiName: 'api843872b6',
        path: '/transcribe',
        options: {
          body,
        },
      });

      const response = await restOperation.response;
      
      console.log('Lambda response status:', response.statusCode);
      const responseBody = await response.body.json();
      console.log('Lambda response body:', JSON.stringify(responseBody, null, 2));

      return responseBody;
    } catch (error) {
        console.error('Lambda API error:', error);
        
        // Handle different types of errors
        if (error && typeof error === 'object' && 'response' in error) {
            try {
                const errorResponse = (error as any).response;
                if (errorResponse && errorResponse.body && typeof errorResponse.body.json === 'function') {
                    const errorBody = await errorResponse.body.json();
                    console.error('Lambda error details:', errorBody);
                    return { success: false, error: 'Lambda API call failed', details: errorBody };
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
            }
        }
        
        // Fallback error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Lambda API call failed: ${errorMessage}` };
    }
  }

  private parseLambdaResponse(response: any): FoodInputResult {
    try {
      if (!response || !response.items || response.items.length === 0) {
        return { success: false, error: response?.debug_info?.error || 'No items found in response' };
      }

      // For simplicity, we'll just take the first item
      const item = response.items[0];

      const foodItem: FoodItem = {
        id: `custom-${Date.now()}`,
        name: item.name || 'Unknown Food',
        brand: item.brand || null,
        category: item.category || 'other',
        barcode: undefined,
        imageUrl: undefined,
        isCustom: true,
        nutritionPer100g: {
          calories: item.calories || 0,
          protein: parseFloat(item.protein) || 0,
          carbs: parseFloat(item.carbs) || 0,
          fat: parseFloat(item.fat) || 0,
          fiber: parseFloat(item.fiber) || 0,
          sugar: parseFloat(item.sugar) || 0,
          sodium: parseFloat(item.sodium) || 0, 
          cholesterol: 0,
        },
        servingSizes: [
          {
            id: '1',
            name: item.serving_size || '1 serving',
            weight: 100, // Defaulting to 100g, adjust as needed
            unit: 'g',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        success: true,
        foodItem,
        confidence: 0.9, // Defaulting confidence
      };
    } catch (error) {
      console.error('Response parsing error:', error);
      return { success: false, error: `Response parsing error: ${error}` };
    }
  }

  private async imageToBase64(uri: string): Promise<string> {
    try {
      // First, resize and compress the image to make it suitable for OpenAI API
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          // Resize to max 1024px on the larger side to keep file size manageable
          { resize: { width: 1024 } }
        ],
        {
          compress: 0.7, // Compress to 70% quality
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true, // Get base64 directly
        }
      );

      if (!manipulatedImage.base64) {
        throw new Error('Failed to convert image to base64');
      }

      // Return the base64 string (without data:image/jpeg;base64, prefix)
      return manipulatedImage.base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error(`Image conversion failed: ${error}`);
    }
  }

  private async audioToBase64(uri: string): Promise<string> {
    // This is a placeholder
    return 'base64_placeholder_string';
  }

  // Utility methods
  isRecording(): boolean {
    return this.recordingActive;
  }

  async speakText(text: string): Promise<void> {
    try {
      await Speech.speak(text, {
        language: 'en',
        pitch: 1,
        rate: 0.9,
        volume: 1.0,
      });
    } catch (error) {
      console.error('Speech error:', error);
    }
  }
}

export const foodInputService = FoodInputService.getInstance();
