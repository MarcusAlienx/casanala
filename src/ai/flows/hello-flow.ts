import { ai } from '@/ai/ai-instance'; // Import the existing AI instance
import { z } from 'genkit';

// Define the helloFlow using the shared AI instance
export const helloFlow = ai.defineFlow(
  'helloFlow',
  async (name: string) => {
    // make a generation request
    const response = await ai.generate({
      prompt: `Hello Gemini, my name is ${name}`,
      model: 'googleai/gemini-1.5-flash', // Use the full model name with provider prefix
    });

    const text = response.text();
    console.log(`Response for ${name}: ${text}`); // Log the output for visibility when run
    return text; // Return the generated text
  },
  {
    inputSchema: z.string(), // Define input schema as a string
    outputSchema: z.string(), // Define output schema as a string
  }
);

// Note: The direct call helloFlow('Marcus') is removed.
// To run this flow, ensure it is imported in src/ai/dev.ts,
// then use the Genkit CLI: genkit flow:run helloFlow '"YourName"'
// Or use the UI via 'npm run genkit:dev'