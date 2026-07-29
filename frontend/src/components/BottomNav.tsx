import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: '今日', end: true },
  { to: '/tasks', label: 'やること' },
  { to: '/belongings', label: '持ち物' },
  { to: '/schedule', label: '学習時間' },
  { to: '/review', label: '振り返り' },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md justify-between px-2 py-2">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-lg py-1.5 text-xs font-medium transition ${
                  isActive ? 'text-focus' : 'text-ink/40'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-focus' : 'bg-transparent'}`} />
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
