import { catalog } from '../../lib/documents.js';

export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  response.status(200).json({ samples: catalog(), parserReady: Boolean(process.env.GEMINI_API_KEY) });
}
