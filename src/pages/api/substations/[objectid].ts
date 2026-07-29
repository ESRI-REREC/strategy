import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpdate, handleDelete } from '@/lib/apiHelpers';

const URL = () => process.env.SUBSTATIONS_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const objectid = Number(req.query.objectid);
  if (isNaN(objectid)) return res.status(400).json({ error: 'Invalid objectid' });

  if (req.method === 'PUT') {
    const { substation_id, substation_name, substation_number, substation_type, voltage_transformation_id } =
      req.body as {
        substation_id: number;
        substation_name: string;
        substation_number: string;
        substation_type: string;
        voltage_transformation_id: string;
      };
    if (!substation_name) return res.status(400).json({ error: 'substation_name is required' });
    return handleUpdate(req, res, URL(), objectid, {
      substation_id,
      substation_name,
      substation_number,
      substation_type,
      voltage_transformation_id,
    });
  }
  if (req.method === 'DELETE') return handleDelete(req, res, URL(), objectid);
  return res.status(405).json({ error: 'Method not allowed' });
}
