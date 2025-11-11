/**
 * Test setup file
 * Runs before all tests to configure mocks and global utilities
 */

import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.CLERK_SECRET_KEY = 'test_clerk_secret_key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test_clerk_publishable_key';
process.env.RESEND_API_KEY = 'test_resend_api_key';
process.env.RESEND_FROM_EMAIL = 'test@example.com';

// Global test timeout
vi.setConfig({ testTimeout: 10000 });
