import { Amplify, API } from 'aws-amplify';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import * as BarcodeScanner from 'expo-barcode-scanner';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
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
        mediaTypes: 'Images' as any,
        quality: 0.8,
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
        mediaTypes: 'Images' as any,
        quality: 0.8,
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
      const response = await API.post('foodTranscriptionAPI', '/transcribe', {
        body: payload,
      });
      return response;
    } catch (error) {
      console.error('Lambda API error:', error);
      if (error.response) {
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      return { success: false, error: 'Lambda API call failed' };
    }
  }

  private parseLambdaResponse(response: any): FoodInputResult {
    try {
      if (!response || !response.success) {
        return { success: false, error: response?.error || 'Unknown error from Lambda' };
      }

      const foodItem: FoodItem = {
        id: `custom-${Date.now()}`,
        name: response.foodName || 'Unknown Food',
        brand: response.brand || null,
        category: response.category || 'other',
        barcode: response.barcode || null,
        imageUrl: response.imageUrl || undefined,
        isCustom: true,
        nutritionPer100g: {
          calories: response.nutrition?.calories || 0,
          protein: response.nutrition?.protein || 0,
          carbs: response.nutrition?.carbs || 0,
          fat: response.nutrition?.fat || 0,
          fiber: response.nutrition?.fiber || 0,
          sugar: response.nutrition?.sugar || 0,
          sodium: response.nutrition?.sodium || 0,
          cholesterol: response.nutrition?.cholesterol || 0,
        },
        servingSizes: [
          {
            id: '1',
            name: '100g',
            weight: 100,
            unit: 'g',
          },
          {
            id: '2',
            name: '1 serving',
            weight: response.servingSize || 100,
            unit: 'g',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        success: true,
        foodItem,
        confidence: response.confidence || 0.8,
      };
    } catch (error) {
      return { success: false, error: `Response parsing error: ${error}` };
    }
  }

  private async imageToBase64(uri: string): Promise<string> {
    // Implementation to convert image to base64
    // This is a placeholder - you'll need to implement actual conversion
    return 'base64_placeholder';
  }

  private async audioToBase64(uri: string): Promise<string> {
    // Implementation to convert audio to base64
    // This is a placeholder - you'll need to implement actual conversion
    return 'base64_placeholder';
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
