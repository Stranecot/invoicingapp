import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, UserCog, UserX, UserCheck, LogIn } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'login' | 'role_change' | 'status_change' | 'created';
  description: string;
  createdAt: Date;
  metadata?: Record<string, string>;
}

interface UserActivityTimelineProps {
  events: ActivityEvent[];
}

export function UserActivityTimeline({ events }: UserActivityTimelineProps) {
  const getIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'login':
        return <LogIn className="w-4 h-4 text-blue-500" />;
      case 'role_change':
        return <UserCog className="w-4 h-4 text-purple-500" />;
      case 'status_change':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'created':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
              {getIcon(event.type)}
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 mt-2" />
            )}
          </div>
          <div className="flex-1 pb-8">
            <p className="text-sm text-gray-900">{event.description}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
            </p>
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                {Object.entries(event.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
