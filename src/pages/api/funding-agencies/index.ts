import type { NextApiRequest, NextApiResponse } from 'next';
import { handleList, handleAdd } from '@/lib/apiHelpers';

const URL = () => process.env.FUNDING_AGENCIES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleList(req, res, URL());
  if (req.method === 'POST') {
    const { funding_agency } = req.body as { funding_agency: string };
    if (!funding_agency) return res.status(400).json({ error: 'funding_agency is required' });
    return handleAdd(req, res, URL(), { funding_agency });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
