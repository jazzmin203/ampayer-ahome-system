'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Info } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// import { format } from 'date-fns'; // removed to minimize dependency, use native or simple formatter

interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    notification_type: 'game_assignment' | 'game_reminder' | 'game_cancellation' | 'score_request' | 'general_info';
    status: 'pending' | 'accepted' | 'rejected';
    game?: number;
}

export default function NotificationCenter() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initial fetch
    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Optional: Poll every 60s
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: Notification) => !n.is_read).length);
        } catch (error) {
            console.error('Error fetching notifications', error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/mark_read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark_all_read/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const handleResponse = async (id: number, status: 'accepted' | 'rejected') => {
        try {
            await api.post(`/notifications/${id}/respond/`, { status });
            // Update local state
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status, is_read: true } : n));
            alert(status === 'accepted' ? 'Has aceptado la asignación.' : 'Has rechazado la asignación.');
        } catch (error) {
            console.error('Error responding to notification', error);
            alert('Error al responder.');
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-sm border border-gray-200"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100">
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b">
                        <h3 className="text-sm font-semibold text-gray-700">Notificaciones</h3>
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            Marcar leídas
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No tienes notificaciones.
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex start items-start gap-3">
                                        <div className={`p-2 rounded-full ${notification.notification_type === 'game_assignment' ? 'bg-purple-100 text-purple-600' :
                                                notification.notification_type === 'game_cancellation' ? 'bg-red-100 text-red-600' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            <Info size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>

                                            {/* Action Buttons for Assignments */}
                                            {notification.notification_type === 'game_assignment' && notification.status === 'pending' && (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => handleResponse(notification.id, 'accepted')}
                                                        className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 w-full"
                                                    >
                                                        <Check size={14} className="mr-1" /> Aceptar
                                                    </button>
                                                    <button
                                                        onClick={() => handleResponse(notification.id, 'rejected')}
                                                        className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 w-full"
                                                    >
                                                        <X size={14} className="mr-1" /> Rechazar
                                                    </button>
                                                </div>
                                            )}

                                            {notification.notification_type === 'game_assignment' && notification.status !== 'pending' && (
                                                <div className={`mt-2 text-xs font-bold ${notification.status === 'accepted' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {notification.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Overlay to close when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
