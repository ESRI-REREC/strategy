import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpdate, handleDelete } from '@/lib/apiHelpers';

const URL = () => process.env.PROJECT_INITIATOR_CATEGORIES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const objectid = Number(req.query.objectid);
  if (isNaN(objectid)) return res.status(400).json({ error: 'Invalid objectid' });

  if (req.method === 'PUT') {
    const { project_initiator_category } = req.body as { project_initiator_category: string };
    if (!project_initiator_category) return res.status(400).json({ error: 'project_initiator_category is required' });
    return handleUpdate(req, res, URL(), objectid, { project_initiator_category });
  }
  if (req.method === 'DELETE') return handleDelete(req, res, URL(), objectid);
  return res.status(405).json({ error: 'Method not allowed' });
}
