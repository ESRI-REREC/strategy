import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpdate, handleDelete } from '@/lib/apiHelpers';

const URL = () => process.env.PROGRAM_TYPES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const objectid = Number(req.query.objectid);
  if (isNaN(objectid)) return res.status(400).json({ error: 'Invalid objectid' });

  if (req.method === 'PUT') {
    const { program_type } = req.body as { program_type: string };
    if (!program_type) return res.status(400).json({ error: 'program_type is required' });
    return handleUpdate(req, res, URL(), objectid, { program_type });
  }
  if (req.method === 'DELETE') return handleDelete(req, res, URL(), objectid);
  return res.status(405).json({ error: 'Method not allowed' });
}
