import { useEffect, useState, useMemo } from 'react';
import { Title, Text, TextInput, Select, Badge } from '@mantine/core';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { type ColumnDef } from '@tanstack/react-table';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { useAuthStore } from '@/store/auth';
import type { Facility } from '@/types';

export default function FacilitiesPage() {
  const token = useAuthStore((s) => s.token);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterFacilityType, setFilterFacilityType] = useState('');
  const [filterProgramType, setFilterProgramType] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/facilities', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { setFacilities((data.facilities as Facility[]) || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const facilityTypes = useMemo(() => {
    const vals = [...new Set(facilities.map((f) => f.facility_type_name).filter(Boolean))].sort() as string[];
    return vals.map((v) => ({ value: v, label: v }));
  }, [facilities]);

  const programTypes = useMemo(() => {
    const vals = [...new Set(facilities.map((f) => f.program_type_name).filter(Boolean))].sort() as string[];
    return vals.map((v) => ({ value: v, label: v }));
  }, [facilities]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return facilities.filter((f) => {
      if (q && !f.facility_name?.toLowerCase().includes(q) && !f.reference_number?.toLowerCase().includes(q)) return false;
      if (filterFacilityType && f.facility_type_name !== filterFacilityType) return false;
      if (filterProgramType && f.program_type_name !== filterProgramType) return false;
      return true;
    });
  }, [facilities, search, filterFacilityType, filterProgramType]);

  const columns: ColumnDef<Facility>[] = [
    {
      accessorKey: 'facility_name',
      header: 'Facility Name',
      cell: ({ getValue }) => (
        <Text size="sm" fw={500} c="#1c1a17" style={{ maxWidth: 240, wordBreak: 'break-word' }}>
          {getValue() as string || '—'}
        </Text>
      ),
    },
    { accessorKey: 'reference_number', header: 'Ref No.', cell: ({ getValue }) => <span>{getValue() as string || '—'}</span> },
    {
      accessorKey: 'facility_type_name',
      header: 'Facility Type',
      cell: ({ getValue }) => getValue() ? (
        <Badge variant="light" color="orange" size="sm">{getValue() as string}</Badge>
      ) : <span>—</span>,
    },
    {
      accessorKey: 'program_type_name',
      header: 'Program Type',
      cell: ({ getValue }) => getValue() ? (
        <Badge variant="light" color="violet" size="sm">{getValue() as string}</Badge>
      ) : <span>—</span>,
    },
  ];

  const activeFilters = [filterFacilityType, filterProgramType].filter(Boolean).length;

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <Title order={2} fw={700} c="#1c1a17">Facilities</Title>
          <Text c="dimmed" size="sm" mt={4}>
            {loading ? 'Loading…' : `${filtered.length} of ${facilities.length} facilities`}
          </Text>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <IconFilter size={16} color="#6b7280" />
            <Text size="sm" fw={600} c="#374151">
              Filters {activeFilters > 0 && <Badge size="xs" color="orange" ml={4}>{activeFilters}</Badge>}
            </Text>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <TextInput
              placeholder="Search by name or ref no."
              leftSection={<IconSearch size={15} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="sm"
            />
            <Select
              placeholder="Facility Type"
              data={facilityTypes}
              value={filterFacilityType}
              onChange={(v) => setFilterFacilityType(v || '')}
              clearable
              searchable
              size="sm"
            />
            <Select
              placeholder="Program Type"
              data={programTypes}
              value={filterProgramType}
              onChange={(v) => setFilterProgramType(v || '')}
              clearable
              searchable
              size="sm"
            />
          </div>
        </div>

        <DataTable data={filtered} columns={columns} loading={loading} />
      </div>
    </Layout>
  );
}
