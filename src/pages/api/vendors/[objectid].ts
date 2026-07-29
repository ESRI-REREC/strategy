import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpdate, handleDelete } from '@/lib/apiHelpers';

const URL = () => process.env.VENDORS_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const objectid = Number(req.query.objectid);
  if (isNaN(objectid)) return res.status(400).json({ error: 'Invalid objectid' });

  if (req.method === 'PUT') {
    const { vendor_name, vendor_email, vendor_phone_number } = req.body as {
      vendor_name: string;
      vendor_email: string;
      vendor_phone_number: string;
    };
    if (!vendor_name) return res.status(400).json({ error: 'vendor_name is required' });
    return handleUpdate(req, res, URL(), objectid, { vendor_name, vendor_email, vendor_phone_number });
  }
  if (req.method === 'DELETE') return handleDelete(req, res, URL(), objectid);
  return res.status(405).json({ error: 'Method not allowed' });
}
