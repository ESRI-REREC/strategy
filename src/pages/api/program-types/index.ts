import type { NextApiRequest, NextApiResponse } from 'next';
import { handleList, handleAdd } from '@/lib/apiHelpers';

const URL = () => process.env.PROGRAM_TYPES_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleList(req, res, URL());
  if (req.method === 'POST') {
    const { program_type } = req.body as { program_type: string };
    if (!program_type) return res.status(400).json({ error: 'program_type is required' });
    return handleAdd(req, res, URL(), { program_type });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
