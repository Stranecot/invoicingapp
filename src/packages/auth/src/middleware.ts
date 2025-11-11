import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './server';
import { canAccessResource, canPerformAction } from './resource-access';
import { Permission, ResourceType, Action } from './permissions';
import { ForbiddenError, UnauthorizedError } from './types';
import type { UserWithRole } from './types';

/**
 * Middleware and guards for API route protection
 *
 * These utilities provide reusable permission checking for Next.js API routes
 */

/**
 * Generic permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  user?: UserWithRole;
  error?: string;
  statusCode?: number;
}

/**
 * Middleware to require authentication
 * Returns the authenticated user or throws an error
 */
export async function requireAuth(): Promise<UserWithRole> {
  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    throw new UnauthorizedError('Authentication required');
  }
}

/**
 * Middleware to require specific permission
 */
export async function requirePermission(permission: Permission): Promise<UserWithRole> {
  const user = await requireAuth();
  const { roleHasPermission } = await import('./permissions');

  if (!roleHasPermission(user.role, permission)) {
    throw new ForbiddenError(`Missing required permission: ${permission}`);
  }

  return user;
}

/**
 * Middleware to require any of the specified permissions
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<UserWithRole> {
  const user = await requireAuth();
  const { roleHasAnyPermission } = await import('./permissions');

  if (!roleHasAnyPermission(user.role, permissions)) {
    throw new ForbiddenError(`Missing required permissions: ${permissions.join(', ')}`);
  }

  return user;
}

/**
 * Middleware to require organization membership
 */
export async function requireOrganization(): Promise<UserWithRole> {
  const user = await requireAuth();

  if (!user.organizationId) {
    throw new ForbiddenError('Organization membership required');
  }

  return user;
}

/**
 * Middleware to check resource access
 * Verifies user can access a specific resource instance
 */
export async function requireResourceAccess(
  resourceType: ResourceType,
  resourceId: string
): Promise<UserWithRole> {
  const user = await requireAuth();

  const hasAccess = await canAccessResource(user, resourceType, resourceId);

  if (!hasAccess) {
    throw new ForbiddenError(`Access denied to ${resourceType}: ${resourceId}`);
  }

  return user;
}

/**
 * Middleware to check if user can perform an action on a resource type
 */
export async function requireAction(
  action: Action,
  resourceType: ResourceType
): Promise<UserWithRole> {
  const user = await requireAuth();

  const canPerform = canPerformAction(user, action, resourceType);

  if (!canPerform) {
    throw new ForbiddenError(`Cannot perform ${action} on ${resourceType}`);
  }

  return user;
}

/**
 * Guard wrapper for API routes
 * Handles authentication and authorization, returns standardized error responses
 */
export async function withAuth<T>(
  handler: (user: UserWithRole, request: NextRequest, ...args: any[]) => Promise<T>,
  request: NextRequest,
  ...args: any[]
): Promise<T | NextResponse> {
  try {
    const user = await requireAuth();
    return await handler(user, request, ...args);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Guard wrapper with permission check
 */
export async function withPermission<T>(
  permission: Permission,
  handler: (user: UserWithRole, request: NextRequest, ...args: any[]) => Promise<T>,
  request: NextRequest,
  ...args: any[]
): Promise<T | NextResponse> {
  try {
    const user = await requirePermission(permission);
    return await handler(user, request, ...args);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    console.error('Permission middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Guard wrapper with resource access check
 */
export async function withResourceAccess<T>(
  resourceType: ResourceType,
  getResourceId: (request: NextRequest, ...args: any[]) => string,
  handler: (user: UserWithRole, request: NextRequest, ...args: any[]) => Promise<T>,
  request: NextRequest,
  ...args: any[]
): Promise<T | NextResponse> {
  try {
    const resourceId = getResourceId(request, ...args);
    const user = await requireResourceAccess(resourceType, resourceId);
    return await handler(user, request, ...args);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    console.error('Resource access middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Guard wrapper with organization check
 */
export async function withOrganization<T>(
  handler: (user: UserWithRole, request: NextRequest, ...args: any[]) => Promise<T>,
  request: NextRequest,
  ...args: any[]
): Promise<T | NextResponse> {
  try {
    const user = await requireOrganization();
    return await handler(user, request, ...args);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    console.error('Organization middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper to extract resource ID from URL params
 */
export function getIdFromParams(params: { id: string }): string {
  return params.id;
}

/**
 * Validate request body has required fields
 */
export function validateRequestBody<T extends Record<string, any>>(
  body: any,
  requiredFields: (keyof T)[]
): body is T {
  for (const field of requiredFields) {
    if (!(field in body) || body[field] === undefined || body[field] === null) {
      return false;
    }
  }
  return true;
}

/**
 * Create a standardized error response
 */
export function errorResponse(message: string, statusCode: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status: statusCode });
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(data: T, statusCode: number = 200): NextResponse {
  return NextResponse.json(data, { status: statusCode });
}
