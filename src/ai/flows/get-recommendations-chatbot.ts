'use server';
/**
 * @fileOverview AI chatbot flow that provides personalized food recommendations based on user preferences.
 *
 * - getRecommendations - A function that returns personalized food recommendations.
 * - GetRecommendationsInput - The input type for the getRecommendations function.
 * - GetRecommendationsOutput - The return type for the getRecommendations function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {FoodItem, getMenu, Location} from '@/services/uber-eats';

const GetRecommendationsInputSchema = z.object({
  dietaryRestrictions: z
    .string()
    .describe('Any dietary restrictions the user has (e.g., vegetarian, gluten-free).')
    .optional(),
  preferences: z
    .string()
    .describe('The user food preferences (e.g., spicy, savory, sweet).')
    .optional(),
  pastOrders: z.string().describe('The user past orders, as a string.').optional(),
  userLocation: z
    .object({
      latitude: z.number().describe('The latitude of the user location.'),
      longitude: z.number().describe('The longitude of the user location.'),
    })
    .optional(),
});
export type GetRecommendationsInput = z.infer<typeof GetRecommendationsInputSchema>;

const GetRecommendationsOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of food item recommendations.'),
});
export type GetRecommendationsOutput = z.infer<typeof GetRecommendationsOutputSchema>;

export async function getRecommendations(input: GetRecommendationsInput): Promise<GetRecommendationsOutput> {
  return getRecommendationsFlow(input);
}

const getMenuTool = ai.defineTool({
  name: 'getMenu',
  description: 'Retrieves the menu for a given restaurant.',
  inputSchema: z.object({
    restaurantId: z.string().describe('The ID of the restaurant.'),
  }),
  outputSchema: z.array(z.object({
    name: z.string(),
    description: z.string(),
    price: z.number()
  })),
},
async (input) => {
  const menu = await getMenu(input.restaurantId);
  return menu.items;
}
);

const shouldIncludeLocation = ai.defineTool({
  name: 'shouldIncludeLocation',
  description: 'Decides whether to include user location in recommendations.',
  inputSchema: z.object({
    question: z.string().describe('The user question.'),
  }),
  outputSchema: z.boolean().describe('Whether to include location or not'),
},
async (input) => {
  return input.question.toLowerCase().includes('location');
}
);


const prompt = ai.definePrompt({
  name: 'getRecommendationsPrompt',
  tools: [getMenuTool, shouldIncludeLocation],
  input: {
    schema: z.object({
      dietaryRestrictions: z
        .string()
        .describe('Any dietary restrictions the user has (e.g., vegetarian, gluten-free).')
        .optional(),
      preferences: z
        .string()
        .describe('The user food preferences (e.g., spicy, savory, sweet).')
        .optional(),
      pastOrders: z.string().describe('The user past orders, as a string.').optional(),
      userLocation: z
        .object({
          latitude: z.number().describe('The latitude of the user location.'),
          longitude: z.number().describe('The longitude of the user location.'),
        })
        .optional(),
      menu: z.array(z.object({
        name: z.string(),
        description: z.string(),
        price: z.number()
      })).describe('The restaurant menu'),
      includeLocation: z.boolean().describe('Whether to include the user location in the recommendations.'),
    }),
  },
  output: {
    schema: z.object({
      recommendations: z.array(z.string()).describe('A list of food item recommendations.'),
    }),
  },
  prompt: `You are a helpful AI chatbot that provides personalized food recommendations from the restaurant menu.

  The menu is:
  {{#each menu}}
  - {{name}}: {{description}} (${{price}})
  {{/each}}

  {{#if dietaryRestrictions }}The user has the following dietary restrictions: {{{dietaryRestrictions}}}.{{/if}}
  {{#if preferences }}The user has the following food preferences: {{{preferences}}}.{{/if}}
  {{#if pastOrders }}The user has the following past orders: {{{pastOrders}}}.{{/if}}
  {{#if includeLocation }}The user location is: Latitude: {{{userLocation.latitude}}}, Longitude: {{{userLocation.longitude}}}.{{/if}}

  Recommend some dishes from the menu, considering the user's dietary restrictions, preferences, past orders, and location (if available).

  The recommendations should be a list of food item names.
  Make sure to only suggest items that are available in the menu.

  Output only the list of recommended dishes, each on a new line.
  `,
});

const getRecommendationsFlow = ai.defineFlow<
  typeof GetRecommendationsInputSchema,
  typeof GetRecommendationsOutputSchema
>(
  {
    name: 'getRecommendationsFlow',
    inputSchema: GetRecommendationsInputSchema,
    outputSchema: GetRecommendationsOutputSchema,
  },
  async input => {
    try {
      const menuItems = await getMenuTool({
        restaurantId: 'casa-nala',
      });

      let includeLocation = false;
      try {
        includeLocation = await shouldIncludeLocation({
          question: JSON.stringify(input),
        });
      } catch (error) {
        console.error("Error in shouldIncludeLocation tool:", error);
        // Handle the error gracefully, e.g., log it and set a default value
        includeLocation = false; // Default to not including location
      }


      const {output} = await prompt({
        ...input,
        menu: menuItems,
        includeLocation: includeLocation,
      });
      return output!;
    } catch (e: any) {
      console.error('Error in getRecommendationsFlow:', e);
      throw e;
    }
  }
);
