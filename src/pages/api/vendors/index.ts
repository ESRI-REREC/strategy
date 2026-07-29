import type { NextApiRequest, NextApiResponse } from 'next';
import { handleList, handleAdd } from '@/lib/apiHelpers';

const URL = () => process.env.VENDORS_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleList(req, res, URL());
  if (req.method === 'POST') {
    const { vendor_name, vendor_email, vendor_phone_number } = req.body as {
      vendor_name: string;
      vendor_email: string;
      vendor_phone_number: string;
    };
    if (!vendor_name) return res.status(400).json({ error: 'vendor_name is required' });
    return handleAdd(req, res, URL(), { vendor_name, vendor_email, vendor_phone_number });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
