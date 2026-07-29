import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpdate, handleDelete } from '@/lib/apiHelpers';

const URL = () => process.env.FACILITY_TYPES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const objectid = Number(req.query.objectid);
  if (isNaN(objectid)) return res.status(400).json({ error: 'Invalid objectid' });

  if (req.method === 'PUT') {
    const { facility_type, facility_category } = req.body as { facility_type: string; facility_category: string };
    if (!facility_type) return res.status(400).json({ error: 'facility_type is required' });
    return handleUpdate(req, res, URL(), objectid, { facility_type, facility_category });
  }
  if (req.method === 'DELETE') return handleDelete(req, res, URL(), objectid);
  return res.status(405).json({ error: 'Method not allowed' });
}
