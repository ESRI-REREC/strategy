import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Title, Text, TextInput, Select, Badge, Button } from '@mantine/core';
import { IconSearch, IconFilter, IconPlus } from '@tabler/icons-react';
import { type ColumnDef } from '@tanstack/react-table';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { useAuthStore } from '@/store/auth';
import type { Project } from '@/types';

export default function ProjectsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterAgency, setFilterAgency] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCounty, setFilterCounty] = useState('');
  const [filterConstituency, setFilterConstituency] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { setProjects((data.projects as Project[]) || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const years = useMemo(() => {
    const vals = [...new Set(projects.map((p) => p.funding_year).filter(Boolean))].sort();
    return vals.map((v) => ({ value: v, label: v }));
  }, [projects]);

  const agencies = useMemo(() => {
    const vals = [...new Set(projects.map((p) => p.funding_agency_name).filter(Boolean))].sort() as string[];
    return vals.map((v) => ({ value: v, label: v }));
  }, [projects]);

  const categories = useMemo(() => {
    const vals = [...new Set(projects.map((p) => p.funding_category_name).filter(Boolean))].sort() as string[];
    return vals.map((v) => ({ value: v, label: v }));
  }, [projects]);

  const types = useMemo(() => {
    const vals = [...new Set(projects.map((p) => p.project_type_name).filter(Boolean))].sort() as string[];
    return vals.map((v) => ({ value: v, label: v }));
  }, [projects]);

  const counties = useMemo(() => {
    const vals = [...new Set(projects.map((p) => p.county).filter(Boolean))].sort() as string[];
    return vals.map((v) => ({ value: v, label: v }));
  }, [projects]);

  const constituencies = useMemo(() => {
    const vals = [...new Set(projects.map((p) => p.constituency).filter(Boolean))].sort() as string[];
    return vals.map((v) => ({ value: v, label: v }));
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter((p) => {
      if (q && !p.project_name?.toLowerCase().includes(q) && !p.reference_number?.toLowerCase().includes(q)) return false;
      if (filterYear && p.funding_year !== filterYear) return false;
      if (filterAgency && p.funding_agency_name !== filterAgency) return false;
      if (filterCategory && p.funding_category_name !== filterCategory) return false;
      if (filterType && p.project_type_name !== filterType) return false;
      if (filterCounty && p.county !== filterCounty) return false;
      if (filterConstituency && p.constituency !== filterConstituency) return false;
      return true;
    });
  }, [projects, search, filterYear, filterAgency, filterCategory, filterType, filterCounty, filterConstituency]);

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: 'project_name',
      header: 'Project Name',
      cell: ({ getValue }) => (
        <Text size="sm" fw={500} c="#1c1a17" style={{ maxWidth: 260, wordBreak: 'break-word' }}>
          {getValue() as string || '—'}
        </Text>
      ),
    },
    { accessorKey: 'reference_number', header: 'Ref No.', cell: ({ getValue }) => <span>{getValue() as string || '—'}</span> },
    { accessorKey: 'funding_year', header: 'Year', cell: ({ getValue }) => <span>{getValue() as string || '—'}</span> },
    {
      accessorKey: 'funding_agency_name',
      header: 'Funding Agency',
      cell: ({ getValue }) => getValue() ? (
        <Badge variant="light" color="blue" size="sm">{getValue() as string}</Badge>
      ) : <span>—</span>,
    },
    {
      accessorKey: 'funding_category_name',
      header: 'Funding Category',
      cell: ({ getValue }) => getValue() ? (
        <Badge variant="light" color="orange" size="sm">{getValue() as string}</Badge>
      ) : <span>—</span>,
    },
    {
      accessorKey: 'project_type_name',
      header: 'Project Type',
      cell: ({ getValue }) => getValue() ? (
        <Badge variant="light" color="violet" size="sm">{getValue() as string}</Badge>
      ) : <span>—</span>,
    },
    {
      accessorKey: 'project_implementation_status_name',
      header: 'Status',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        if (!v) return <span>—</span>;
        const lower = v.toLowerCase();
        const color = lower.includes('complet') ? 'green'
          : lower.includes('progress') || lower.includes('ongoing') ? 'blue'
          : lower.includes('cancel') || lower.includes('stop') ? 'red'
          : 'gray';
        return <Badge variant="dot" color={color} size="sm">{v}</Badge>;
      },
    },
    { accessorKey: 'county', header: 'County', cell: ({ getValue }) => <span>{getValue() as string || '—'}</span> },
    { accessorKey: 'constituency', header: 'Constituency', cell: ({ getValue }) => <span>{getValue() as string || '—'}</span> },
    { accessorKey: 'substation_name', header: 'Substation', cell: ({ getValue }) => <span>{getValue() as string || '—'}</span> },
    { accessorKey: 'vendor_name', header: 'Vendor', cell: ({ getValue }) => <span>{getValue() as string || '—'}</span> },
  ];

  const activeFilters = [filterYear, filterAgency, filterCategory, filterType, filterCounty, filterConstituency].filter(Boolean).length;

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <Title order={2} fw={700} c="#1c1a17">Projects</Title>
            <Text c="dimmed" size="sm" mt={4}>
              {loading ? 'Loading…' : `${filtered.length} of ${projects.length} projects`}
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push('/projects/new')}
            style={{ background: 'linear-gradient(135deg, #e8590c 0%, #fd7e14 100%)' }}
          >
            New Project
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <IconFilter size={16} color="#6b7280" />
            <Text size="sm" fw={600} c="#374151">
              Filters {activeFilters > 0 && <Badge size="xs" color="orange" ml={4}>{activeFilters}</Badge>}
            </Text>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <TextInput
              placeholder="Search by name or ref no."
              leftSection={<IconSearch size={15} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="sm"
            />
            <Select placeholder="Funding Year" data={years} value={filterYear} onChange={(v) => setFilterYear(v || '')} clearable size="sm" />
            <Select placeholder="Funding Agency" data={agencies} value={filterAgency} onChange={(v) => setFilterAgency(v || '')} clearable searchable size="sm" />
            <Select placeholder="Funding Category" data={categories} value={filterCategory} onChange={(v) => setFilterCategory(v || '')} clearable searchable size="sm" />
            <Select placeholder="Project Type" data={types} value={filterType} onChange={(v) => setFilterType(v || '')} clearable searchable size="sm" />
            <Select placeholder="County" data={counties} value={filterCounty} onChange={(v) => setFilterCounty(v || '')} clearable searchable size="sm" disabled={counties.length === 0} />
            <Select placeholder="Constituency" data={constituencies} value={filterConstituency} onChange={(v) => setFilterConstituency(v || '')} clearable searchable size="sm" disabled={constituencies.length === 0} />
          </div>
        </div>

        <DataTable data={filtered} columns={columns} loading={loading} />
      </div>
    </Layout>
  );
}
