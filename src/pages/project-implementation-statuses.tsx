import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Title, Text, Button, Modal, TextInput, ActionIcon, Loader } from '@mantine/core';
import { IconPlus, IconTrash, IconPencil, IconGripVertical } from '@tabler/icons-react';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { move } from '@dnd-kit/helpers';
import { toast } from 'react-toastify';
import Layout from '@/components/Layout';
import { useFeatureLayer } from '@/lib/useFeatureLayer';
import type { ProjectImplementationStatus } from '@/types';

const schema = Yup.object({
  project_implementation_status: Yup.string().trim().required('Implementation status is required'),
});

function SortableRow({
  record,
  index,
  position,
  onEdit,
  onDelete,
}: {
  record: ProjectImplementationStatus;
  index: number;
  position: number;
  onEdit: (row: ProjectImplementationStatus) => void;
  onDelete: (row: ProjectImplementationStatus) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id: record.objectid, index });

  return (
    <div
      ref={ref}
      className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2"
      style={{ opacity: isDragging ? 0.4 : 1, boxShadow: isDragging ? '0 6px 18px rgba(0,0,0,0.12)' : undefined }}
    >
      <ActionIcon ref={handleRef} variant="subtle" color="gray" style={{ cursor: 'grab' }} aria-label="Drag to reorder">
        <IconGripVertical size={16} />
      </ActionIcon>
      <Text size="sm" c="dimmed" style={{ width: 24 }}>{position}</Text>
      <Text size="sm" fw={500} c="#1c1a17" style={{ flex: 1 }}>{record.project_implementation_status}</Text>
      <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(record)} aria-label="Edit">
        <IconPencil size={15} />
      </ActionIcon>
      <ActionIcon variant="subtle" color="red" onClick={() => onDelete(record)} aria-label="Delete">
        <IconTrash size={15} />
      </ActionIcon>
    </div>
  );
}

export function ProjectImplementationStatusesPanel() {
  const { records, loading, addRecord, updateRecord, updateRecords, deleteRecord } =
    useFeatureLayer<ProjectImplementationStatus>('/api/project-implementation-statuses');

  // Local, ordered copy driven by sort_order — kept in sync with the fetched records.
  const [items, setItems] = useState<ProjectImplementationStatus[]>([]);
  useEffect(() => {
    setItems([...records].sort((a, b) => (a.sort_order ?? a.objectid) - (b.sort_order ?? b.objectid)));
  }, [records]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectImplementationStatus | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectImplementationStatus | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { project_implementation_status: editTarget?.project_implementation_status ?? '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (editTarget) {
          await updateRecord(editTarget.objectid, { project_implementation_status: values.project_implementation_status.trim() });
          toast.success('Implementation status updated');
        } else {
          const nextOrder = items.reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0) + 1;
          await addRecord({ project_implementation_status: values.project_implementation_status.trim(), sort_order: nextOrder });
          toast.success('Implementation status added');
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
  const openEdit = (row: ProjectImplementationStatus) => { setEditTarget(row); setModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(deleteTarget.objectid);
      toast.success('Implementation status deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Persist only the rows whose position (1-based) actually changed.
  const persistOrder = async (ordered: ProjectImplementationStatus[]) => {
    const updates = ordered
      .map((r, i) => ({ objectid: r.objectid, sort_order: i + 1, prev: r.sort_order }))
      .filter((u) => u.prev !== u.sort_order)
      .map((u) => ({ objectid: u.objectid, body: { sort_order: u.sort_order } }));
    if (updates.length === 0) return;
    try {
      await updateRecords(updates);
      toast.success('Order updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save order');
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <Title order={2} fw={700} c="#1c1a17">Project Implementation Statuses</Title>
            <Text c="dimmed" size="sm" mt={4}>{records.length} records — drag to reorder</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>Add Status</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader size="md" /></div>
        ) : (
          <DragDropProvider
            onDragEnd={(event) => {
              if (event.canceled) return;
              const nextIds = move(items.map((r) => r.objectid), event);
              const byId = new Map(items.map((r) => [r.objectid, r]));
              const next = nextIds
                .map((id) => byId.get(id as number))
                .filter((r): r is ProjectImplementationStatus => !!r);
              setItems(next);
              void persistOrder(next);
            }}
          >
            <div className="flex flex-col gap-2" style={{ maxWidth: 640 }}>
              {items.map((rec, index) => (
                <SortableRow
                  key={rec.objectid}
                  record={rec}
                  index={index}
                  position={index + 1}
                  onEdit={openEdit}
                  onDelete={(row) => setDeleteTarget(row)}
                />
              ))}
            </div>
          </DragDropProvider>
        )}
      </div>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Implementation Status' : 'Add Implementation Status'} radius="md">
        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <TextInput
              label="Implementation Status"
              placeholder="e.g. Ongoing"
              autoFocus
              {...formik.getFieldProps('project_implementation_status')}
              error={formik.touched.project_implementation_status && formik.errors.project_implementation_status}
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
          Are you sure you want to delete <strong>{deleteTarget?.project_implementation_status}</strong>? This action cannot be undone.
        </Text>
        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="red" onClick={handleDelete} loading={deleting} leftSection={<IconTrash size={14} />}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}

export default function ProjectImplementationStatusesPage() {
  return (
    <Layout>
      <ProjectImplementationStatusesPanel />
    </Layout>
  );
}
