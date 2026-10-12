export type NotificationAnchor = { x: number; y: number; width: number; height: number };
type Insets = { top: number; bottom: number; left: number; right: number };
type Limits = { inset: number; maxWidth: number; maxHeight: number };

/** Clamp stale/scrolled bell coordinates to the modal's usable viewport.
 * Reserve room for the fixed header and scrollable content on short screens.
 */
export function notificationPosition(anchor: NotificationAnchor, width: number, height: number, insets: Insets, limits: Limits) {
  const leftInset = Math.max(limits.inset, insets.left), rightInset = Math.max(limits.inset, insets.right);
  const panelWidth = Math.max(0, Math.min(limits.maxWidth, width - leftInset - rightInset));
  const left = Math.max(leftInset, Math.min(anchor.x + anchor.width - panelWidth, width - rightInset - panelWidth));
  const safeTop = insets.top + 20;
  const bottom = Math.max(safeTop, height - Math.max(insets.bottom, limits.inset));
  const preferredTop = anchor.y + anchor.height + 20;
  const latestTop = Math.max(safeTop, bottom - Math.min(280, bottom - safeTop));
  const top = Math.max(safeTop, Math.min(preferredTop, latestTop));
  return { left, top, panelWidth, maxHeight: Math.min(limits.maxHeight, bottom - top),
    pointerLeft: Math.max(20, Math.min(panelWidth - 36, anchor.x + anchor.width / 2 - left - 8)),
    showPointer: Math.abs(top - preferredTop) < 1 && anchor.y >= insets.top && anchor.x >= leftInset && anchor.x + anchor.width <= width - rightInset };
}
