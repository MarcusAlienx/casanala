'use server';
/**
 * @fileOverview An AI chatbot that answers customer questions about menu items, ingredients, and preparation methods.
 *
 * - answerQuestionsChatbot - A function that handles the chatbot interaction.
 * - AnswerQuestionsChatbotInput - The input type for the answerQuestionsChatbot function.
 * - AnswerQuestionsChatbotOutput - The return type for the answerQuestionsChatbot function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// Removed: import {getMenu, FoodItem} from '@/services/uber-eats';

// Define the structure of a menu item (matching MenuItemProps from frontend)
const MenuItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
  imageUrl: z.string().optional(),
});

const AnswerQuestionsChatbotInputSchema = z.object({
  question: z.string().describe('The question from the customer.'),
  // Removed restaurantId
  menuItems: z.array(MenuItemSchema).describe('The current list of menu items.'), // Added menuItems input
  userLocation: z
    .object({
      latitude: z.number().describe('The latitude of the user.'),
      longitude: z.number().describe('The longitude of the user.'),
    })
    .optional()
    .describe('The location of the user, if available.'),
});
export type AnswerQuestionsChatbotInput = z.infer<typeof AnswerQuestionsChatbotInputSchema>;

const AnswerQuestionsChatbotOutputSchema = z.object({
  answer: z.string().describe('The answer to the customer question.'),
});
export type AnswerQuestionsChatbotOutput = z.infer<typeof AnswerQuestionsChatbotOutputSchema>;

// This function is intended to be called from a server-side context (like an API route)
export async function answerQuestionsChatbot(
  input: AnswerQuestionsChatbotInput
): Promise<AnswerQuestionsChatbotOutput> {
  return answerQuestionsChatbotFlow(input);
}

const getLocationInfo = ai.defineTool({
  name: 'getLocationInfo',
  description: 'Get the user location information if available.',
  inputSchema: z.object({
    latitude: z.number().describe('The latitude of the user.'),
    longitude: z.number().describe('The longitude of the user.'),
  }),
  outputSchema: z.string(),
},
async input => {
  try {
    // TODO: Implement this by calling a geolocation API.
    return `User location is: Latitude ${input.latitude}, Longitude ${input.longitude}`;
  } catch (error) {
    console.error("Error getting location info:", error);
    return "Location information is not available."; // Provide a default response
  }
}
);

const prompt = ai.definePrompt({
  name: 'answerQuestionsChatbotPrompt',
  input: {
    schema: z.object({
      question: z.string().describe('The question from the customer.'),
      menu: z.string().describe('The menu items of the restaurant.'),
      locationInfo: z.string().optional().describe('The location information of the user, if available.'),
    }),
  },
  output: {
    schema: z.object({
      answer: z.string().describe('The answer to the customer question.'),
    }),
  },
  // Updated prompt instructions
  prompt: `Eres un amigable asistente de chatbot para Casa Nala, un restaurante de comida mexicana. Usa la información del menú proporcionada para responder la pregunta del cliente. Si el usuario proporciona información de ubicación, considera si es relevante para la respuesta (por ejemplo, para preguntas sobre entrega o distancia). Sé conciso y útil.

Menú:
{{menu}}

Pregunta: {{{question}}}

{{#if locationInfo}}
Información de Ubicación: {{{locationInfo}}}
{{/if}}

Respuesta:`, 
  tools: [getLocationInfo],
});

const answerQuestionsChatbotFlow = ai.defineFlow<
  typeof AnswerQuestionsChatbotInputSchema,
  typeof AnswerQuestionsChatbotOutputSchema
>(
  {
    name: 'answerQuestionsChatbotFlow',
    inputSchema: AnswerQuestionsChatbotInputSchema,
    outputSchema: AnswerQuestionsChatbotOutputSchema,
  },
  async input => {
    try {
      // Use the menu passed in the input
      const menuString = input.menuItems.map(item => `${item.name} (${item.category}): ${item.description || ''} ($${item.price.toFixed(2)})`).join('
');

      let locationInfo: string | undefined = undefined;
      // Location logic remains the same
      if (input.userLocation) {
        const {latitude, longitude} = input.userLocation;
        // Note: Tool execution might require specific Genkit setup depending on environment
        try {
          locationInfo = await getLocationInfo({ latitude, longitude });
        } catch (toolError) {
            console.error("Error executing getLocationInfo tool:", toolError);
            locationInfo = "No se pudo obtener la información de ubicación.";
        }
      }

      const {output} = await prompt({
        question: input.question,
        menu: menuString,
        locationInfo: locationInfo,
      });

      if (!output) {
          throw new Error("El modelo no generó una respuesta.");
      }
      return output;
      
    } catch (e: any) {
      console.error('Error en answerQuestionsChatbotFlow:', e);
      // Provide a user-friendly error message
      return { answer: "Lo siento, no pude procesar tu pregunta en este momento." };
    }
  }
);
