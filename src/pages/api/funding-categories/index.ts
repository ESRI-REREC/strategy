import type { NextApiRequest, NextApiResponse } from 'next';
import { handleList, handleAdd } from '@/lib/apiHelpers';

const URL = () => process.env.FUNDING_CATEGORIES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleList(req, res, URL());
  if (req.method === 'POST') {
    const { funding_category, funding_type } = req.body as { funding_category: string; funding_type: string };
    if (!funding_category) return res.status(400).json({ error: 'funding_category is required' });
    return handleAdd(req, res, URL(), { funding_category, funding_type });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
