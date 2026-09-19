import { datasetDraft, getSample } from '../../lib/documents.js';

export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  const entry = getSample(request.query.id);
  if (!entry) {
    response.status(404).json({ error: 'Sample not found.' });
    return;
  }
  response.status(200).json({ draft: datasetDraft(entry), provider: 'dataset' });
}
