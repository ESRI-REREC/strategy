import type { NextApiRequest, NextApiResponse } from 'next';
import { handleList, handleAdd } from '@/lib/apiHelpers';

const URL = () => process.env.VOLTAGE_TRANSFORMATIONS_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleList(req, res, URL());
  if (req.method === 'POST') {
    const { voltage_transformation } = req.body as { voltage_transformation: string };
    if (!voltage_transformation) return res.status(400).json({ error: 'voltage_transformation is required' });
    return handleAdd(req, res, URL(), { voltage_transformation });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
