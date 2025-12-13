type Status = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'closed';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

const statusConfig = {
  submitted: {
    label: 'Submitted',
    color: 'bg-blue-100 text-blue-800',
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-yellow-100 text-yellow-800',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-purple-100 text-purple-800',
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-100 text-green-800',
  },
  closed: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyle = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${config.color} ${sizeStyle}`}>
      {config.label}
    </span>
  );
}
