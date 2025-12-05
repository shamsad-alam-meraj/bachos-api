import { config } from '../config/env';
import { ApiError } from '../utils/errors';

export interface MarketScheduleRequest {
  prompt: string;
  month: number;
  year: number;
  totalMembers: number;
  existingSchedule?: string[];
}

export interface MarketScheduleResponse {
  schedule: string[];
  explanation: string;
  confidence: number;
}

export class AIService {
  private static huggingFaceApiKey = config.huggingface?.apiKey;
  private static huggingFaceUrl = 'https://api-inference.huggingface.co/models';

  static async generateMarketSchedule(
    request: MarketScheduleRequest
  ): Promise<MarketScheduleResponse> {
    if (!this.huggingFaceApiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    const { prompt, month, year, totalMembers, existingSchedule } = request;

    // Create a comprehensive prompt for the AI
    const systemPrompt = `You are an AI assistant helping mess managers create fair and efficient market/rest day schedules.

Context:
- Month: ${month}/${year}
- Total members: ${totalMembers}
- Each member should get approximately equal number of rest days
- Rest days should be distributed fairly throughout the month
- Consider weekends and holidays for better scheduling
${existingSchedule ? `- Existing schedule: ${existingSchedule.join(', ')}` : ''}

User requirements: ${prompt}

Please provide:
1. A list of dates (in DD/MM/YYYY format) for rest days
2. A brief explanation of the schedule logic
3. Confidence score (0-100) of how well this meets the requirements

Format your response as JSON:
{
  "schedule": ["01/12/2024", "08/12/2024", ...],
  "explanation": "Brief explanation here",
  "confidence": 85
}`;

    try {
      const response = await fetch(`${this.huggingFaceUrl}/microsoft/DialoGPT-medium`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.huggingFaceApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: systemPrompt,
          parameters: {
            max_length: 500,
            temperature: 0.7,
            do_sample: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data = (await response.json()) as any;

      // Parse the AI response (this would need to be adapted based on the actual model response)
      // For now, return a mock response
      const mockSchedule: string[] = [];
      const daysInMonth = new Date(year, month, 0).getDate();

      // Generate a simple schedule based on total members
      const restDaysPerMember = Math.floor(daysInMonth / totalMembers);
      let currentDay = 1;

      for (let i = 0; i < totalMembers; i++) {
        for (let j = 0; j < restDaysPerMember; j++) {
          if (currentDay <= daysInMonth) {
            mockSchedule.push(
              `${currentDay.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
            );
            currentDay += totalMembers;
          }
        }
        currentDay = i + 2; // Reset for next member
      }

      return {
        schedule: mockSchedule,
        explanation: `Generated schedule distributes ${restDaysPerMember} rest days per member throughout the month of ${month}/${year}`,
        confidence: 85,
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate market schedule');
    }
  }

  static async generateMealPlan(prompt: string): Promise<string> {
    if (!this.huggingFaceApiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    const systemPrompt = `You are a culinary assistant helping create meal plans for mess management.

User request: ${prompt}

Provide a detailed meal plan with recipes, ingredients, and nutritional information.`;

    try {
      const response = await fetch(`${this.huggingFaceUrl}/microsoft/DialoGPT-medium`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.huggingFaceApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: systemPrompt,
          parameters: {
            max_length: 1000,
            temperature: 0.8,
            do_sample: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data[0]?.generated_text || 'Unable to generate meal plan';
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate meal plan');
    }
  }
}
