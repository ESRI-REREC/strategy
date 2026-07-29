import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  IconLayoutDashboard,
  IconFolderOpen,
  IconBuilding,
  IconMap2,
  IconDatabase,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from '@tabler/icons-react';
import { NavLink, ScrollArea, ActionIcon, Tooltip } from '@mantine/core';

const navItems = [
  { label: 'Dashboard', href: '/', icon: IconLayoutDashboard },
  { label: 'Projects', href: '/projects', icon: IconFolderOpen },
  { label: 'Facilities', href: '/facilities', icon: IconBuilding },
  { label: 'Map', href: '/gis', icon: IconMap2 },
  { label: 'Reference', href: '/reference', icon: IconDatabase },
];

const STORAGE_KEY = 'sp-sidebar-collapsed';

export default function Sidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      }
      return next;
    });
  };

  return (
    <aside
      className="shrink-0 overflow-hidden flex flex-col"
      style={{ width: collapsed ? 72 : 260, background: '#1c1a17', transition: 'width 0.2s ease' }}
    >
      <div
        className="flex items-center"
        style={{ justifyContent: collapsed ? 'center' : 'flex-end', padding: '8px 12px' }}
      >
        <Tooltip label={collapsed ? 'Expand' : 'Collapse'} position="right" withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            styles={{ root: { borderRadius: 0, color: 'rgba(255,255,255,0.6)' } }}
          >
            {collapsed ? <IconLayoutSidebarLeftExpand size={20} /> : <IconLayoutSidebarLeftCollapse size={20} />}
          </ActionIcon>
        </Tooltip>
      </div>

      <ScrollArea type="never" className="flex-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = router.pathname === item.href;
          const link = (
            <NavLink
              label={collapsed ? undefined : item.label}
              leftSection={<Icon size={18} />}
              active={active}
              styles={{
                root: {
                  borderRadius: 0,
                  margin: '2px 8px',
                  padding: collapsed ? '10px 0' : undefined,
                  justifyContent: collapsed ? 'center' : undefined,
                  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  background: active ? 'rgba(253, 126, 20, 0.22)' : 'transparent',
                  '&:hover': { background: 'rgba(255,255,255,0.06)', color: '#fff' },
                },
                section: { marginInlineEnd: collapsed ? 0 : undefined },
                label: { fontSize: 14 },
              }}
            />
          );

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              {collapsed ? (
                <Tooltip label={item.label} position="right" withArrow>
                  <div>{link}</div>
                </Tooltip>
              ) : (
                link
              )}
            </Link>
          );
        })}
      </ScrollArea>
    </aside>
  );
}
