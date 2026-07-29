import type { NextApiRequest, NextApiResponse } from 'next';
import { handleList, handleAdd } from '@/lib/apiHelpers';

const URL = () => process.env.FACILITY_CATEGORIES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleList(req, res, URL());
  if (req.method === 'POST') {
    const { facility_category } = req.body as { facility_category: string };
    if (!facility_category) return res.status(400).json({ error: 'facility_category is required' });
    return handleAdd(req, res, URL(), { facility_category });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
