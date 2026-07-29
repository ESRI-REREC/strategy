import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from '@/lib/apiHelpers';
import { getFeatureCount } from '@/lib/arcgis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const layers = {
    facilityCategories: process.env.FACILITY_CATEGORIES_URL!,
    facilityTypes: process.env.FACILITY_TYPES_URL!,
    fundingAgencies: process.env.FUNDING_AGENCIES_URL!,
    fundingCategories: process.env.FUNDING_CATEGORIES_URL!,
    projectCycleStatuses: process.env.PROJECT_CYCLE_STATUSES_URL!,
    projectImplementationStatuses: process.env.PROJECT_IMPLEMENTATION_STATUSES_URL!,
    projectInitiatorCategories: process.env.PROJECT_INITIATOR_CATEGORIES_URL!,
    programTypes: process.env.PROGRAM_TYPES_URL!,
    projectTypes: process.env.PROJECT_TYPES_URL!,
    substations: process.env.SUBSTATIONS_URL!,
    vendors: process.env.VENDORS_URL!,
    voltageTransformations: process.env.VOLTAGE_TRANSFORMATIONS_URL!,
  };

  try {
    const entries = await Promise.all(
      Object.entries(layers).map(async ([key, url]) => [key, await getFeatureCount(url, token)])
    );
    return res.status(200).json(Object.fromEntries(entries));
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch counts' });
  }
}
