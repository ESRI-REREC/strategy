import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpdate, handleDelete } from '@/lib/apiHelpers';

const URL = () => process.env.VOLTAGE_TRANSFORMATIONS_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const objectid = Number(req.query.objectid);
  if (isNaN(objectid)) return res.status(400).json({ error: 'Invalid objectid' });

  if (req.method === 'PUT') {
    const { voltage_transformation } = req.body as { voltage_transformation: string };
    if (!voltage_transformation) return res.status(400).json({ error: 'voltage_transformation is required' });
    return handleUpdate(req, res, URL(), objectid, { voltage_transformation });
  }
  if (req.method === 'DELETE') return handleDelete(req, res, URL(), objectid);
  return res.status(405).json({ error: 'Method not allowed' });
}
