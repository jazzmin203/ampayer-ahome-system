'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function GameScorePage() {
    const params = useParams();
    const router = useRouter();
    const gameId = params.id;

    useEffect(() => {
        if (gameId) {
            router.replace(`/dashboard/scoring/${gameId}`);
        }
    }, [gameId, router]);

    return (
        <div className="p-8 text-center">
            <p>Redirigiendo a la nueva interfaz de anotación...</p>
        </div>
    );
}
