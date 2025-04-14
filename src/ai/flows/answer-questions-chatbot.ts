// 'use server'
'use server';
/**
 * @fileOverview An AI chatbot that answers customer questions about menu items, ingredients, and preparation methods.
 *
 * - answerQuestionsChatbot - A function that handles the chatbot interaction.
 * - AnswerQuestionsChatbotInput - The input type for the answerQuestionsChatbot function.
 * - AnswerQuestionsChatbotOutput - The return type for the answerQuestionsChatbot function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getMenu, FoodItem} from '@/services/uber-eats';

const AnswerQuestionsChatbotInputSchema = z.object({
  question: z.string().describe('The question from the customer.'),
  restaurantId: z.string().describe('The ID of the restaurant.'),
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
  // TODO: Implement this by calling a geolocation API.
  return `User location is: Latitude ${input.latitude}, Longitude ${input.longitude}`;
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
  prompt: `You are a chatbot for CasaNala, a Mexican restaurant. Use the menu information to answer the customer question. If the user provides location information, decide whether to use it to inform the answer.

Menu:
{{menu}}

Question: {{{question}}}

{{#if locationInfo}}
Location Information: {{{locationInfo}}}
{{/if}}

Answer:`, // Updated Handlebars syntax
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
    const menu = await getMenu(input.restaurantId);
    const menuString = menu.items.map(item => `${item.name}: ${item.description} ($${item.price})`).join('\n');

    let locationInfo: string | undefined = undefined;
    if (input.userLocation) {
      const {latitude, longitude} = input.userLocation;
      locationInfo = await getLocationInfo({
        latitude: latitude,
        longitude: longitude,
      });
    }

    const {output} = await prompt({
      question: input.question,
      menu: menuString,
      locationInfo: locationInfo,
    });
    return output!;
  }
);

