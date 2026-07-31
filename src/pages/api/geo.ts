import type { NextApiRequest, NextApiResponse } from 'next';
import { queryFeatures } from '@/lib/arcgis';
import { getToken } from '@/lib/apiHelpers';

interface CountyRow {
  county?: string;
  [key: string]: unknown;
}
interface ConstituencyRow {
  constituen?: string;
  county_nam?: string;
  [key: string]: unknown;
}

// Normalise a county name for cross-layer matching (casing / punctuation / spacing differ).
const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

// The constituencies layer spells a few counties differently from the counties layer.
// Map those normalised names onto the canonical county value from the counties layer.
const COUNTY_ALIASES: Record<string, string> = {
  ELGEYOMARAKWET: 'Keiyo-Marakwet',
  ELEGEYOMARAKWET: 'Keiyo-Marakwet',
  THARAKANITHI: 'Tharaka',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const countiesUrl = process.env.KENYA_COUNTIES_URL;
  const constituenciesUrl = process.env.KENYA_CONSTITUENCIES_URL;
  if (!countiesUrl || !constituenciesUrl) {
    return res.status(500).json({ error: 'County/constituency layer URLs not configured' });
  }

  try {
    const [countyRows, constituencyRows] = await Promise.all([
      queryFeatures<CountyRow>(countiesUrl, token, '1=1', 'county'),
      queryFeatures<ConstituencyRow>(constituenciesUrl, token, '1=1', 'constituen,county_nam'),
    ]);

    // Canonical county values, and a lookup from normalised name -> canonical value.
    const countyNames = Array.from(
      new Set(countyRows.map((r) => r.county).filter((c): c is string => !!c)),
    ).sort((a, b) => a.localeCompare(b));

    const countyByNorm = new Map(countyNames.map((c) => [norm(c), c]));
    const resolveCounty = (countyNam: string) =>
      countyByNorm.get(norm(countyNam)) ?? COUNTY_ALIASES[norm(countyNam)] ?? countyNam;

    const counties = countyNames.map((c) => ({ value: c, label: c }));

    const constituencies = constituencyRows
      .filter((r) => r.constituen && r.county_nam)
      .map((r) => ({
        value: r.constituen as string,
        label: r.constituen as string,
        county: resolveCounty(r.county_nam as string),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return res.status(200).json({ counties, constituencies });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch geo data' });
  }
}
