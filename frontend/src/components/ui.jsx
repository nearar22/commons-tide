import { Link } from 'react-router-dom';

// Button. Primary = lagoon-to-current gradient; ghost = hairline; quiet = text.
export function Button({ children, to, href, onClick, variant = 'primary', size = 'md', type = 'button', disabled, icon: Icon, iconRight: IconRight, full }) {
  const cls = ['ct-btn', `ct-btn-${variant}`, `ct-btn-${size}`, full ? 'ct-btn-full' : ''].filter(Boolean).join(' ');
  const inner = (
    <>
      {Icon ? <Icon size={size === 'lg' ? 18 : 16} aria-hidden="true" /> : null}
      <span>{children}</span>
      {IconRight ? <IconRight size={size === 'lg' ? 18 : 16} aria-hidden="true" /> : null}
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  if (href) return <a className={cls} href={href} target="_blank" rel="noreferrer">{inner}</a>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled}>{inner}</button>;
}

export function Stat({ value, label, color }) {
  return (
    <div className="ct-stat">
      <span className="ct-stat-value" style={color ? { color } : undefined}>{value}</span>
      <span className="ct-stat-label">{label}</span>
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="ct-empty">
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}
