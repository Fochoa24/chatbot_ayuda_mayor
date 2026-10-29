import { handleChat } from '../server/chatHandler.js';

// Función de Vercel: POST /api/chat (duración máxima en vercel.json).
export function POST(request) {
  return handleChat(request);
}
