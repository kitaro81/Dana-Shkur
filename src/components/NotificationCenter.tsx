import React from 'react';
import { Notification } from '../types';
import { Bell, Check, Trash2, X, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  notifications: Notification[];
  currentUserEmail: string;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  align?: 'left' | 'right';
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  currentUserEmail,
  onMarkAsRead,
  onClearAll,
  onClose,
  align = 'right',
}) => {
  // Filters notifications appropriate for either "all" or specific user's email matching
  const userNotifications = notifications.filter(
    n => n.userId === 'all' || n.userId === currentUserEmail || n.userId === 'user-admin'
  );

  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-20`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-xs text-slate-800">Event & Milestone updates</h3>
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white font-mono text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              {unreadCount} NEW
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {userNotifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
              title="Clear all history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List items */}
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
        {userNotifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic text-xs">
            No notification records available.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {userNotifications.map(notif => (
              <motion.div
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                key={notif.id}
                className={`p-3 relative flex gap-3 hover:bg-slate-50 transition-colors ${notif.read ? 'bg-white' : 'bg-slate-50/70 border-l-2 border-indigo-500'}`}
              >
                {/* Icon based on types */}
                <div className="mt-0.5 flex-shrink-0">
                  {notif.type === 'alert' ? (
                    <div className="p-1.5 bg-rose-50 border border-rose-200 text-rose-500 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  ) : notif.type === 'success' ? (
                    <div className="p-1.5 bg-emerald-50 border border-emerald-200 text-emerald-500 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="p-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Text Body */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                    <span className="text-[9px] font-mono text-slate-400">
                      {new Date(notif.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pr-6">{notif.message}</p>
                </div>

                {/* Mark read button */}
                {!notif.read && (
                  <button
                    onClick={() => onMarkAsRead(notif.id)}
                    className="absolute right-3 bottom-3 p-1 hover:bg-slate-200 text-slate-400 hover:text-emerald-600 rounded cursor-pointer border border-transparent hover:border-slate-300"
                    title="Mark as Read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
};
