import { config } from '../config/env';

export interface MarketScheduleRequest {
  prompt: string;
  month: number;
  year: number;
  totalMembers: number;
  memberNames: string[];
  existingSchedule?: string[];
}

export interface MarketScheduleResponse {
  schedule: { date: string; member: string }[];
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

    const { prompt, month, year, totalMembers, memberNames, existingSchedule } = request;

    // Create a comprehensive prompt for the AI
    const systemPrompt = `You are an AI assistant helping mess managers create fair and efficient market/rest day schedules.

Context:
- Month: ${month}/${year}
- Members: ${memberNames.join(', ')}
- Total members: ${totalMembers}
- Each member should get approximately equal number of rest days
- Rest days should be distributed fairly throughout the month
- Consider weekends and holidays for better scheduling
${existingSchedule ? `- Existing schedule: ${existingSchedule.join(', ')}` : ''}

User requirements: ${prompt}

Please provide:
1. A list of rest day assignments with member names and dates
2. A brief explanation of the schedule logic
3. Confidence score (0-100) of how well this meets the requirements

Format your response as JSON:
{
  "schedule": [{"date": "01/12/2024", "member": "John Doe"}, {"date": "08/12/2024", "member": "Jane Smith"}, ...],
  "explanation": "Brief explanation here",
  "confidence": 85
}`;

    // Generate a mock schedule with random date assignment
    const mockSchedule: { date: string; member: string }[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    // Generate a simple schedule based on total members
    const restDaysPerMember = Math.floor(daysInMonth / totalMembers);

    // Create a list of all possible dates
    const allDates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      allDates.push(`${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`);
    }

    // Shuffle the dates array for randomness
    for (let i = allDates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allDates[i], allDates[j]] = [allDates[j], allDates[i]];
    }

    // Assign dates to members
    let dateIndex = 0;
    for (let i = 0; i < totalMembers; i++) {
      const memberName = memberNames[i] || `Member ${i + 1}`;
      for (let j = 0; j < restDaysPerMember && dateIndex < allDates.length; j++) {
        mockSchedule.push({
          date: allDates[dateIndex],
          member: memberName,
        });
        dateIndex++;
      }
    }

    return {
      schedule: mockSchedule,
      explanation: `Generated schedule distributes ${restDaysPerMember} rest days per member throughout the month of ${month}/${year}`,
      confidence: 85,
    };
  }

  static async generateMealPlan(prompt: string): Promise<string> {
    // Return a mock meal plan for now
    return `Based on your request: "${prompt}"

**Weekly Meal Plan for Mess Management**

**Monday:**
- Breakfast: Oatmeal with fruits and nuts
- Lunch: Chicken curry with rice and vegetables
- Dinner: Vegetable stir-fry with noodles

**Tuesday:**
- Breakfast: Toast with eggs and avocado
- Lunch: Lentil soup with bread
- Dinner: Grilled fish with salad

**Wednesday:**
- Breakfast: Yogurt with granola
- Lunch: Beef stew with potatoes
- Dinner: Pasta with tomato sauce

**Thursday:**
- Breakfast: Pancakes with syrup
- Lunch: Vegetable biryani
- Dinner: Chicken salad

**Friday:**
- Breakfast: Cereal with milk
- Lunch: Fish curry with rice
- Dinner: Vegetable curry

**Saturday:**
- Breakfast: Eggs and bacon
- Lunch: Pizza (homemade)
- Dinner: Beef burgers

**Sunday:**
- Breakfast: Waffles
- Lunch: Roast chicken with vegetables
- Dinner: Soup and sandwiches

*Note: This is a sample meal plan. Adjust portions and ingredients based on dietary needs and preferences. Consult with a nutritionist for balanced nutrition.*`;
  }
}
