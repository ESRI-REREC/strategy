import type { NextApiRequest, NextApiResponse } from 'next';
import { handleList, handleAdd } from '@/lib/apiHelpers';

const URL = () => process.env.PROJECT_INITIATOR_CATEGORIES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleList(req, res, URL());
  if (req.method === 'POST') {
    const { project_initiator_category } = req.body as { project_initiator_category: string };
    if (!project_initiator_category) return res.status(400).json({ error: 'project_initiator_category is required' });
    return handleAdd(req, res, URL(), { project_initiator_category });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
