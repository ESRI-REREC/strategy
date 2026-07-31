import type { NextApiRequest, NextApiResponse } from 'next';
import { queryFeatures } from '@/lib/arcgis';
import { getToken } from '@/lib/apiHelpers';
import type { Facility } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const facilitiesUrl = process.env.FACILITIES_URL;
  if (!facilitiesUrl) return res.status(500).json({ error: 'FACILITIES_URL not configured' });

  try {
    const rawFacilities = await queryFeatures<Facility>(facilitiesUrl, token);

    // Labels are now stored on the layer, so display names come straight from them.
    const facilities = rawFacilities.map((f) => ({
      ...f,
      facility_type_name: f.facility_type ?? null,
      program_type_name: f.program_type ?? null,
    }));

    return res.status(200).json({ facilities });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch facilities' });
  }
}
