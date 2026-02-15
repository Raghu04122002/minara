'use client';

import { useEffect } from 'react';

export default function SecurityGuard({ isRestricted }: { isRestricted: boolean }) {
    useEffect(() => {
        if (!isRestricted) return;

        const preventDefault = (e: Event) => e.preventDefault();

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent F12
            if (e.key === 'F12') {
                e.preventDefault();
                return;
            }

            // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (Windows/Linux)
            // Prevent Cmd+Option+I, Cmd+Option+J, Cmd+U (Mac)
            if (
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
                (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ||
                (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
                (e.metaKey && (e.key === 'U' || e.key === 'u'))
            ) {
                e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isRestricted]);

    return null;
}
