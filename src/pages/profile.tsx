import { Avatar, Text, Title, Badge, Card } from '@mantine/core';
import { IconMail, IconUser, IconShield } from '@tabler/icons-react';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/auth';

export default function ProfilePage() {
  const { user } = useAuthStore();

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.username?.[0]?.toUpperCase() ?? 'U');

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-xl">
        <div>
          <Title order={2} fw={700} c="#1c1a17">Profile</Title>
          <Text c="dimmed" size="sm" mt={4}>Your ArcGIS account details</Text>
        </div>

        <Card shadow="xs" radius="lg" p="xl" style={{ border: '1px solid #e9ecef' }}>
          <div className="flex items-center gap-5 mb-6">
            <Avatar src={user?.thumbnailUrl} radius="xl" size={72} color="orange">
              {initials}
            </Avatar>
            <div>
              <Text fw={700} size="lg" c="#1c1a17">{user?.fullName || user?.username}</Text>
              <Text size="sm" c="dimmed">ArcGIS Portal User</Text>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <IconUser size={18} color="#9ca3af" />
              <div>
                <Text size="xs" c="dimmed" fw={500}>Username</Text>
                <Text size="sm" fw={500}>{user?.username || '—'}</Text>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconMail size={18} color="#9ca3af" />
              <div>
                <Text size="xs" c="dimmed" fw={500}>Email</Text>
                <Text size="sm" fw={500}>{user?.email || '—'}</Text>
              </div>
            </div>
            {user?.groups && user.groups.length > 0 && (
              <div className="flex items-start gap-3">
                <IconShield size={18} color="#9ca3af" className="mt-0.5" />
                <div>
                  <Text size="xs" c="dimmed" fw={500} mb={6}>Portal Groups</Text>
                  <div className="flex flex-wrap gap-2">
                    {user.groups.map((g) => (
                      <Badge key={g.id} variant="light" color="orange" size="sm">
                        {g.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
