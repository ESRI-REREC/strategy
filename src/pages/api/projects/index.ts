import type { NextApiRequest, NextApiResponse } from 'next';
import { queryFeatures } from '@/lib/arcgis';
import { getToken } from '@/lib/apiHelpers';
import type { Project } from '@/types';

interface Lookup {
  objectid: number;
  globalid?: string;
  [key: string]: unknown;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const projectsUrl = process.env.PROJECTS_URL;
  if (!projectsUrl) return res.status(500).json({ error: 'PROJECTS_URL not configured' });

  try {
    const [
      rawProjects,
      projectTypes,
      fundingAgencies,
      fundingCategories,
      cycleStatuses,
      implStatuses,
      initiatorCategories,
      substations,
      vendors,
    ] = await Promise.all([
      queryFeatures<Project>(projectsUrl, token),
      process.env.PROJECT_TYPES_URL ? queryFeatures<Lookup>(process.env.PROJECT_TYPES_URL, token) : Promise.resolve([]),
      process.env.FUNDING_AGENCIES_URL ? queryFeatures<Lookup>(process.env.FUNDING_AGENCIES_URL, token) : Promise.resolve([]),
      process.env.FUNDING_CATEGORIES_URL ? queryFeatures<Lookup>(process.env.FUNDING_CATEGORIES_URL, token) : Promise.resolve([]),
      process.env.PROJECT_CYCLE_STATUSES_URL ? queryFeatures<Lookup>(process.env.PROJECT_CYCLE_STATUSES_URL, token) : Promise.resolve([]),
      process.env.PROJECT_IMPLEMENTATION_STATUSES_URL ? queryFeatures<Lookup>(process.env.PROJECT_IMPLEMENTATION_STATUSES_URL, token) : Promise.resolve([]),
      process.env.PROJECT_INITIATOR_CATEGORIES_URL ? queryFeatures<Lookup>(process.env.PROJECT_INITIATOR_CATEGORIES_URL, token) : Promise.resolve([]),
      process.env.SUBSTATIONS_URL ? queryFeatures<Lookup>(process.env.SUBSTATIONS_URL, token) : Promise.resolve([]),
      process.env.VENDORS_URL ? queryFeatures<Lookup>(process.env.VENDORS_URL, token) : Promise.resolve([]),
    ]);

    const typeMap = Object.fromEntries(projectTypes.map((r) => [r.globalid, r.project_type as string]));
    const agencyMap = Object.fromEntries(fundingAgencies.map((r) => [r.globalid, r.funding_agency as string]));
    const categoryMap = Object.fromEntries(fundingCategories.map((r) => [r.globalid, r.funding_category as string]));
    const cycleMap = Object.fromEntries(cycleStatuses.map((r) => [r.globalid, r.project_cycle_status as string]));
    const implMap = Object.fromEntries(implStatuses.map((r) => [r.globalid, r.project_implementation_status as string]));
    const initiatorMap = Object.fromEntries(initiatorCategories.map((r) => [r.globalid, r.project_initiator_category as string]));
    const substationMap = Object.fromEntries(substations.map((r) => [r.globalid, r.substation_name as string]));
    const vendorMap = Object.fromEntries(vendors.map((r) => [r.globalid, r.vendor_name as string]));

    const projects = rawProjects.map((p) => ({
      ...p,
      project_type_name: typeMap[p.project_type_id] ?? null,
      funding_agency_name: agencyMap[p.funding_agency_id] ?? null,
      funding_category_name: categoryMap[p.funding_category_id] ?? null,
      project_cycle_status_name: cycleMap[p.project_cycle_status_id] ?? null,
      project_implementation_status_name: implMap[p.project_implementation_status_id] ?? null,
      initiator_category_name: initiatorMap[p.project_initiator_category_id] ?? null,
      substation_name: substationMap[p.substation_id] ?? null,
      vendor_name: vendorMap[p.vendor_id] ?? null,
    }));

    return res.status(200).json({ projects });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch projects' });
  }
}
