
import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-6 md:ml-64 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
