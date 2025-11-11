import { prisma } from '@invoice-app/database';
import { ResourceType, Action } from './permissions';
import type { UserWithRole } from './types';

/**
 * Audit logging system for permission checks and actions
 *
 * This provides a centralized way to log security-relevant events
 * for compliance, debugging, and security monitoring.
 */

export enum AuditEventType {
  PERMISSION_CHECK = 'permission_check',
  PERMISSION_DENIED = 'permission_denied',
  RESOURCE_ACCESS = 'resource_access',
  RESOURCE_ACCESS_DENIED = 'resource_access_denied',
  ACTION_PERFORMED = 'action_performed',
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  ORG_MEMBERSHIP_CHECK = 'org_membership_check',
}

export interface AuditLogEntry {
  eventType: AuditEventType;
  userId: string;
  userRole: string;
  organizationId?: string | null;
  resourceType?: ResourceType;
  resourceId?: string;
  action?: Action;
  permission?: string;
  success: boolean;
  message?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * In-memory audit log storage (for development)
 * In production, this should be replaced with a proper logging service
 * or database table for audit logs
 */
const auditLogs: AuditLogEntry[] = [];
const MAX_LOGS = 10000; // Keep only last 10k logs in memory

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  // Add to in-memory storage
  auditLogs.push(fullEntry);

  // Keep only last MAX_LOGS entries
  if (auditLogs.length > MAX_LOGS) {
    auditLogs.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const logLevel = entry.success ? 'info' : 'warn';
    console[logLevel]('[AUDIT]', {
      event: entry.eventType,
      user: `${entry.userId} (${entry.userRole})`,
      resource: entry.resourceType ? `${entry.resourceType}:${entry.resourceId}` : 'N/A',
      action: entry.action || 'N/A',
      success: entry.success,
      message: entry.message,
    });
  }

  // In production, you might want to:
  // - Write to a dedicated audit_log table in the database
  // - Send to a logging service (e.g., CloudWatch, Datadog, LogRocket)
  // - Send to a SIEM system for security monitoring
}

/**
 * Log a permission check
 */
export async function logPermissionCheck(
  user: UserWithRole,
  permission: string,
  granted: boolean,
  message?: string
): Promise<void> {
  await logAuditEvent({
    eventType: granted ? AuditEventType.PERMISSION_CHECK : AuditEventType.PERMISSION_DENIED,
    userId: user.id,
    userRole: user.role,
    organizationId: user.organizationId,
    permission,
    success: granted,
    message: message || (granted ? 'Permission granted' : 'Permission denied'),
  });
}

/**
 * Log a resource access attempt
 */
export async function logResourceAccess(
  user: UserWithRole,
  resourceType: ResourceType,
  resourceId: string,
  granted: boolean,
  message?: string
): Promise<void> {
  await logAuditEvent({
    eventType: granted ? AuditEventType.RESOURCE_ACCESS : AuditEventType.RESOURCE_ACCESS_DENIED,
    userId: user.id,
    userRole: user.role,
    organizationId: user.organizationId,
    resourceType,
    resourceId,
    success: granted,
    message: message || (granted ? 'Access granted' : 'Access denied'),
  });
}

/**
 * Log an action performed on a resource
 */
export async function logAction(
  user: UserWithRole,
  action: Action,
  resourceType: ResourceType,
  resourceId: string,
  success: boolean,
  message?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.ACTION_PERFORMED,
    userId: user.id,
    userRole: user.role,
    organizationId: user.organizationId,
    action,
    resourceType,
    resourceId,
    success,
    message: message || `${action} ${resourceType}`,
    metadata,
  });
}

/**
 * Log an authentication attempt
 */
export async function logAuthAttempt(
  userId: string,
  success: boolean,
  message?: string
): Promise<void> {
  const user = success ? await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true },
  }) : null;

  await logAuditEvent({
    eventType: success ? AuditEventType.AUTH_SUCCESS : AuditEventType.AUTH_FAILURE,
    userId,
    userRole: user?.role || 'UNKNOWN',
    organizationId: user?.organizationId,
    success,
    message: message || (success ? 'Authentication successful' : 'Authentication failed'),
  });
}

/**
 * Log an organization membership check
 */
export async function logOrgMembershipCheck(
  user: UserWithRole,
  organizationId: string,
  isMember: boolean
): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.ORG_MEMBERSHIP_CHECK,
    userId: user.id,
    userRole: user.role,
    organizationId: user.organizationId,
    success: isMember,
    message: isMember
      ? `User is member of organization ${organizationId}`
      : `User is not member of organization ${organizationId}`,
    metadata: { checkedOrganizationId: organizationId },
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  return auditLogs
    .filter((log) => log.userId === userId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get audit logs for an organization
 */
export async function getOrganizationAuditLogs(
  organizationId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  return auditLogs
    .filter((log) => log.organizationId === organizationId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  resourceType: ResourceType,
  resourceId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  return auditLogs
    .filter((log) => log.resourceType === resourceType && log.resourceId === resourceId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get all denied access attempts (for security monitoring)
 */
export async function getDeniedAccessLogs(limit: number = 100): Promise<AuditLogEntry[]> {
  return auditLogs
    .filter((log) => !log.success)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Clear audit logs (for testing/development only)
 */
export function clearAuditLogs(): void {
  if (process.env.NODE_ENV !== 'production') {
    auditLogs.length = 0;
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(): Promise<{
  total: number;
  byEventType: Record<string, number>;
  deniedCount: number;
  lastHour: number;
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const byEventType: Record<string, number> = {};
  let deniedCount = 0;
  let lastHour = 0;

  for (const log of auditLogs) {
    byEventType[log.eventType] = (byEventType[log.eventType] || 0) + 1;

    if (!log.success) {
      deniedCount++;
    }

    if (log.timestamp > oneHourAgo) {
      lastHour++;
    }
  }

  return {
    total: auditLogs.length,
    byEventType,
    deniedCount,
    lastHour,
  };
}
