import type { NextApiRequest, NextApiResponse } from 'next';
import { queryFeatures, addFeature, updateFeature, deleteFeature } from './arcgis';

export function getToken(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function handleList(
  req: NextApiRequest,
  res: NextApiResponse,
  layerUrl: string
) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const records = await queryFeatures(layerUrl, token);
    return res.status(200).json({ records });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch records' });
  }
}

export async function handleAdd(
  req: NextApiRequest,
  res: NextApiResponse,
  layerUrl: string,
  attributes: Record<string, unknown>
) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await addFeature(layerUrl, token, attributes);
    const added = result.addResults?.[0];
    if (!added?.success) {
      return res.status(400).json({ error: added?.error?.description || 'Failed to add record' });
    }
    return res.status(201).json({ success: true, objectId: added.objectId });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to add record' });
  }
}

export async function handleUpdate(
  req: NextApiRequest,
  res: NextApiResponse,
  layerUrl: string,
  objectid: number,
  attributes: Record<string, unknown>
) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await updateFeature(layerUrl, token, objectid, attributes);
    const updated = result.updateResults?.[0];
    if (!updated?.success) {
      return res.status(400).json({ error: updated?.error?.description || 'Failed to update record' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update record' });
  }
}

export async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  layerUrl: string,
  objectid: number
) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await deleteFeature(layerUrl, token, objectid);
    const deleted = result.deleteResults?.[0];
    if (!deleted?.success) {
      return res.status(400).json({ error: deleted?.error?.description || 'Failed to delete record' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete record' });
  }
}
