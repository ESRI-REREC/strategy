import type { NextApiRequest, NextApiResponse } from 'next';
import { generateToken, getPortalSelf } from '@/lib/arcgis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  const portalUrl = process.env.ARCGIS_PORTAL_URL;
  const requiredGroupId = process.env.ARCGIS_SP_GROUP_ID;

  if (!portalUrl) return res.status(500).json({ error: 'Portal URL not configured' });

  try {
    const token = await generateToken(portalUrl, username, password);
    const user = await getPortalSelf(portalUrl, token);

    if (requiredGroupId) {
      const isMember = user.groups.some((g) => g.id === requiredGroupId);
      if (!isMember) {
        return res.status(403).json({
          error: 'Access denied. You must be a member of the Strategy & Planning group.',
        });
      }
    }

    return res.status(200).json({ token, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return res.status(401).json({ error: message });
  }
}
