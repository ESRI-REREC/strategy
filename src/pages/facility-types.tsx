import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { type ColumnDef } from '@tanstack/react-table';
import { Title, Text, Button, Modal, TextInput, Select } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { useFeatureLayer } from '@/lib/useFeatureLayer';
import { useAuthStore } from '@/store/auth';
import type { FacilityType, FacilityCategory } from '@/types';

const schema = Yup.object({
  facility_type: Yup.string().trim().required('Facility type is required'),
  facility_category: Yup.string().nullable().required('Please select a facility category'),
});

export function FacilityTypesPanel() {
  const { records, loading, addRecord, updateRecord, deleteRecord } =
    useFeatureLayer<FacilityType>('/api/facility-types');

  const token = useAuthStore((s) => s.token);
  const [categories, setCategories] = useState<FacilityCategory[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/facility-categories', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCategories(d.records || []));
  }, [token]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FacilityType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FacilityType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      facility_type: editTarget?.facility_type ?? '',
      facility_category: editTarget?.facility_category ?? null as string | null,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const body = { facility_type: values.facility_type.trim(), facility_category: values.facility_category! };
        if (editTarget) {
          await updateRecord(editTarget.objectid, body);
          toast.success('Facility type updated');
        } else {
          await addRecord(body);
          toast.success('Facility type added');
        }
        setModalOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (row: FacilityType) => { setEditTarget(row); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(deleteTarget.objectid);
      toast.success('Facility type deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const catMap = Object.fromEntries(categories.map((c) => [c.globalid, c.facility_category]));
  const categoryOptions = categories.map((c) => ({ value: c.globalid || '', label: c.facility_category }));

  const columns: ColumnDef<FacilityType>[] = [
    { accessorKey: 'objectid', header: 'Object ID', size: 100 },
    { accessorKey: 'facility_type', header: 'Facility Type' },
    {
      accessorKey: 'facility_category',
      header: 'Facility Category',
      cell: ({ getValue }) => catMap[getValue<string>()] || getValue<string>() || '—',
    },
    { accessorKey: 'created_user', header: 'Created By' },
    {
      accessorKey: 'created_date', header: 'Created Date',
      cell: ({ getValue }) => { const v = getValue<number>(); return v ? new Date(v).toLocaleDateString() : '—'; },
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <Title order={2} fw={700} c="#1c1a17">Facility Types</Title>
            <Text c="dimmed" size="sm" mt={4}>{records.length} records</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>Add Facility Type</Button>
        </div>
        <DataTable data={records} columns={columns} loading={loading} onEdit={openEdit} onDelete={(row) => setDeleteTarget(row)} />
      </div>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Facility Type' : 'Add Facility Type'} radius="md">
        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <TextInput
              label="Facility Type"
              placeholder="e.g. Transformer"
              autoFocus
              {...formik.getFieldProps('facility_type')}
              error={formik.touched.facility_type && formik.errors.facility_type}
            />
            <Select
              label="Facility Category"
              placeholder="Select a category"
              data={categoryOptions}
              searchable
              value={formik.values.facility_category}
              onChange={(v) => formik.setFieldValue('facility_category', v)}
              error={formik.touched.facility_category && formik.errors.facility_category}
            />
            <div className="flex justify-end gap-2">
              <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={formik.isSubmitting}>{editTarget ? 'Update' : 'Add'}</Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" radius="md" size="sm">
        <Text size="sm" mb={20}>
          Are you sure you want to delete <strong>{deleteTarget?.facility_type}</strong>? This action cannot be undone.
        </Text>
        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="red" onClick={handleDelete} loading={deleting} leftSection={<IconTrash size={14} />}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}

export default function FacilityTypesPage() {
  return (
    <Layout>
      <FacilityTypesPanel />
    </Layout>
  );
}
