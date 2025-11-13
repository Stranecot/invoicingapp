/**
 * Plan-based limits for organizations
 */

import { BillingPlan } from '@prisma/client';

export const PLAN_LIMITS = {
  [BillingPlan.FREE]: {
    maxUsers: 1, // Only the owner
    maxInvoices: 10,
    features: ['basic_invoicing', 'basic_expenses'],
  },
  [BillingPlan.PRO]: {
    maxUsers: 5, // Owner + 4 employees
    maxInvoices: 100,
    features: ['basic_invoicing', 'basic_expenses', 'advanced_reports', 'custom_branding'],
  },
  [BillingPlan.ENTERPRISE]: {
    maxUsers: 999999, // Unlimited users
    maxInvoices: -1, // Unlimited
    features: [
      'basic_invoicing',
      'basic_expenses',
      'advanced_reports',
      'custom_branding',
      'api_access',
      'priority_support',
      'custom_integrations',
    ],
  },
} as const;

/**
 * Get the maximum number of users allowed for a given plan
 */
export function getMaxUsersForPlan(plan: BillingPlan): number {
  return PLAN_LIMITS[plan].maxUsers;
}

/**
 * Check if an organization can invite more users
 */
export function canInviteMoreUsers(
  currentUserCount: number,
  plan: BillingPlan
): boolean {
  const maxUsers = getMaxUsersForPlan(plan);
  return currentUserCount < maxUsers;
}

/**
 * Get remaining invitation slots for an organization
 */
export function getRemainingInvitations(
  currentUserCount: number,
  plan: BillingPlan
): number {
  const maxUsers = getMaxUsersForPlan(plan);
  return Math.max(0, maxUsers - currentUserCount);
}

/**
 * Check if a user has permission to invite others
 * Only OWNER role can invite employees within their organization
 */
export function canInviteUsers(userRole: string): boolean {
  return userRole === 'OWNER';
}
