import { Title, Text, Tabs } from '@mantine/core';
import {
  IconCategory, IconBuildingFactory, IconBuildingBank, IconFolderDollar,
  IconLayoutList, IconCircleDotted, IconProgressCheck, IconUsersGroup,
  IconFileDescription, IconBolt, IconTruck, IconTransform,
} from '@tabler/icons-react';
import Layout from '@/components/Layout';
import { FacilityCategoriesPanel } from './facility-categories';
import { FacilityTypesPanel } from './facility-types';
import { FundingAgenciesPanel } from './funding-agencies';
import { FundingCategoriesPanel } from './funding-categories';
import { ProgramTypesPanel } from './program-types';
import { ProjectCycleStatusesPanel } from './project-cycle-statuses';
import { ProjectImplementationStatusesPanel } from './project-implementation-statuses';
import { ProjectInitiatorCategoriesPanel } from './project-initiator-categories';
import { ProjectTypesPanel } from './project-types';
import { SubstationsPanel } from './substations';
import { VendorsPanel } from './vendors';
import { VoltageTransformationsPanel } from './voltage-transformations';

const tabs = [
  { value: 'facility-categories', label: 'Facility Categories', icon: IconCategory, Panel: FacilityCategoriesPanel },
  { value: 'facility-types', label: 'Facility Types', icon: IconBuildingFactory, Panel: FacilityTypesPanel },
  { value: 'funding-agencies', label: 'Funding Agencies', icon: IconBuildingBank, Panel: FundingAgenciesPanel },
  { value: 'funding-categories', label: 'Funding Categories', icon: IconFolderDollar, Panel: FundingCategoriesPanel },
  { value: 'program-types', label: 'Program Types', icon: IconLayoutList, Panel: ProgramTypesPanel },
  { value: 'project-cycle-statuses', label: 'Project Cycle Statuses', icon: IconCircleDotted, Panel: ProjectCycleStatusesPanel },
  { value: 'project-implementation-statuses', label: 'Implementation Statuses', icon: IconProgressCheck, Panel: ProjectImplementationStatusesPanel },
  { value: 'project-initiator-categories', label: 'Initiator Categories', icon: IconUsersGroup, Panel: ProjectInitiatorCategoriesPanel },
  { value: 'project-types', label: 'Project Types', icon: IconFileDescription, Panel: ProjectTypesPanel },
  { value: 'substations', label: 'Substations', icon: IconBolt, Panel: SubstationsPanel },
  { value: 'vendors', label: 'Vendors', icon: IconTruck, Panel: VendorsPanel },
  { value: 'voltage-transformations', label: 'Voltage Transformations', icon: IconTransform, Panel: VoltageTransformationsPanel },
];

export default function ReferencePage() {
  return (
    <Layout>
      <div className="flex flex-col gap-7">
        <div>
          <Title order={2} fw={700} c="#1c1a17">Reference</Title>
          <Text c="dimmed" size="sm" mt={4}>Manage all reference data tables in one place</Text>
        </div>

        <Tabs defaultValue="facility-categories" orientation="vertical" variant="pills" color="orange">
          <Tabs.List style={{ minWidth: 240, borderRight: '1px solid #e9ecef', paddingRight: 8 }}>
            {tabs.map((t) => (
              <Tabs.Tab key={t.value} value={t.value} leftSection={<t.icon size={16} />}>
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {tabs.map((t) => (
            <Tabs.Panel key={t.value} value={t.value} keepMounted={false} pl="xl">
              <t.Panel />
            </Tabs.Panel>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
