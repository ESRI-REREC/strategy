import type { NextApiRequest, NextApiResponse } from 'next';
import { handleList, handleAdd } from '@/lib/apiHelpers';

const URL = () => process.env.PROJECT_TYPES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleList(req, res, URL());
  if (req.method === 'POST') {
    const { project_type } = req.body as { project_type: string };
    if (!project_type) return res.status(400).json({ error: 'project_type is required' });
    return handleAdd(req, res, URL(), { project_type });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
