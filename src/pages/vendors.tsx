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
import type { Vendor } from '@/types';

const schema = Yup.object({
  vendor_name: Yup.string().trim().required('Vendor name is required'),
  vendor_email: Yup.string().trim().email('Invalid email address'),
  vendor_phone_number: Yup.string().trim(),
});

export function VendorsPanel() {
  const { records, loading, addRecord, updateRecord, deleteRecord } =
    useFeatureLayer<Vendor>('/api/vendors');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      vendor_name: editTarget?.vendor_name ?? '',
      vendor_email: editTarget?.vendor_email ?? '',
      vendor_phone_number: editTarget?.vendor_phone_number ?? '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const body = {
          vendor_name: values.vendor_name.trim(),
          vendor_email: values.vendor_email.trim(),
          vendor_phone_number: values.vendor_phone_number.trim(),
        };
        if (editTarget) {
          await updateRecord(editTarget.objectid, body);
          toast.success('Vendor updated');
        } else {
          await addRecord(body);
          toast.success('Vendor added');
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
  const openEdit = (row: Vendor) => { setEditTarget(row); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(deleteTarget.objectid);
      toast.success('Vendor deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<Vendor>[] = [
    { accessorKey: 'objectid', header: 'Object ID', size: 100 },
    { accessorKey: 'vendor_name', header: 'Vendor Name' },
    { accessorKey: 'vendor_email', header: 'Email' },
    { accessorKey: 'vendor_phone_number', header: 'Phone' },
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
            <Title order={2} fw={700} c="#1c1a17">Vendors</Title>
            <Text c="dimmed" size="sm" mt={4}>{records.length} records</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>Add Vendor</Button>
        </div>
        <DataTable data={records} columns={columns} loading={loading} onEdit={openEdit} onDelete={(row) => setDeleteTarget(row)} />
      </div>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Vendor' : 'Add Vendor'} radius="md">
        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <TextInput
              label="Vendor Name"
              placeholder="e.g. Acme Corp"
              autoFocus
              {...formik.getFieldProps('vendor_name')}
              error={formik.touched.vendor_name && formik.errors.vendor_name}
            />
            <TextInput
              label="Email"
              placeholder="contact@vendor.com"
              type="email"
              {...formik.getFieldProps('vendor_email')}
              error={formik.touched.vendor_email && formik.errors.vendor_email}
            />
            <TextInput
              label="Phone Number"
              placeholder="+254..."
              {...formik.getFieldProps('vendor_phone_number')}
              error={formik.touched.vendor_phone_number && formik.errors.vendor_phone_number}
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
          Are you sure you want to delete <strong>{deleteTarget?.vendor_name}</strong>? This action cannot be undone.
        </Text>
        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="red" onClick={handleDelete} loading={deleting} leftSection={<IconTrash size={14} />}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}

export default function VendorsPage() {
  return (
    <Layout>
      <VendorsPanel />
    </Layout>
  );
}
