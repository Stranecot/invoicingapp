'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Mail, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { InviteEmployeeDialog } from '@/components/team/invite-employee-dialog';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  expiresAt: string;
}

interface Organization {
  id: string;
  name: string;
  plan: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [planLimits, setPlanLimits] = useState({ current: 0, max: 0 });

  useEffect(() => {
    if (user?.role === 'OWNER') {
      fetchTeamData();
    }
  }, [user]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Fetch organization details
      let orgData = null;
      const orgRes = await fetch('/api/organizations/current');
      if (orgRes.ok) {
        orgData = await orgRes.json();
        setOrganization(orgData);
      }

      // Fetch team members
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setTeamMembers(usersData.users || []);

        // Use maxUsers from organization data
        const maxUsers = orgData?.maxUsers || 5;
        setPlanLimits({ current: usersData.users?.length || 0, max: maxUsers });
      }

      // Fetch pending invitations
      const invitesRes = await fetch('/api/invitations?status=PENDING');
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvitations(invitesData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTeamData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to revoke invitation');
      }
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      alert('Failed to revoke invitation');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this team member?')) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });

      if (res.ok) {
        fetchTeamData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to deactivate user');
      }
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      alert('Failed to deactivate user');
    }
  };

  if (user?.role !== 'OWNER') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">
              Only organization owners can access team management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">Loading team data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canInviteMore = planLimits.current + invitations.length < planLimits.max;
  const remainingSlots = planLimits.max - (planLimits.current + invitations.length);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          {organization && (
            <p className="text-sm text-gray-600 mt-1">
              {organization.name} • {organization.plan} Plan
            </p>
          )}
        </div>
        <Button
          onClick={() => setIsInviteDialogOpen(true)}
          disabled={!canInviteMore}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Employee
        </Button>
      </div>

      {/* Plan Limits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Team Capacity</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Your current plan allows up to {planLimits.max} team members
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Team Members</span>
                <span className="font-medium">
                  {planLimits.current} / {planLimits.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(planLimits.current / planLimits.max) * 100}%`,
                  }}
                />
              </div>
            </div>
            {invitations.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">Pending: </span>
                <span className="font-medium">{invitations.length}</span>
              </div>
            )}
          </div>
          {!canInviteMore && (
            <p className="text-sm text-amber-600 mt-3">
              You've reached your team member limit. Upgrade your plan to invite more employees.
            </p>
          )}
          {canInviteMore && remainingSlots > 0 && (
            <p className="text-sm text-gray-600 mt-3">
              You have {remainingSlots} {remainingSlots === 1 ? 'slot' : 'slots'} remaining.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Active team members in your organization
          </p>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No team members yet. Invite employees to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {member.name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.name || 'No name set'}
                        {member.id === user?.id && (
                          <span className="ml-2 text-xs text-gray-500">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        member.role === 'OWNER'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {member.role}
                    </span>
                    {member.isActive ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                    {member.role === 'EMPLOYEE' && member.id !== user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivateUser(member.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Invitations waiting to be accepted
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-10 h-10 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-sm text-gray-600">
                        Invited {new Date(invitation.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeInvitation(invitation.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <InviteEmployeeDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSuccess={fetchTeamData}
        remainingSlots={remainingSlots}
      />
    </div>
  );
}
