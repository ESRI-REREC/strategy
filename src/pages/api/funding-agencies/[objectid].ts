import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpdate, handleDelete } from '@/lib/apiHelpers';

const URL = () => process.env.FUNDING_AGENCIES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const objectid = Number(req.query.objectid);
  if (isNaN(objectid)) return res.status(400).json({ error: 'Invalid objectid' });

  if (req.method === 'PUT') {
    const { funding_agency } = req.body as { funding_agency: string };
    if (!funding_agency) return res.status(400).json({ error: 'funding_agency is required' });
    return handleUpdate(req, res, URL(), objectid, { funding_agency });
  }
  if (req.method === 'DELETE') return handleDelete(req, res, URL(), objectid);
  return res.status(405).json({ error: 'Method not allowed' });
}
