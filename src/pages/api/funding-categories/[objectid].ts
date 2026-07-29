import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpdate, handleDelete } from '@/lib/apiHelpers';

const URL = () => process.env.FUNDING_CATEGORIES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const objectid = Number(req.query.objectid);
  if (isNaN(objectid)) return res.status(400).json({ error: 'Invalid objectid' });

  if (req.method === 'PUT') {
    const { funding_category, funding_type } = req.body as { funding_category: string; funding_type: string };
    if (!funding_category) return res.status(400).json({ error: 'funding_category is required' });
    return handleUpdate(req, res, URL(), objectid, { funding_category, funding_type });
  }
  if (req.method === 'DELETE') return handleDelete(req, res, URL(), objectid);
  return res.status(405).json({ error: 'Method not allowed' });
}
