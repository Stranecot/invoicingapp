'use client';

import { useEffect, useState } from 'react';
import { useAuth, useIsAdmin } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Users, UserCog, Link as LinkIcon } from 'lucide-react';

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  company: any;
  customers: any[];
  _count: {
    invoices: number;
    expenses: number;
    customers: number;
  };
};

type Assignment = {
  id: string;
  accountant: {
    id: string;
    name: string | null;
    email: string;
  };
  customer: {
    id: string;
    name: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
};

export default function AdminPage() {
  const { loading } = useAuth();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, assignmentsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/assignments'),
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }

        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json();
          setAssignments(assignmentsData);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoadingData(false);
      }
    }

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingRoleId(userId);
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        alert('Role updated successfully');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">Manage users and accountant assignments</p>
      </div>

      {/* Users Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Users</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingData ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updatingRoleId === user.id}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="USER">User</option>
                        <option value="ACCOUNTANT">Accountant</option>
                      </select>
                      {updatingRoleId === user.id && (
                        <span className="ml-2 text-xs text-gray-600">Updating...</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {user.company?.name || 'No company'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {user._count.customers} customers, {user._count.invoices} invoices, {user._count.expenses} expenses
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Assignments Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Accountant Assignments</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingData ? (
            <div className="p-8 text-center text-gray-500">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No assignments found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accountant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{assignment.accountant.name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{assignment.accountant.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{assignment.customer.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{assignment.customer.user.name || 'No name'}</div>
                        <div className="text-xs text-gray-500">{assignment.customer.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={async () => {
                          if (confirm('Remove this assignment?')) {
                            try {
                              setDeletingAssignmentId(assignment.id);
                              const res = await fetch(`/api/admin/assignments?id=${assignment.id}`, {
                                method: 'DELETE',
                              });
                              if (res.ok) {
                                setAssignments(assignments.filter(a => a.id !== assignment.id));
                                alert('Assignment removed');
                              } else {
                                alert('Failed to remove assignment');
                              }
                            } catch (error) {
                              console.error('Error:', error);
                              alert('Failed to remove assignment');
                            } finally {
                              setDeletingAssignmentId(null);
                            }
                          }
                        }}
                        disabled={deletingAssignmentId === assignment.id}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingAssignmentId === assignment.id ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <UserCog className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Admin Features</h3>
            <p className="text-sm text-blue-700 mt-1">
              You can change user roles, view all data, and manage accountant assignments.
              To assign a customer to an accountant, you'll need to use the API or build a custom assignment form.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
