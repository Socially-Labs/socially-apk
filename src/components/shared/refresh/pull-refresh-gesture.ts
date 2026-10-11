/** Keep normal vertical scrolling and horizontal carousels out of the refresh gesture. */
export const REFRESH_THRESHOLD = 64;
export const REFRESH_REST = 124;
export function canPullRefresh(startedAtTop: boolean, scrollY: number, dx: number, dy: number, touches: number, busy: boolean) {
  return startedAtTop && scrollY <= 1 && !busy && touches === 1 && dy > 10 && dy > Math.abs(dx) * 1.5;
}
export function refreshPullDistance(dy: number) {
  return Math.min(110, Math.max(0, dy * 0.5));
}
