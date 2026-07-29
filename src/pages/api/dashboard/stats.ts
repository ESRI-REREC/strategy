import type { NextApiRequest, NextApiResponse } from 'next';
import { queryFeatures } from '@/lib/arcgis';
import { getToken } from '@/lib/apiHelpers';
import type { DashboardStats } from '@/types';

interface RawProject {
  objectid: number;
  project_type_id: string;
  funding_agency_id: string;
  funding_category_id: string;
  funding_year: string;
  project_implementation_status_id: string;
}

interface RawFacility {
  objectid: number;
  program_type_id: string;
}

interface Lookup {
  objectid: number;
  globalid?: string;
  [key: string]: unknown;
}

function aggregate(items: string[]): Array<{ name: string; value: number }> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = item || 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const projectsUrl = process.env.PROJECTS_URL;
  const facilitiesUrl = process.env.FACILITIES_URL;
  const projectTypesUrl = process.env.PROJECT_TYPES_URL;
  const fundingAgenciesUrl = process.env.FUNDING_AGENCIES_URL;
  const fundingCategoriesUrl = process.env.FUNDING_CATEGORIES_URL;
  const implStatusesUrl = process.env.PROJECT_IMPLEMENTATION_STATUSES_URL;
  const programTypesUrl = process.env.PROGRAM_TYPES_URL;

  if (!projectsUrl || !facilitiesUrl) {
    return res.status(500).json({ error: 'Layer URLs not configured' });
  }

  try {
    const [projects, facilities, projectTypes, fundingAgencies, fundingCategories, implStatuses, programTypes] =
      await Promise.all([
        queryFeatures<RawProject>(projectsUrl, token, '1=1', 'objectid,project_type_id,funding_agency_id,funding_category_id,funding_year,project_implementation_status_id'),
        queryFeatures<RawFacility>(facilitiesUrl, token, '1=1', 'objectid,program_type_id'),
        projectTypesUrl ? queryFeatures<Lookup>(projectTypesUrl, token) : Promise.resolve([]),
        fundingAgenciesUrl ? queryFeatures<Lookup>(fundingAgenciesUrl, token) : Promise.resolve([]),
        fundingCategoriesUrl ? queryFeatures<Lookup>(fundingCategoriesUrl, token) : Promise.resolve([]),
        implStatusesUrl ? queryFeatures<Lookup>(implStatusesUrl, token) : Promise.resolve([]),
        programTypesUrl ? queryFeatures<Lookup>(programTypesUrl, token) : Promise.resolve([]),
      ]);

    // Build lookup maps: globalid → display name
    const typeMap = Object.fromEntries(
      projectTypes.map((r) => [r.globalid, r.project_type as string])
    );
    const agencyMap = Object.fromEntries(
      fundingAgencies.map((r) => [r.globalid, r.funding_agency as string])
    );
    const categoryMap = Object.fromEntries(
      fundingCategories.map((r) => [r.globalid, r.funding_category as string])
    );
    const implStatusMap = Object.fromEntries(
      implStatuses.map((r) => [r.globalid, r.project_implementation_status as string])
    );
    const programTypeMap = Object.fromEntries(
      programTypes.map((r) => [r.globalid, r.program_type as string])
    );

    const stats: DashboardStats = {
      totals: {
        projects: projects.length,
        facilities: facilities.length,
      },
      charts: {
        byProjectType: aggregate(
          projects.map((p) => typeMap[p.project_type_id] || 'Unknown')
        ),
        byFundingAgency: aggregate(
          projects.map((p) => agencyMap[p.funding_agency_id] || 'Unknown')
        ),
        byFundingCategory: aggregate(
          projects.map((p) => categoryMap[p.funding_category_id] || 'Unknown')
        ),
        byFundingYear: Object.entries(
          projects.reduce<Record<string, number>>((acc, p) => {
            const year = p.funding_year || 'Unknown';
            acc[year] = (acc[year] || 0) + 1;
            return acc;
          }, {})
        )
          .map(([year, count]) => ({ year, count }))
          .sort((a, b) => a.year.localeCompare(b.year)),
        byImplementationStatus: aggregate(
          projects.map((p) => implStatusMap[p.project_implementation_status_id] || 'Unknown')
        ),
        facilitiesByProgramType: aggregate(
          facilities.map((f) => programTypeMap[f.program_type_id] || 'Unknown')
        ),
      },
    };

    return res.status(200).json(stats);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch stats' });
  }
}
