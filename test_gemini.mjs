import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.split(',')[0]);

async function run() {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash'
  });

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: 'I need a car' }] },
      { role: 'model', parts: [{ text: JSON.stringify({ ui_type: 'intake_questionnaire', category: 'car', key_attributes: [{name:'use_case', question:'Use?'}, {name:'budget', question:'Budget?'}] }) }] }
    ],
    generationConfig: {
      maxOutputTokens: 1500,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          ui_type: { type: 'string' },
          text: { type: 'string' },
          allow_skip: { type: 'boolean' }
        }
      }
    }
  });

  try {
    const res = await chat.sendMessage('use case: work, budget: 50000-70000');
    console.log('SUCCESS:', res.response.text());
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}

run();
