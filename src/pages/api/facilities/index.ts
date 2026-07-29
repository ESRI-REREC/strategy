import type { NextApiRequest, NextApiResponse } from 'next';
import { queryFeatures } from '@/lib/arcgis';
import { getToken } from '@/lib/apiHelpers';
import type { Facility } from '@/types';

interface Lookup {
  objectid: number;
  globalid?: string;
  [key: string]: unknown;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const facilitiesUrl = process.env.FACILITIES_URL;
  if (!facilitiesUrl) return res.status(500).json({ error: 'FACILITIES_URL not configured' });

  try {
    const [rawFacilities, facilityTypes, programTypes] = await Promise.all([
      queryFeatures<Facility>(facilitiesUrl, token),
      process.env.FACILITY_TYPES_URL ? queryFeatures<Lookup>(process.env.FACILITY_TYPES_URL, token) : Promise.resolve([]),
      process.env.PROGRAM_TYPES_URL ? queryFeatures<Lookup>(process.env.PROGRAM_TYPES_URL, token) : Promise.resolve([]),
    ]);

    const facilityTypeMap = Object.fromEntries(facilityTypes.map((r) => [r.globalid, r.facility_type as string]));
    const programTypeMap = Object.fromEntries(programTypes.map((r) => [r.globalid, r.program_type as string]));

    const facilities = rawFacilities.map((f) => ({
      ...f,
      facility_type_name: facilityTypeMap[f.facility_type_id] ?? null,
      program_type_name: programTypeMap[f.program_type_id] ?? null,
    }));

    return res.status(200).json({ facilities });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch facilities' });
  }
}
