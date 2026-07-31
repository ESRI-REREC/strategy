import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpdate, handleDelete } from '@/lib/apiHelpers';

const URL = () => process.env.PROJECT_IMPLEMENTATION_STATUSES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const objectid = Number(req.query.objectid);
  if (isNaN(objectid)) return res.status(400).json({ error: 'Invalid objectid' });

  if (req.method === 'PUT') {
    const { project_implementation_status, sort_order } = req.body as {
      project_implementation_status?: string;
      sort_order?: number;
    };
    const attrs: Record<string, unknown> = {};
    if (typeof project_implementation_status === 'string') attrs.project_implementation_status = project_implementation_status;
    if (typeof sort_order === 'number') attrs.sort_order = sort_order;
    if (Object.keys(attrs).length === 0) {
      return res.status(400).json({ error: 'project_implementation_status or sort_order is required' });
    }
    return handleUpdate(req, res, URL(), objectid, attrs);
  }
  if (req.method === 'DELETE') return handleDelete(req, res, URL(), objectid);
  return res.status(405).json({ error: 'Method not allowed' });
}
