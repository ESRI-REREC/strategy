import { useRouter } from 'next/router';
import { Avatar, Text, Menu, UnstyledButton, Divider } from '@mantine/core';
import { IconUser, IconLogout, IconChevronDown } from '@tabler/icons-react';
import { useAuthStore } from '@/store/auth';
import { toast } from 'react-toastify';

export default function Navbar() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuth();
      router.push('/login');
      toast.info('Signed out successfully');
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.username?.[0]?.toUpperCase() ?? 'U');

  return (
    <header className="h-16 w-full bg-white border-b border-gray-200 flex items-center justify-between px-6 z-50 shadow-sm">
      <div className="flex items-center gap-0">
        <img src="/logo.png" alt="REREC logo" className="h-9 w-auto block" />
        <div className="w-px h-7 bg-gray-200 mx-4 shrink-0" />
        <Text size="sm" fw={500} c="#6b7280" style={{ letterSpacing: '0.01em' }}>
          Strategy & Planning Portal
        </Text>
      </div>

      <Menu shadow="md" width={220} position="bottom-end">
        <Menu.Target>
          <UnstyledButton className="rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-50">
            <div className="flex items-center gap-2.5">
              <Avatar src={user?.thumbnailUrl} radius="xl" size={36} color="orange">
                {initials}
              </Avatar>
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-[#1c1a17] leading-tight truncate max-w-[160px]">
                  {user?.fullName || user?.username || 'User'}
                </p>
                <p className="text-xs text-gray-400 leading-tight truncate max-w-[160px]">
                  {user?.email || user?.username || ''}
                </p>
              </div>
              <IconChevronDown size={14} color="#9ca3af" className="shrink-0" />
            </div>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <div className="px-3 py-2.5">
            <Text size="sm" fw={600}>{user?.fullName || user?.username}</Text>
            <Text size="xs" c="dimmed">{user?.email}</Text>
          </div>
          <Divider />
          <Menu.Item leftSection={<IconUser size={16} />} onClick={() => router.push('/profile')}>
            Profile
          </Menu.Item>
          <Menu.Item leftSection={<IconLogout size={16} />} color="red" onClick={handleSignOut}>
            Sign out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </header>
  );
}
