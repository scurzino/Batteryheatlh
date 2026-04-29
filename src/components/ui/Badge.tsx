import React from 'react';
import { EntryStatus } from '../../data/mockData';

interface StatusBadgeProps {
    status: EntryStatus;
}

const CONFIG: Record<string, { label: string; className: string }> = {
    APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    PENDING: { label: 'Under Review', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    FLAGGED_BY_SYSTEM: { label: 'Flagged', className: 'bg-red-100 text-red-800 border-red-200' },
    REJECTED: { label: 'Rejected', className: 'bg-surface-container-highest text-secondary border-outline-variant/30' },
};

export function StatusBadge({ status }: { status: string }) {
    const config = CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.className}`}>
            {config.label}
        </span>
    );
}

interface SohBadgeProps { soh: number }

export function SohBadge({ soh }: SohBadgeProps) {
    const className =
        soh >= 95 ? 'bg-emerald-100 text-emerald-800' :
            soh >= 88 ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800';
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${className}`}>
            {soh.toFixed(1)}% SOH
        </span>
    );
}

interface TagBadgeProps { label: string; color?: 'blue' | 'purple' | 'teal' | 'default' }

const TAG_COLORS: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    teal: 'bg-teal-100 text-teal-800',
    default: 'bg-surface-container text-secondary',
};

export function TagBadge({ label, color = 'default' }: TagBadgeProps) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${TAG_COLORS[color]}`}>
            {label}
        </span>
    );
}
