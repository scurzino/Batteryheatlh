import { useState } from 'react';
import { X, Info } from 'lucide-react';

export default function SystemBanner() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="bg-blue-600 text-white px-4 py-3 shadow-md relative z-50">
            <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <p className="text-sm font-medium leading-relaxed">
                        <strong>System Update:</strong> We sincerely apologize for the temporary malfunction of the vehicle pages over the past few days. This issue has now been completely resolved. The disruption was due to a critical security update for our user database. Thank you for your patience and understanding.
                    </p>
                </div>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-blue-700 rounded-md transition-colors flex-shrink-0"
                    aria-label="Dismiss"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
