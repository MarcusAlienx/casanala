// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { answerQuestionsChatbot } from '@/ai/flows/answer-questions-chatbot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, menuItems, userLocation } = body; // Extract data from request body

    if (!question || !menuItems) {
      return NextResponse.json({ error: 'Missing question or menuItems in request body' }, { status: 400 });
    }

    // Call the server-side Genkit flow function
    const result = await answerQuestionsChatbot({
      question: question,
      menuItems: menuItems,
      userLocation: userLocation // Pass location if available
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in /api/chat:', error);
    // Ensure a proper JSON response even in case of unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Failed to process chat message', details: errorMessage }, { status: 500 });
  }
}
