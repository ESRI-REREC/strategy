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
import type { ProjectType } from '@/types';

const schema = Yup.object({
  project_type: Yup.string().trim().required('Project type is required'),
});

export function ProjectTypesPanel() {
  const { records, loading, addRecord, updateRecord, deleteRecord } =
    useFeatureLayer<ProjectType>('/api/project-types');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { project_type: editTarget?.project_type ?? '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (editTarget) {
          await updateRecord(editTarget.objectid, { project_type: values.project_type.trim() });
          toast.success('Project type updated');
        } else {
          await addRecord({ project_type: values.project_type.trim() });
          toast.success('Project type added');
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
  const openEdit = (row: ProjectType) => { setEditTarget(row); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(deleteTarget.objectid);
      toast.success('Project type deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<ProjectType>[] = [
    { accessorKey: 'objectid', header: 'Object ID', size: 100 },
    { accessorKey: 'project_type', header: 'Project Type' },
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
            <Title order={2} fw={700} c="#1c1a17">Project Types</Title>
            <Text c="dimmed" size="sm" mt={4}>{records.length} records</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>Add Project Type</Button>
        </div>
        <DataTable data={records} columns={columns} loading={loading} onEdit={openEdit} onDelete={(row) => setDeleteTarget(row)} />
      </div>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Project Type' : 'Add Project Type'} radius="md">
        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <TextInput
              label="Project Type"
              placeholder="e.g. Infrastructure"
              autoFocus
              {...formik.getFieldProps('project_type')}
              error={formik.touched.project_type && formik.errors.project_type}
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
          Are you sure you want to delete <strong>{deleteTarget?.project_type}</strong>? This action cannot be undone.
        </Text>
        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="red" onClick={handleDelete} loading={deleting} leftSection={<IconTrash size={14} />}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}

export default function ProjectTypesPage() {
  return (
    <Layout>
      <ProjectTypesPanel />
    </Layout>
  );
}
