import type { NextApiRequest, NextApiResponse } from 'next';
import { queryFeatures } from '@/lib/arcgis';
import { getToken } from '@/lib/apiHelpers';

interface Lookup {
  objectid: number;
  globalid?: string;
  [key: string]: unknown;
}

function toOptions(items: Lookup[], labelKey: string) {
  return items
    .filter((r) => r.globalid && r[labelKey])
    .map((r) => ({ value: r.globalid as string, label: r[labelKey] as string }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [
      projectTypes,
      fundingAgencies,
      fundingCategories,
      projectImplementationStatuses,
      projectCycleStatuses,
      projectInitiatorCategories,
      facilityTypes,
      programTypes,
      substations,
      vendors,
    ] = await Promise.all([
      process.env.PROJECT_TYPES_URL ? queryFeatures<Lookup>(process.env.PROJECT_TYPES_URL, token) : Promise.resolve([]),
      process.env.FUNDING_AGENCIES_URL ? queryFeatures<Lookup>(process.env.FUNDING_AGENCIES_URL, token) : Promise.resolve([]),
      process.env.FUNDING_CATEGORIES_URL ? queryFeatures<Lookup>(process.env.FUNDING_CATEGORIES_URL, token) : Promise.resolve([]),
      process.env.PROJECT_IMPLEMENTATION_STATUSES_URL ? queryFeatures<Lookup>(process.env.PROJECT_IMPLEMENTATION_STATUSES_URL, token) : Promise.resolve([]),
      process.env.PROJECT_CYCLE_STATUSES_URL ? queryFeatures<Lookup>(process.env.PROJECT_CYCLE_STATUSES_URL, token) : Promise.resolve([]),
      process.env.PROJECT_INITIATOR_CATEGORIES_URL ? queryFeatures<Lookup>(process.env.PROJECT_INITIATOR_CATEGORIES_URL, token) : Promise.resolve([]),
      process.env.FACILITY_TYPES_URL ? queryFeatures<Lookup>(process.env.FACILITY_TYPES_URL, token) : Promise.resolve([]),
      process.env.PROGRAM_TYPES_URL ? queryFeatures<Lookup>(process.env.PROGRAM_TYPES_URL, token) : Promise.resolve([]),
      process.env.SUBSTATIONS_URL ? queryFeatures<Lookup>(process.env.SUBSTATIONS_URL, token) : Promise.resolve([]),
      process.env.VENDORS_URL ? queryFeatures<Lookup>(process.env.VENDORS_URL, token) : Promise.resolve([]),
    ]);

    return res.status(200).json({
      projectTypes: toOptions(projectTypes, 'project_type'),
      fundingAgencies: toOptions(fundingAgencies, 'funding_agency'),
      fundingCategories: toOptions(fundingCategories, 'funding_category'),
      projectImplementationStatuses: toOptions(projectImplementationStatuses, 'project_implementation_status'),
      projectCycleStatuses: toOptions(projectCycleStatuses, 'project_cycle_status'),
      projectInitiatorCategories: toOptions(projectInitiatorCategories, 'project_initiator_category'),
      facilityTypes: toOptions(facilityTypes, 'facility_type'),
      programTypes: toOptions(programTypes, 'program_type'),
      substations: toOptions(substations, 'substation_name'),
      vendors: toOptions(vendors, 'vendor_name'),
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch lookups' });
  }
}
