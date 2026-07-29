import { useEffect, useState } from 'react';
import { Title, Text, Skeleton, Card, SimpleGrid, ThemeIcon } from '@mantine/core';
import {
  IconFolderOpen, IconBuilding, IconBuildingBank, IconTag,
  IconCategory, IconBuildingFactory, IconFolderDollar, IconLayoutList,
  IconCircleDotted, IconProgressCheck, IconUsersGroup, IconFileDescription,
  IconBolt, IconTruck, IconTransform,
} from '@tabler/icons-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/auth';
import type { DashboardStats, DashboardCounts } from '@/types';

const referenceCards = [
  { key: 'facilityCategories', label: 'Facility Categories', icon: IconCategory, href: '/facility-categories', color: '#fd7e14' },
  { key: 'facilityTypes', label: 'Facility Types', icon: IconBuildingFactory, href: '/facility-types', color: '#8b5cf6' },
  { key: 'fundingAgencies', label: 'Funding Agencies', icon: IconBuildingBank, href: '/funding-agencies', color: '#10b981' },
  { key: 'fundingCategories', label: 'Funding Categories', icon: IconFolderDollar, href: '/funding-categories', color: '#e8590c' },
  { key: 'programTypes', label: 'Program Types', icon: IconLayoutList, href: '/program-types', color: '#0ea5e9' },
  { key: 'projectCycleStatuses', label: 'Project Cycle Statuses', icon: IconCircleDotted, href: '/project-cycle-statuses', color: '#ef4444' },
  { key: 'projectImplementationStatuses', label: 'Implementation Statuses', icon: IconProgressCheck, href: '/project-implementation-statuses', color: '#06b6d4' },
  { key: 'projectInitiatorCategories', label: 'Initiator Categories', icon: IconUsersGroup, href: '/project-initiator-categories', color: '#ec4899' },
  { key: 'projectTypes', label: 'Project Types', icon: IconFileDescription, href: '/project-types', color: '#14b8a6' },
  { key: 'substations', label: 'Substations', icon: IconBolt, href: '/substations', color: '#ff922b' },
  { key: 'vendors', label: 'Vendors', icon: IconTruck, href: '/vendors', color: '#6366f1' },
  { key: 'voltageTransformations', label: 'Voltage Transformations', icon: IconTransform, href: '/voltage-transformations', color: '#84cc16' },
];

const PIE_COLORS = [
  '#fd7e14', '#e8590c', '#f76707', '#ff922b', '#ffa94d',
  '#2563eb', '#7c3aed', '#059669', '#dc2626', '#0891b2',
  '#ca8a04', '#be185d',
];

const RADIAN = Math.PI / 180;

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

interface StatCardProps {
  label: string;
  value: number | undefined;
  loading: boolean;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, loading, icon: Icon, color }: StatCardProps) {
  return (
    <Card shadow="xs" radius="lg" p="lg" style={{ border: '1px solid #e9ecef' }}>
      <div className="flex items-start justify-between">
        <div>
          {loading ? (
            <Skeleton height={36} width={60} mb={4} radius="sm" />
          ) : (
            <Text size="xl" fw={800} c="#1c1a17" style={{ fontSize: 32, lineHeight: 1 }}>
              {value ?? '—'}
            </Text>
          )}
          <Text size="sm" c="dimmed" mt={6} fw={500}>{label}</Text>
        </div>
        <div
          className="rounded-xl flex items-center justify-center"
          style={{ width: 44, height: 44, background: `${color}18` }}
        >
          <Icon size={22} color={color} />
        </div>
      </div>
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}

function ChartCard({ title, loading, children }: ChartCardProps) {
  return (
    <Card shadow="xs" radius="lg" p="lg" style={{ border: '1px solid #e9ecef' }}>
      <Text fw={600} c="#1c1a17" mb={16}>{title}</Text>
      {loading ? (
        <Skeleton height={260} radius="md" />
      ) : (
        <div style={{ height: 260 }}>{children}</div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: DashboardStats) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));

    fetch('/api/dashboard/counts', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: DashboardCounts) => { setCounts(data); setCountsLoading(false); })
      .catch(() => setCountsLoading(false));
  }, [token]);

  const statCards = [
    { label: 'Total Projects', value: stats?.totals.projects, icon: IconFolderOpen, color: '#fd7e14' },
    { label: 'Total Facilities', value: stats?.totals.facilities, icon: IconBuilding, color: '#2563eb' },
    { label: 'Funding Agencies', value: stats?.charts.byFundingAgency.length, icon: IconBuildingBank, color: '#059669' },
    { label: 'Project Types', value: stats?.charts.byProjectType.length, icon: IconTag, color: '#7c3aed' },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-7">
        <div>
          <Title order={2} fw={700} c="#1c1a17">Dashboard</Title>
          <Text c="dimmed" size="sm" mt={4}>Analytics overview of projects and facilities</Text>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} loading={loading} />
          ))}
        </div>

        {/* Row 1: Projects by Year + Projects by Type */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Projects by Funding Year" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.charts.byFundingYear ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 0, border: '1px solid #e9ecef', fontSize: 13 }}
                  formatter={(v: number) => [v, 'Projects']}
                />
                <Bar dataKey="count" fill="#fd7e14" radius={[0, 0, 0, 0]} name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Projects by Type" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.charts.byProjectType ?? []}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                >
                  {(stats?.charts.byProjectType ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e9ecef', fontSize: 13 }} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 2: By Funding Agency (horizontal bar) + By Funding Category */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Projects by Funding Agency" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.charts.byFundingAgency ?? []}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e9ecef', fontSize: 13 }} />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 0, 0, 0]} name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Projects by Funding Category" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.charts.byFundingCategory ?? []}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                >
                  {(stats?.charts.byFundingCategory ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e9ecef', fontSize: 13 }} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3: Implementation Status + Facilities by Program Type */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Projects by Implementation Status" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.charts.byImplementationStatus ?? []}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                >
                  {(stats?.charts.byImplementationStatus ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e9ecef', fontSize: 13 }} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Facilities by Program Type" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.charts.facilitiesByProgramType ?? []}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                >
                  {(stats?.charts.facilitiesByProgramType ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e9ecef', fontSize: 13 }} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Reference Data counts */}
        <div>
          <Title order={3} fw={700} c="#1c1a17">Reference Data</Title>
          <Text c="dimmed" size="sm" mt={4} mb={16}>Record counts across all reference layers — click to manage</Text>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {referenceCards.map(({ key, label, icon: Icon, href, color }) => (
              <Link key={key} href={href} style={{ textDecoration: 'none' }}>
                <Card
                  shadow="xs"
                  radius={0}
                  p="lg"
                  style={{ border: '1px solid #e9ecef', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'none';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {countsLoading ? (
                        <Skeleton height={36} width={60} mb={4} radius={0} />
                      ) : (
                        <Text size="xl" fw={800} c="#1c1a17" style={{ fontSize: 32, lineHeight: 1 }}>
                          {counts ? (counts as unknown as Record<string, number>)[key] ?? '—' : '—'}
                        </Text>
                      )}
                      <Text size="sm" c="dimmed" mt={6} fw={500}>{label}</Text>
                    </div>
                    <ThemeIcon radius={0} size={44} style={{ background: `${color}18` }}>
                      <Icon size={22} color={color} />
                    </ThemeIcon>
                  </div>
                </Card>
              </Link>
            ))}
          </SimpleGrid>
        </div>
      </div>
    </Layout>
  );
}
