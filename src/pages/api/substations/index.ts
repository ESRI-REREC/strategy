import type { NextApiRequest, NextApiResponse } from 'next';
import { handleList, handleAdd } from '@/lib/apiHelpers';

const URL = () => process.env.SUBSTATIONS_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleList(req, res, URL());
  if (req.method === 'POST') {
    const { substation_id, substation_name, substation_number, substation_type, voltage_transformation_id } =
      req.body as {
        substation_id: number;
        substation_name: string;
        substation_number: string;
        substation_type: string;
        voltage_transformation_id: string;
      };
    if (!substation_name) return res.status(400).json({ error: 'substation_name is required' });
    return handleAdd(req, res, URL(), {
      substation_id,
      substation_name,
      substation_number,
      substation_type,
      voltage_transformation_id,
    });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
