import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
	Title,
	Text,
	TextInput,
	Select,
	Button,
	Paper,
	Group,
	Stack,
	Loader,
	Badge,
	Stepper,
	Checkbox,
	Divider
} from "@mantine/core";
import { IconArrowLeft, IconMapPin } from "@tabler/icons-react";
import { toast } from "react-toastify";
import Layout from "@/components/Layout";
import { useAuthStore } from "@/store/auth";

const FacilityMap = dynamic(() => import("@/components/FacilityMap"), {
	ssr: false
});

interface LookupOption {
	value: string;
	label: string;
}

interface FacilityTypeOption {
	value: string;
	label: string;
	category: string;
}

interface Lookups {
	projectTypes: LookupOption[];
	fundingAgencies: LookupOption[];
	fundingCategories: LookupOption[];
	projectImplementationStatuses: LookupOption[];
	projectCycleStatuses: LookupOption[];
	projectInitiatorCategories: LookupOption[];
	facilityCategories: LookupOption[];
	facilityTypes: FacilityTypeOption[];
	programTypes: LookupOption[];
	substations: LookupOption[];
	vendors: LookupOption[];
}

interface ConstituencyOption {
	value: string;
	label: string;
	county: string;
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
	facility_category_id: string | null;
	facility_type_id: string | null;
	program_type_id: string | null;
	longitude: number | null;
	latitude: number | null;
}

const validationSchema = Yup.object({
	reference_number: Yup.string().required("Reference number is required"),
	project_name: Yup.string().required("Project name is required"),
	county: Yup.string().required("County is required"),
	constituency: Yup.string().required("Constituency is required"),
	project_implementation_status_id: Yup.string()
		.nullable()
		.required("Implementation status is required"),
	facility_name: Yup.string().required("Facility name is required"),
	facility_type_id: Yup.string()
		.nullable()
		.required("Facility type is required"),
	longitude: Yup.number()
		.nullable()
		.required("Please select a location on the map"),
	latitude: Yup.number()
		.nullable()
		.required("Please select a location on the map")
});

const initialValues: FormValues = {
	reference_number: "",
	project_name: "",
	funding_year: "",
	funding_agency_id: null,
	funding_category_id: null,
	project_type_id: null,
	project_implementation_status_id: null,
	project_cycle_status_id: null,
	project_initiator_category_id: null,
	substation_id: null,
	vendor_id: null,
	county: "",
	constituency: "",
	facility_name: "",
	facility_category_id: null,
	facility_type_id: null,
	program_type_id: null,
	longitude: null,
	latitude: null
};

export default function NewProjectPage() {
	const router = useRouter();
	const token = useAuthStore((s) => s.token);
	const [lookups, setLookups] = useState<Lookups | null>(null);
	const [lookupsLoading, setLookupsLoading] = useState(true);
	const [counties, setCounties] = useState<LookupOption[]>([]);
	const [constituencies, setConstituencies] = useState<ConstituencyOption[]>(
		[]
	);
	const [active, setActive] = useState(0);
	const [sameAsProject, setSameAsProject] = useState(false);

	useEffect(() => {
		if (!token) return;
		fetch("/api/lookups", { headers: { Authorization: `Bearer ${token}` } })
			.then((r) => r.json())
			.then((data: Lookups) => {
				setLookups(data);
				setLookupsLoading(false);
			})
			.catch(() => setLookupsLoading(false));

		fetch("/api/geo", { headers: { Authorization: `Bearer ${token}` } })
			.then((r) => r.json())
			.then(
				(data: {
					counties: LookupOption[];
					constituencies: ConstituencyOption[];
				}) => {
					setCounties(data.counties ?? []);
					setConstituencies(data.constituencies ?? []);
				}
			)
			.catch(() => {
				/* county/constituency pickers will simply be empty */
			});
	}, [token]);

	const formik = useFormik<FormValues>({
		initialValues,
		validationSchema,
		onSubmit: async (values, { setSubmitting }) => {
			if (!token) return;

			// Resolve a select's chosen id to its human-readable label so we can persist
			// both the GUID (*_id) and the label on the hosted layer.
			const labelOf = (
				opts: { value: string; label: string }[] | undefined,
				id: string | null
			) => (id ? (opts?.find((o) => o.value === id)?.label ?? null) : null);

			const facilityPayload: Record<string, unknown> = {
				reference_number: values.reference_number,
				facility_name: values.facility_name,
				facility_category: labelOf(
					lookups?.facilityCategories,
					values.facility_category_id
				),
				facility_type: labelOf(lookups?.facilityTypes, values.facility_type_id),
				program_type: labelOf(lookups?.programTypes, values.program_type_id),
				longitude: values.longitude,
				latitude: values.latitude
			};

			try {
				const res = await fetch("/api/projects/create", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({
						project: {
							reference_number: values.reference_number,
							project_name: values.project_name,
							funding_year: values.funding_year,
							funding_agency: labelOf(
								lookups?.fundingAgencies,
								values.funding_agency_id
							),
							funding_category: labelOf(
								lookups?.fundingCategories,
								values.funding_category_id
							),
							project_type: labelOf(
								lookups?.projectTypes,
								values.project_type_id
							),
							project_implementation_status: labelOf(
								lookups?.projectImplementationStatuses,
								values.project_implementation_status_id
							),
							project_cycle_status: labelOf(
								lookups?.projectCycleStatuses,
								values.project_cycle_status_id
							),
							project_initiator_category: labelOf(
								lookups?.projectInitiatorCategories,
								values.project_initiator_category_id
							),
							substation_name: labelOf(
								lookups?.substations,
								values.substation_id
							),
							vendor_name: labelOf(lookups?.vendors, values.vendor_id),
							county: values.county,
							constituency: values.constituency
						},
						facility: facilityPayload
					})
				});

				const data = await res.json();

				if (!res.ok) {
					toast.error(data.error || "Failed to create project");
				} else {
					toast.success("Project created successfully");
					router.push("/projects");
				}
			} catch {
				toast.error("Failed to create project");
			} finally {
				setSubmitting(false);
			}
		}
	});

	const setFieldValueRef = useRef(formik.setFieldValue);
	setFieldValueRef.current = formik.setFieldValue;

	const handleLocationSelect = useCallback((lng: number, lat: number) => {
		setFieldValueRef.current("longitude", lng);
		setFieldValueRef.current("latitude", lat);
	}, []);

	// Keep facility name mirrored to project name while "same as project" is checked.
	useEffect(() => {
		if (sameAsProject)
			setFieldValueRef.current("facility_name", formik.values.project_name);
	}, [sameAsProject, formik.values.project_name]);

	// Default the implementation status to the first option (lowest sort_order, as
	// ordered by the lookups API) once lookups load, unless one is already chosen.
	useEffect(() => {
		const first = lookups?.projectImplementationStatuses[0];
		if (first && !formik.values.project_implementation_status_id) {
			setFieldValueRef.current("project_implementation_status_id", first.value);
		}
	}, [lookups]); // eslint-disable-line react-hooks/exhaustive-deps

	const hasLocation = !!(formik.values.longitude && formik.values.latitude);

	// Constituencies are limited to the chosen county; show all when none is selected.
	const constituencyOptions = formik.values.county
		? constituencies.filter((c) => c.county === formik.values.county)
		: constituencies;

	const handleCountyChange = (value: string | null) => {
		formik.setFieldValue("county", value ?? "");
		// Drop the constituency if it no longer belongs to the newly chosen county.
		if (value && formik.values.constituency) {
			const con = constituencies.find(
				(c) => c.value === formik.values.constituency
			);
			if (con && con.county !== value) formik.setFieldValue("constituency", "");
		}
	};

	const handleConstituencyChange = (value: string | null) => {
		formik.setFieldValue("constituency", value ?? "");
		// Auto-fill county from the constituency when none has been selected yet.
		if (value && !formik.values.county) {
			const con = constituencies.find((c) => c.value === value);
			if (con) formik.setFieldValue("county", con.county);
		}
	};

	// Facility types are limited to the chosen category; show all when none is selected.
	const facilityTypeOptions = formik.values.facility_category_id
		? (lookups?.facilityTypes ?? []).filter(
				(t) => t.category === formik.values.facility_category_id
			)
		: (lookups?.facilityTypes ?? []);

	const handleCategoryChange = (value: string | null) => {
		formik.setFieldValue("facility_category_id", value);
		// Drop the facility type if it no longer belongs to the newly chosen category.
		if (value && formik.values.facility_type_id) {
			const t = lookups?.facilityTypes.find(
				(ft) => ft.value === formik.values.facility_type_id
			);
			if (t && t.category !== value)
				formik.setFieldValue("facility_type_id", null);
		}
	};

	const handleFacilityTypeChange = (value: string | null) => {
		formik.setFieldValue("facility_type_id", value);
		// Auto-fill category from the type when none has been selected yet.
		if (value && !formik.values.facility_category_id) {
			const t = lookups?.facilityTypes.find((ft) => ft.value === value);
			if (t && t.category)
				formik.setFieldValue("facility_category_id", t.category);
		}
	};

	const stepFields: Record<number, (keyof FormValues)[]> = {
		0: [
			"reference_number",
			"project_name",
			"county",
			"constituency",
			"project_implementation_status_id"
		],
		1: ["facility_name", "facility_type_id", "longitude", "latitude"]
	};

	const nextStep = async () => {
		const errors = await formik.validateForm();
		const fields = stepFields[active] ?? [];
		const hasErrors = fields.some((f) => errors[f]);
		if (hasErrors) {
			formik.setTouched(
				{
					...formik.touched,
					...Object.fromEntries(fields.map((f) => [f, true]))
				},
				false
			);
			return;
		}
		setActive((c) => c + 1);
	};

	const prevStep = () => setActive((c) => Math.max(0, c - 1));

	return (
		<Layout>
			<form onSubmit={formik.handleSubmit}>
				<div className="flex flex-col gap-6">
					{/* Header */}
					<div className="flex justify-between items-center">
						<div>
							<Title order={2} fw={700} c="#1c1a17">
								New Project
							</Title>
							<Text c="dimmed" size="sm" mt={4}>
								Create a new project and associated facility record
							</Text>
						</div>
						<Button
							variant="subtle"
							leftSection={<IconArrowLeft size={16} />}
							onClick={() => router.back()}
							color="gray">
							Back
						</Button>
					</div>

					{lookupsLoading ? (
						<div className="flex justify-center py-8">
							<Loader size="md" />
						</div>
					) : (
						<>
							{/* Reference Number */}
							<Paper p="lg" withBorder>
								<Text fw={600} mb={8}>
									Reference Number
								</Text>
								<Text size="sm" c="dimmed" mb={12}>
									Shared between the project and the facility record
								</Text>
								<TextInput
									variant="filled"
									placeholder="e.g. REREC/2024/001"
									size="md"
									{...formik.getFieldProps("reference_number")}
									error={
										formik.touched.reference_number &&
										formik.errors.reference_number
									}
								/>
							</Paper>

							<Stepper
								active={active}
								onStepClick={setActive}
								allowNextStepsSelect={false}>
								{/* STEP 1: Project Details */}
								<Stepper.Step label="Project" description="Project details">
									<Stack gap={16} mt="xl">
										<Paper p="lg" withBorder>
											<Title order={4} mb={16}>
												Project Details
											</Title>
											<Stack gap={12}>
												<TextInput
													label="Project Name"
													placeholder="Enter project name"
													required
													{...formik.getFieldProps("project_name")}
													error={
														formik.touched.project_name &&
														formik.errors.project_name
													}
												/>
												<TextInput
													label="Funding Year"
													placeholder="e.g. 2024"
													required
													{...formik.getFieldProps("funding_year")}
													error={
														formik.touched.funding_year &&
														formik.errors.funding_year
													}
												/>
												<div className="grid grid-cols-2 gap-3">
													<Select
														label="County"
														placeholder="Select county"
														data={counties}
														value={formik.values.county || null}
														onChange={handleCountyChange}
														searchable
														clearable
														required
														error={
															formik.touched.county && formik.errors.county
														}
													/>
													<Select
														label="Constituency"
														placeholder="Select constituency"
														data={constituencyOptions}
														value={formik.values.constituency || null}
														onChange={handleConstituencyChange}
														searchable
														clearable
														required
														error={
															formik.touched.constituency &&
															formik.errors.constituency
														}
													/>
												</div>
												<Select
													label="Implementation Status"
													placeholder="Select implementation status"
													data={lookups?.projectImplementationStatuses ?? []}
													value={formik.values.project_implementation_status_id}
													onChange={(v) =>
														formik.setFieldValue(
															"project_implementation_status_id",
															v
														)
													}
													searchable
													clearable
													required
													error={
														formik.touched.project_implementation_status_id &&
														formik.errors.project_implementation_status_id
													}
												/>
												<Divider
													label="OPTIONAL"
													labelPosition="center"
													my={4}
												/>
												<Select
													label="Funding Agency"
													placeholder="Select funding agency"
													data={lookups?.fundingAgencies ?? []}
													value={formik.values.funding_agency_id}
													onChange={(v) =>
														formik.setFieldValue("funding_agency_id", v)
													}
													searchable
													clearable
													error={
														formik.touched.funding_agency_id &&
														formik.errors.funding_agency_id
													}
												/>
												<Select
													label="Funding Category"
													placeholder="Select funding category"
													data={lookups?.fundingCategories ?? []}
													value={formik.values.funding_category_id}
													onChange={(v) =>
														formik.setFieldValue("funding_category_id", v)
													}
													searchable
													clearable
													error={
														formik.touched.funding_category_id &&
														formik.errors.funding_category_id
													}
												/>
												<Select
													label="Project Type"
													placeholder="Select project type"
													data={lookups?.projectTypes ?? []}
													value={formik.values.project_type_id}
													onChange={(v) =>
														formik.setFieldValue("project_type_id", v)
													}
													searchable
													clearable
													error={
														formik.touched.project_type_id &&
														formik.errors.project_type_id
													}
												/>
												<Select
													label="Cycle Status"
													placeholder="Select cycle status"
													data={lookups?.projectCycleStatuses ?? []}
													value={formik.values.project_cycle_status_id}
													onChange={(v) =>
														formik.setFieldValue("project_cycle_status_id", v)
													}
													searchable
													clearable
													error={
														formik.touched.project_cycle_status_id &&
														formik.errors.project_cycle_status_id
													}
												/>
												<Select
													label="Initiator Category"
													placeholder="Select initiator category"
													data={lookups?.projectInitiatorCategories ?? []}
													value={formik.values.project_initiator_category_id}
													onChange={(v) =>
														formik.setFieldValue(
															"project_initiator_category_id",
															v
														)
													}
													searchable
													clearable
													error={
														formik.touched.project_initiator_category_id &&
														formik.errors.project_initiator_category_id
													}
												/>
												<Select
													label="Substation"
													placeholder="Select substation"
													data={lookups?.substations ?? []}
													value={formik.values.substation_id}
													onChange={(v) =>
														formik.setFieldValue("substation_id", v)
													}
													searchable
													clearable
													error={
														formik.touched.substation_id &&
														formik.errors.substation_id
													}
												/>
												<Select
													label="Vendor"
													placeholder="Select vendor"
													data={lookups?.vendors ?? []}
													value={formik.values.vendor_id}
													onChange={(v) => formik.setFieldValue("vendor_id", v)}
													searchable
													clearable
													error={
														formik.touched.vendor_id && formik.errors.vendor_id
													}
												/>
											</Stack>
										</Paper>
									</Stack>
								</Stepper.Step>

								{/* STEP 2: Facility Details */}
								<Stepper.Step
									label="Facility"
									description="Facility & location">
									<Stack gap={16} mt="xl">
										<Paper p="lg" withBorder>
											<Title order={4} mb={16}>
												Facility Details
											</Title>
											<Stack gap={12}>
												<Checkbox
													label="Facility name is the same as the project name"
													checked={sameAsProject}
													onChange={(e) =>
														setSameAsProject(e.currentTarget.checked)
													}
												/>
												<TextInput
													label="Facility Name"
													placeholder="Enter facility name"
													required
													disabled={sameAsProject}
													{...formik.getFieldProps("facility_name")}
													error={
														formik.touched.facility_name &&
														formik.errors.facility_name
													}
												/>
												<Select
													label="Facility Category"
													placeholder="Select facility category"
													data={lookups?.facilityCategories ?? []}
													value={formik.values.facility_category_id}
													onChange={handleCategoryChange}
													searchable
													clearable
												/>
												<Select
													label="Facility Type"
													placeholder="Select facility type"
													data={facilityTypeOptions}
													value={formik.values.facility_type_id}
													onChange={handleFacilityTypeChange}
													searchable
													clearable
													required
													error={
														formik.touched.facility_type_id &&
														formik.errors.facility_type_id
													}
												/>
												<Select
													label="Program Type"
													placeholder="Select program type"
													data={lookups?.programTypes ?? []}
													value={formik.values.program_type_id}
													onChange={(v) =>
														formik.setFieldValue("program_type_id", v)
													}
													searchable
													clearable
												/>
											</Stack>
										</Paper>

										{/* Facility Location */}
										<Paper p="lg" withBorder>
											<div
												className="flex justify-between items-center mb-3"
												style={{ marginBottom: 12 }}>
												<Title order={4}>Facility Location</Title>
												{hasLocation ? (
													<Badge
														color="green"
														leftSection={<IconMapPin size={12} />}>
														Location selected:{" "}
														{formik.values.latitude?.toFixed(4)},{" "}
														{formik.values.longitude?.toFixed(4)}
													</Badge>
												) : (
													<Badge color="gray">No location selected</Badge>
												)}
											</div>
											<div
												style={{
													height: "100vh",
													border: "1px solid #e5e7eb",
													borderRadius: 8,
													overflow: "hidden"
												}}>
												<FacilityMap
													onLocationSelect={handleLocationSelect}
													hasLocation={hasLocation}
												/>
											</div>
											{formik.touched.longitude && formik.errors.longitude && (
												<Text color="red" size="sm" mt={8}>
													{formik.errors.longitude}
												</Text>
											)}
										</Paper>
									</Stack>
								</Stepper.Step>
							</Stepper>

							{/* Step navigation */}
							<Group justify="space-between" mt="md">
								{active === 0 ? (
									<Button variant="default" onClick={() => router.back()}>
										Cancel
									</Button>
								) : (
									<Button
										variant="default"
										leftSection={<IconArrowLeft size={16} />}
										onClick={prevStep}>
										Back
									</Button>
								)}
								{active < 1 ? (
									<Button
										onClick={nextStep}
										size="md"
										style={{
											background:
												"linear-gradient(135deg, #e8590c 0%, #fd7e14 100%)"
										}}>
										Next
									</Button>
								) : (
									<Button
										type="submit"
										loading={formik.isSubmitting}
										size="md"
										style={{
											background:
												"linear-gradient(135deg, #e8590c 0%, #fd7e14 100%)"
										}}>
										Create Project &amp; Facility
									</Button>
								)}
							</Group>
						</>
					)}
				</div>
			</form>
		</Layout>
	);
}
