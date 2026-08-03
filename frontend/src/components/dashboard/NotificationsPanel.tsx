interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
}

const notifications: NotificationItem[] = [
  {
    id: 1,
    title: "Queue Update",
    message: "You are now number 3 in the Academic Advising queue.",
    time: "2 minutes ago",
    unread: true,
  },
  {
    id: 2,
    title: "Estimated Wait Time",
    message: "Your estimated wait time is about 15 minutes.",
    time: "5 minutes ago",
    unread: true,
  },
  {
    id: 3,
    title: "Queue Reminder",
    message: "Please stay ready and check your queue status.",
    time: "10 minutes ago",
  },
];

function NotificationsPanel() {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-blue-600">🔔 NOTIFICATIONS</p>

          <h2 className="text-xl font-bold text-slate-900">Recent Updates</h2>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600">
          {notifications.filter((notification) => notification.unread).length}{" "}
          New
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`rounded-xl border p-4 ${
              notification.unread
                ? "border-blue-100 bg-blue-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-900">
                {notification.title}
              </p>

              {notification.unread && (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
              )}
            </div>

            <p className="mt-1 text-sm text-slate-600">
              {notification.message}
            </p>

            <p className="mt-2 text-xs text-slate-400">{notification.time}</p>
          </article>
        ))}
      </div>

      <button
        type="button"
        className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
      >
        View All Notifications
      </button>
    </aside>
  );
}

export default NotificationsPanel;
