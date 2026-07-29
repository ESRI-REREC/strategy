import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Title,
  Text,
  TextInput,
  Select,
  NumberInput,
  Button,
  Divider,
  Paper,
  Group,
  Stack,
  Loader,
  Badge,
} from '@mantine/core';
import { IconArrowLeft, IconMapPin } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/auth';

const FacilityMap = dynamic(() => import('@/components/FacilityMap'), { ssr: false });

interface LookupOption {
  value: string;
  label: string;
}

interface Lookups {
  projectTypes: LookupOption[];
  fundingAgencies: LookupOption[];
  fundingCategories: LookupOption[];
  projectImplementationStatuses: LookupOption[];
  projectCycleStatuses: LookupOption[];
  projectInitiatorCategories: LookupOption[];
  facilityTypes: LookupOption[];
  programTypes: LookupOption[];
  substations: LookupOption[];
  vendors: LookupOption[];
}

interface FormValues {
  reference_number: string;
  project_name: string;
  funding_year: string;
  funding_agency_id: string | null;
  funding_category_id: string | null;
  project_type_id: string | null;
  project_implementation_status_id: string | null;
  project_cycle_status_id: string | null;
  project_initiator_category_id: string | null;
  substation_id: string | null;
  vendor_id: string | null;
  county: string;
  constituency: string;
  facility_name: string;
  facility_type_id: string | null;
  program_type_id: string | null;
  constituency_code: number | '';
  ward_code: number | '';
  longitude: number | null;
  latitude: number | null;
}

const validationSchema = Yup.object({
  reference_number: Yup.string().required('Reference number is required'),
  project_name: Yup.string().required('Project name is required'),
  facility_name: Yup.string().required('Facility name is required'),
  facility_type_id: Yup.string().nullable().required('Facility type is required'),
  longitude: Yup.number().nullable().required('Please select a location on the map'),
  latitude: Yup.number().nullable().required('Please select a location on the map'),
});

const initialValues: FormValues = {
  reference_number: '',
  project_name: '',
  funding_year: '',
  funding_agency_id: null,
  funding_category_id: null,
  project_type_id: null,
  project_implementation_status_id: null,
  project_cycle_status_id: null,
  project_initiator_category_id: null,
  substation_id: null,
  vendor_id: null,
  county: '',
  constituency: '',
  facility_name: '',
  facility_type_id: null,
  program_type_id: null,
  constituency_code: '',
  ward_code: '',
  longitude: null,
  latitude: null,
};

export default function NewProjectPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [lookupsLoading, setLookupsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/lookups', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: Lookups) => {
        setLookups(data);
        setLookupsLoading(false);
      })
      .catch(() => setLookupsLoading(false));
  }, [token]);

  const formik = useFormik<FormValues>({
    initialValues,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!token) return;

      const facilityPayload: Record<string, unknown> = {
        reference_number: values.reference_number,
        facility_name: values.facility_name,
        facility_type_id: values.facility_type_id,
        program_type_id: values.program_type_id,
        longitude: values.longitude,
        latitude: values.latitude,
      };
      if (values.constituency_code !== '') {
        facilityPayload.constituency_code = values.constituency_code;
      }
      if (values.ward_code !== '') {
        facilityPayload.ward_code = values.ward_code;
      }

      try {
        const res = await fetch('/api/projects/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project: {
              reference_number: values.reference_number,
              project_name: values.project_name,
              funding_year: values.funding_year,
              funding_agency_id: values.funding_agency_id,
              funding_category_id: values.funding_category_id,
              project_type_id: values.project_type_id,
              project_implementation_status_id: values.project_implementation_status_id,
              project_cycle_status_id: values.project_cycle_status_id,
              project_initiator_category_id: values.project_initiator_category_id,
              substation_id: values.substation_id,
              vendor_id: values.vendor_id,
              county: values.county,
              constituency: values.constituency,
            },
            facility: facilityPayload,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || 'Failed to create project');
        } else {
          toast.success('Project created successfully');
          router.push('/projects');
        }
      } catch {
        toast.error('Failed to create project');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const setFieldValueRef = useRef(formik.setFieldValue);
  setFieldValueRef.current = formik.setFieldValue;

  const handleLocationSelect = useCallback((lng: number, lat: number) => {
    setFieldValueRef.current('longitude', lng);
    setFieldValueRef.current('latitude', lat);
  }, []);

  const hasLocation = !!(formik.values.longitude && formik.values.latitude);

  return (
    <Layout>
      <form onSubmit={formik.handleSubmit}>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <Title order={2} fw={700} c="#1c1a17">New Project</Title>
              <Text c="dimmed" size="sm" mt={4}>
                Create a new project and associated facility record
              </Text>
            </div>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.back()}
              color="gray"
            >
              Back
            </Button>
          </div>

          {/* Reference Number */}
          <Paper p="lg" withBorder>
            <Text fw={600} mb={8}>Reference Number</Text>
            <Text size="sm" c="dimmed" mb={12}>
              Shared between the project and the facility record
            </Text>
            <TextInput
              placeholder="e.g. REREC/2024/001"
              size="md"
              {...formik.getFieldProps('reference_number')}
              error={formik.touched.reference_number && formik.errors.reference_number}
            />
          </Paper>

          {lookupsLoading ? (
            <div className="flex justify-center py-8">
              <Loader size="md" />
            </div>
          ) : (
            <>
              {/* Two-column grid: Project Details + Facility Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: Project Details */}
                <Paper p="lg" withBorder>
                  <Title order={4} mb={16}>Project Details</Title>
                  <Stack gap={12}>
                    <TextInput
                      label="Project Name"
                      placeholder="Enter project name"
                      required
                      {...formik.getFieldProps('project_name')}
                      error={formik.touched.project_name && formik.errors.project_name}
                    />
                    <TextInput
                      label="Funding Year"
                      placeholder="e.g. 2024"
                      required
                      {...formik.getFieldProps('funding_year')}
                      error={formik.touched.funding_year && formik.errors.funding_year}
                    />
                    <Select
                      label="Funding Agency"
                      placeholder="Select funding agency"
                      data={lookups?.fundingAgencies ?? []}
                      value={formik.values.funding_agency_id}
                      onChange={(v) => formik.setFieldValue('funding_agency_id', v)}
                      searchable
                      clearable
                      error={formik.touched.funding_agency_id && formik.errors.funding_agency_id}
                    />
                    <Select
                      label="Funding Category"
                      placeholder="Select funding category"
                      data={lookups?.fundingCategories ?? []}
                      value={formik.values.funding_category_id}
                      onChange={(v) => formik.setFieldValue('funding_category_id', v)}
                      searchable
                      clearable
                      error={formik.touched.funding_category_id && formik.errors.funding_category_id}
                    />
                    <Select
                      label="Project Type"
                      placeholder="Select project type"
                      data={lookups?.projectTypes ?? []}
                      value={formik.values.project_type_id}
                      onChange={(v) => formik.setFieldValue('project_type_id', v)}
                      searchable
                      clearable
                      error={formik.touched.project_type_id && formik.errors.project_type_id}
                    />
                    <Select
                      label="Implementation Status"
                      placeholder="Select implementation status"
                      data={lookups?.projectImplementationStatuses ?? []}
                      value={formik.values.project_implementation_status_id}
                      onChange={(v) => formik.setFieldValue('project_implementation_status_id', v)}
                      searchable
                      clearable
                      error={formik.touched.project_implementation_status_id && formik.errors.project_implementation_status_id}
                    />
                    <Select
                      label="Cycle Status"
                      placeholder="Select cycle status"
                      data={lookups?.projectCycleStatuses ?? []}
                      value={formik.values.project_cycle_status_id}
                      onChange={(v) => formik.setFieldValue('project_cycle_status_id', v)}
                      searchable
                      clearable
                      error={formik.touched.project_cycle_status_id && formik.errors.project_cycle_status_id}
                    />
                    <Select
                      label="Initiator Category"
                      placeholder="Select initiator category"
                      data={lookups?.projectInitiatorCategories ?? []}
                      value={formik.values.project_initiator_category_id}
                      onChange={(v) => formik.setFieldValue('project_initiator_category_id', v)}
                      searchable
                      clearable
                      error={formik.touched.project_initiator_category_id && formik.errors.project_initiator_category_id}
                    />
                    <Select
                      label="Substation"
                      placeholder="Select substation"
                      data={lookups?.substations ?? []}
                      value={formik.values.substation_id}
                      onChange={(v) => formik.setFieldValue('substation_id', v)}
                      searchable
                      clearable
                      error={formik.touched.substation_id && formik.errors.substation_id}
                    />
                    <Select
                      label="Vendor"
                      placeholder="Select vendor"
                      data={lookups?.vendors ?? []}
                      value={formik.values.vendor_id}
                      onChange={(v) => formik.setFieldValue('vendor_id', v)}
                      searchable
                      clearable
                      error={formik.touched.vendor_id && formik.errors.vendor_id}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <TextInput
                        label="County"
                        placeholder="Enter county"
                        {...formik.getFieldProps('county')}
                        error={formik.touched.county && formik.errors.county}
                      />
                      <TextInput
                        label="Constituency"
                        placeholder="Enter constituency"
                        {...formik.getFieldProps('constituency')}
                        error={formik.touched.constituency && formik.errors.constituency}
                      />
                    </div>
                  </Stack>
                </Paper>

                {/* RIGHT: Facility Details */}
                <Paper p="lg" withBorder>
                  <Title order={4} mb={16}>Facility Details</Title>
                  <Stack gap={12}>
                    <TextInput
                      label="Facility Name"
                      placeholder="Enter facility name"
                      required
                      {...formik.getFieldProps('facility_name')}
                      error={formik.touched.facility_name && formik.errors.facility_name}
                    />
                    <Select
                      label="Facility Type"
                      placeholder="Select facility type"
                      data={lookups?.facilityTypes ?? []}
                      value={formik.values.facility_type_id}
                      onChange={(v) => formik.setFieldValue('facility_type_id', v)}
                      searchable
                      clearable
                      required
                      error={formik.touched.facility_type_id && formik.errors.facility_type_id}
                    />
                    <Select
                      label="Program Type"
                      placeholder="Select program type"
                      data={lookups?.programTypes ?? []}
                      value={formik.values.program_type_id}
                      onChange={(v) => formik.setFieldValue('program_type_id', v)}
                      searchable
                      clearable
                      error={formik.touched.program_type_id && formik.errors.program_type_id}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <NumberInput
                        label="Constituency Code"
                        placeholder="Enter code"
                        value={formik.values.constituency_code}
                        onChange={(v) => formik.setFieldValue('constituency_code', v)}
                        error={formik.touched.constituency_code && formik.errors.constituency_code}
                      />
                      <NumberInput
                        label="Ward Code"
                        placeholder="Enter code"
                        value={formik.values.ward_code}
                        onChange={(v) => formik.setFieldValue('ward_code', v)}
                        error={formik.touched.ward_code && formik.errors.ward_code}
                      />
                    </div>
                  </Stack>
                </Paper>
              </div>

              {/* Facility Location */}
              <Paper p="lg" withBorder>
                <div className="flex justify-between items-center mb-3" style={{ marginBottom: 12 }}>
                  <Title order={4}>Facility Location</Title>
                  {hasLocation ? (
                    <Badge color="green" leftSection={<IconMapPin size={12} />}>
                      Location selected: {formik.values.latitude?.toFixed(4)}, {formik.values.longitude?.toFixed(4)}
                    </Badge>
                  ) : (
                    <Badge color="gray">No location selected</Badge>
                  )}
                </div>
                <div
                  style={{
                    height: 400,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <FacilityMap onLocationSelect={handleLocationSelect} hasLocation={hasLocation} />
                </div>
                {formik.touched.longitude && formik.errors.longitude && (
                  <Text color="red" size="sm" mt={8}>
                    {formik.errors.longitude}
                  </Text>
                )}
              </Paper>
            </>
          )}

          <Divider />

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={formik.isSubmitting}
              size="md"
              style={{ background: 'linear-gradient(135deg, #e8590c 0%, #fd7e14 100%)' }}
            >
              Create Project &amp; Facility
            </Button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
