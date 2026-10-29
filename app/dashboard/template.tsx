/**
 * A template (unlike a layout) re-mounts on every navigation, so each page settles in with the same
 * short transition. Transform and opacity only; the reduced-motion rule in globals.css shortens it.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="dash-enter">{children}</div>;
}
