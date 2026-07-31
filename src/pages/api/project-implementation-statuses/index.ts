import type { NextApiRequest, NextApiResponse } from 'next';
import { handleList, handleAdd } from '@/lib/apiHelpers';

const URL = () => process.env.PROJECT_IMPLEMENTATION_STATUSES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleList(req, res, URL());
  if (req.method === 'POST') {
    const { project_implementation_status, sort_order } = req.body as {
      project_implementation_status: string;
      sort_order?: number;
    };
    if (!project_implementation_status) return res.status(400).json({ error: 'project_implementation_status is required' });
    const attrs: Record<string, unknown> = { project_implementation_status };
    if (typeof sort_order === 'number') attrs.sort_order = sort_order;
    return handleAdd(req, res, URL(), attrs);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
