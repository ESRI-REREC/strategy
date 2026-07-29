import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { type ColumnDef } from '@tanstack/react-table';
import { Title, Text, Button, Modal, TextInput, NumberInput, Select } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { useFeatureLayer } from '@/lib/useFeatureLayer';
import { useAuthStore } from '@/store/auth';
import type { Substation, VoltageTransformation } from '@/types';

const schema = Yup.object({
  substation_id: Yup.number().nullable(),
  substation_name: Yup.string().trim().required('Substation name is required'),
  substation_number: Yup.string().trim(),
  substation_type: Yup.string().trim(),
  voltage_transformation_id: Yup.string().nullable(),
});

export function SubstationsPanel() {
  const { records, loading, addRecord, updateRecord, deleteRecord } =
    useFeatureLayer<Substation>('/api/substations');

  const token = useAuthStore((s) => s.token);
  const [voltageOptions, setVoltageOptions] = useState<VoltageTransformation[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/voltage-transformations', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setVoltageOptions(d.records || []));
  }, [token]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Substation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Substation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      substation_id: editTarget?.substation_id ?? null as number | null,
      substation_name: editTarget?.substation_name ?? '',
      substation_number: editTarget?.substation_number ?? '',
      substation_type: editTarget?.substation_type ?? '',
      voltage_transformation_id: editTarget?.voltage_transformation_id ?? null as string | null,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const body = {
          substation_id: values.substation_id,
          substation_name: values.substation_name.trim(),
          substation_number: values.substation_number.trim(),
          substation_type: values.substation_type.trim(),
          voltage_transformation_id: values.voltage_transformation_id,
        };
        if (editTarget) {
          await updateRecord(editTarget.objectid, body);
          toast.success('Substation updated');
        } else {
          await addRecord(body);
          toast.success('Substation added');
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
  const openEdit = (row: Substation) => { setEditTarget(row); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(deleteTarget.objectid);
      toast.success('Substation deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const voltMap = Object.fromEntries(voltageOptions.map((v) => [v.globalid, v.voltage_transformation]));
  const voltSelectOptions = voltageOptions.map((v) => ({ value: v.globalid || '', label: v.voltage_transformation }));

  const columns: ColumnDef<Substation>[] = [
    { accessorKey: 'objectid', header: 'Object ID', size: 80 },
    { accessorKey: 'substation_id', header: 'Substation ID' },
    { accessorKey: 'substation_name', header: 'Name' },
    { accessorKey: 'substation_number', header: 'Number' },
    { accessorKey: 'substation_type', header: 'Type' },
    {
      accessorKey: 'voltage_transformation_id',
      header: 'Voltage Transformation',
      cell: ({ getValue }) => voltMap[getValue<string>()] || getValue<string>() || '—',
    },
    { accessorKey: 'created_user', header: 'Created By' },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <Title order={2} fw={700} c="#1c1a17">Substations</Title>
            <Text c="dimmed" size="sm" mt={4}>{records.length} records</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>Add Substation</Button>
        </div>
        <DataTable data={records} columns={columns} loading={loading} onEdit={openEdit} onDelete={(row) => setDeleteTarget(row)} />
      </div>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Substation' : 'Add Substation'} radius="md" size="lg">
        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Substation ID"
                placeholder="e.g. 1"
                min={0}
                value={formik.values.substation_id ?? ''}
                onChange={(v) => formik.setFieldValue('substation_id', v === '' ? null : Number(v))}
                error={formik.touched.substation_id && formik.errors.substation_id}
              />
              <TextInput
                label="Substation Number"
                placeholder="e.g. SUB-001"
                {...formik.getFieldProps('substation_number')}
                error={formik.touched.substation_number && formik.errors.substation_number}
              />
            </div>
            <TextInput
              label="Substation Name"
              placeholder="e.g. Nairobi North"
              autoFocus
              {...formik.getFieldProps('substation_name')}
              error={formik.touched.substation_name && formik.errors.substation_name}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Substation Type"
                placeholder="e.g. Primary"
                {...formik.getFieldProps('substation_type')}
                error={formik.touched.substation_type && formik.errors.substation_type}
              />
              <Select
                label="Voltage Transformation"
                placeholder="Select voltage transformation"
                data={voltSelectOptions}
                searchable
                clearable
                value={formik.values.voltage_transformation_id}
                onChange={(v) => formik.setFieldValue('voltage_transformation_id', v)}
                error={formik.touched.voltage_transformation_id && formik.errors.voltage_transformation_id}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={formik.isSubmitting}>{editTarget ? 'Update' : 'Add'}</Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" radius="md" size="sm">
        <Text size="sm" mb={20}>
          Are you sure you want to delete substation <strong>{deleteTarget?.substation_name}</strong>? This action cannot be undone.
        </Text>
        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="red" onClick={handleDelete} loading={deleting} leftSection={<IconTrash size={14} />}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}

export default function SubstationsPage() {
  return (
    <Layout>
      <SubstationsPanel />
    </Layout>
  );
}
