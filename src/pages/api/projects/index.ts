import type { NextApiRequest, NextApiResponse } from 'next';
import { queryFeatures } from '@/lib/arcgis';
import { getToken } from '@/lib/apiHelpers';
import type { Project } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const projectsUrl = process.env.PROJECTS_URL;
  if (!projectsUrl) return res.status(500).json({ error: 'PROJECTS_URL not configured' });

  try {
    const rawProjects = await queryFeatures<Project>(projectsUrl, token);

    // Labels are now stored on the layer, so display names come straight from them.
    const projects = rawProjects.map((p) => ({
      ...p,
      project_type_name: p.project_type ?? null,
      funding_agency_name: p.funding_agency ?? null,
      funding_category_name: p.funding_category ?? null,
      project_cycle_status_name: p.project_cycle_status ?? null,
      project_implementation_status_name: p.project_implementation_status ?? null,
      initiator_category_name: p.project_initiator_category ?? null,
      substation_name: p.substation_name ?? null,
      vendor_name: p.vendor_name ?? null,
    }));

    return res.status(200).json({ projects });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch projects' });
  }
}
