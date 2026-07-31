import { Title, Text, Card, Button } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/auth';

const DEFAULT_DASHBOARD_URL =
  'https://gisportal.rerec.co.ke/portal/apps/dashboards/ca98cc078cae4071998041ccf847de45';

export default function Dashboard() {
  const { token, _hasHydrated } = useAuthStore();
  const authedToken = _hasHydrated ? token : null;

  const dashboardUrl = process.env.NEXT_PUBLIC_OVERVIEW_DASHBOARD_URL || DEFAULT_DASHBOARD_URL;
  const portalUrl =
    process.env.NEXT_PUBLIC_ARCGIS_PORTAL_URL || 'https://gisportal.rerec.co.ke/portal';

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <Title order={2} fw={700} c="#1c1a17">Dashboard</Title>
          <Text c="dimmed" size="sm" mt={4}>Analytics overview of projects and facilities</Text>
        </div>

        {dashboardUrl ? (
          <div
            className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
            style={{ height: 'calc(100vh - 160px)', minHeight: 500 }}
          >
            <iframe
              src={authedToken ? `${dashboardUrl}?token=${authedToken}` : dashboardUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Overview Dashboard"
              allowFullScreen
            />
          </div>
        ) : (
          <Card shadow="xs" radius="lg" p="xl" style={{ border: '1px solid #e9ecef' }}>
            <Text fw={600} c="#1c1a17" mb={8}>Dashboard Not Configured</Text>
            <Text size="sm" c="dimmed" mb={16}>
              Set NEXT_PUBLIC_OVERVIEW_DASHBOARD_URL in your .env.local to embed the ArcGIS dashboard here.
            </Text>
            <Button
              component="a"
              href={`${portalUrl}/home`}
              target="_blank"
              variant="light"
              color="orange"
              leftSection={<IconExternalLink size={16} />}
            >
              Open ArcGIS Portal
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
}
