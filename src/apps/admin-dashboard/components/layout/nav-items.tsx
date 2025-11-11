'use client';

import { Home, Building2, Users, Mail, Settings } from 'lucide-react';

export const navItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Dashboard',
  },
  {
    href: '/dashboard/organizations',
    icon: Building2,
    label: 'Organizations',
  },
  {
    href: '/dashboard/users',
    icon: Users,
    label: 'Users',
  },
  {
    href: '/dashboard/invitations',
    icon: Mail,
    label: 'Invitations',
  },
  {
    href: '/dashboard/settings',
    icon: Settings,
    label: 'Settings',
  },
];
