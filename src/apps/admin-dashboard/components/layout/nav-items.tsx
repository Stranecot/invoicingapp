'use client';

import { Home, Building2, Users, Mail, Settings, CreditCard } from 'lucide-react';

export const navItems = [
  {
    href: '/',
    icon: Home,
    label: 'Dashboard',
  },
  {
    href: '/organizations',
    icon: Building2,
    label: 'Organizations',
  },
  {
    href: '/users',
    icon: Users,
    label: 'Users',
  },
  {
    href: '/invitations',
    icon: Mail,
    label: 'Invitations',
  },
  {
    href: '/plans',
    icon: CreditCard,
    label: 'Subscription Plans',
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Settings',
  },
];
