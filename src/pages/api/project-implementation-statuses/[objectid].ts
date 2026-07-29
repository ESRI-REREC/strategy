import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpdate, handleDelete } from '@/lib/apiHelpers';

const URL = () => process.env.PROJECT_IMPLEMENTATION_STATUSES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const objectid = Number(req.query.objectid);
  if (isNaN(objectid)) return res.status(400).json({ error: 'Invalid objectid' });

  if (req.method === 'PUT') {
    const { project_implementation_status } = req.body as { project_implementation_status: string };
    if (!project_implementation_status) return res.status(400).json({ error: 'project_implementation_status is required' });
    return handleUpdate(req, res, URL(), objectid, { project_implementation_status });
  }
  if (req.method === 'DELETE') return handleDelete(req, res, URL(), objectid);
  return res.status(405).json({ error: 'Method not allowed' });
}
