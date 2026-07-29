import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { type ColumnDef } from '@tanstack/react-table';
import { Title, Text, Button, Modal, TextInput } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { useFeatureLayer } from '@/lib/useFeatureLayer';
import type { FundingCategory } from '@/types';

const schema = Yup.object({
  funding_category: Yup.string().trim().required('Funding category is required'),
  funding_type: Yup.string().trim(),
});

export function FundingCategoriesPanel() {
  const { records, loading, addRecord, updateRecord, deleteRecord } =
    useFeatureLayer<FundingCategory>('/api/funding-categories');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FundingCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FundingCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      funding_category: editTarget?.funding_category ?? '',
      funding_type: editTarget?.funding_type ?? '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const body = { funding_category: values.funding_category.trim(), funding_type: values.funding_type.trim() };
        if (editTarget) {
          await updateRecord(editTarget.objectid, body);
          toast.success('Funding category updated');
        } else {
          await addRecord(body);
          toast.success('Funding category added');
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
  const openEdit = (row: FundingCategory) => { setEditTarget(row); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(deleteTarget.objectid);
      toast.success('Funding category deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<FundingCategory>[] = [
    { accessorKey: 'objectid', header: 'Object ID', size: 100 },
    { accessorKey: 'funding_category', header: 'Funding Category' },
    { accessorKey: 'funding_type', header: 'Funding Type' },
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
            <Title order={2} fw={700} c="#1c1a17">Funding Categories</Title>
            <Text c="dimmed" size="sm" mt={4}>{records.length} records</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>Add Funding Category</Button>
        </div>
        <DataTable data={records} columns={columns} loading={loading} onEdit={openEdit} onDelete={(row) => setDeleteTarget(row)} />
      </div>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Funding Category' : 'Add Funding Category'} radius="md">
        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <TextInput
              label="Funding Category"
              placeholder="e.g. Grant"
              autoFocus
              {...formik.getFieldProps('funding_category')}
              error={formik.touched.funding_category && formik.errors.funding_category}
            />
            <TextInput
              label="Funding Type"
              placeholder="e.g. International"
              {...formik.getFieldProps('funding_type')}
              error={formik.touched.funding_type && formik.errors.funding_type}
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
          Are you sure you want to delete <strong>{deleteTarget?.funding_category}</strong>? This action cannot be undone.
        </Text>
        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="red" onClick={handleDelete} loading={deleting} leftSection={<IconTrash size={14} />}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}

export default function FundingCategoriesPage() {
  return (
    <Layout>
      <FundingCategoriesPanel />
    </Layout>
  );
}
