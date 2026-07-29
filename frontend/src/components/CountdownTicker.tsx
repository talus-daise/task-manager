interface Props {
  daysLeft: number | null;
  size?: 'sm' | 'lg';
}

// 空港の発着掲示板のような数字表示。締切までの日数を視覚的に強く訴える、このアプリのシグネチャ要素。
export function CountdownTicker({ daysLeft, size = 'sm' }: Props) {
  const label = daysLeft === null ? '―' : daysLeft <= 0 ? '今日' : `${daysLeft}日`;

  const color =
    daysLeft === null
      ? 'bg-ink/10 text-ink'
      : daysLeft <= 0
        ? 'bg-danger text-white'
        : daysLeft <= 2
          ? 'bg-signal text-ink'
          : 'bg-ink text-paper';

  const dims = size === 'lg' ? 'text-4xl px-5 py-3 min-w-[100px]' : 'text-base px-3 py-1.5 min-w-[56px]';

  return (
    <div className={`font-mono font-bold tabular rounded-md text-center leading-none ${color} ${dims}`}>
      {label}
    </div>
  );
}
