import type { NextApiRequest, NextApiResponse } from 'next';
import { addFeature } from '@/lib/arcgis';
import { getToken } from '@/lib/apiHelpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const projectsUrl = process.env.PROJECTS_URL;
  const facilitiesUrl = process.env.FACILITIES_URL;
  if (!projectsUrl || !facilitiesUrl) {
    return res.status(500).json({ error: 'Layer URLs not configured' });
  }

  const { project, facility } = req.body as {
    project: Record<string, unknown>;
    facility: { longitude: number; latitude: number; [key: string]: unknown };
  };

  if (!project || !facility) {
    return res.status(400).json({ error: 'project and facility are required' });
  }

  try {
    const { longitude, latitude, ...facilityAttrs } = facility;

    const projectResult = await addFeature(projectsUrl, token, project);
    if (projectResult.addResults?.[0]?.success === false) {
      throw new Error(projectResult.addResults[0].error?.description ?? 'Failed to create project');
    }

    const facilityResult = await addFeature(facilitiesUrl, token, facilityAttrs, {
      x: longitude,
      y: latitude,
    });
    if (facilityResult.addResults?.[0]?.success === false) {
      throw new Error(facilityResult.addResults[0].error?.description ?? 'Failed to create facility');
    }

    return res.status(201).json({
      projectObjectId: projectResult.addResults?.[0]?.objectId,
      facilityObjectId: facilityResult.addResults?.[0]?.objectId,
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create records' });
  }
}
