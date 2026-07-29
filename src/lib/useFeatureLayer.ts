import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { toast } from 'react-toastify';

export function useFeatureLayer<T>(apiPath: string) {
  const token = useAuthStore((s) => s.token);
  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(apiPath, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setRecords((data.records as T[]) || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, [apiPath, token]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const addRecord = async (body: Record<string, unknown>) => {
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add record');
    await fetchRecords();
  };

  const updateRecord = async (objectid: number, body: Record<string, unknown>) => {
    const res = await fetch(`${apiPath}/${objectid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update record');
    await fetchRecords();
  };

  const deleteRecord = async (objectid: number) => {
    const res = await fetch(`${apiPath}/${objectid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete record');
    await fetchRecords();
  };

  return { records, loading, fetchRecords, addRecord, updateRecord, deleteRecord };
}
