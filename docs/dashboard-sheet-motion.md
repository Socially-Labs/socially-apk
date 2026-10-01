# Dashboard sheet motion

Reference: https://cdn.bestdesignsonx.com/amplify_video/2102421816077897728/vid/avc1/2160x2160/wQdzBelLclU9djbD.mp4

Probe: 2160 × 2160, 30fps, 9.9 seconds, 297 frames.

## Observed states and movement

The reference is a bottom-sheet picker. Its surface has rounded bottom and top
corners, a narrow inset from the screen edges, a small centred grab handle, and
a centred title. It moves as one panel rather than revealing each item in a
separate stagger. The page behind it dims during presentation.

Frames 15–42 sampled every two frames show the opening. The first visible
movement is around frames 23–25 (0.77–0.83s). By frame 31 (1.03s) the panel has
covered most of its travel, and it settles near its final position over frames
35–39 (1.17–1.30s). Large early frame displacements decrease toward the end;
there is little visible overshoot. The sampled close over frames 214–245 shows
movement around 7.60s, then a downward exit and backdrop release by about 8.07s.

The React Native port uses a 360ms perceptual spring with damping ratio 0.94
for opening (Reanimated's actual duration is approximately 1.5× the perceptual
duration) and a 260ms ease-in close. Constants approximate the sampled motion;
they are not inferred source code from the reference.

## Theme and mobile adaptations

The shared component uses existing Inter faces and dashboard ink, plus a pale
blue-white gradient, 32pt corners, 8pt side margins, a circular close control,
and a subtle inset content surface. Its height follows its contents and caps
at 80% of the viewport. Long content scrolls inside the sheet. Bottom spacing
accounts for the device safe area rather than copying the video's device frame.

The reference's picker content and avatar changes are not added to the app.
Wallet, profile, portfolio, notifications, market and captain details retain
their own content and use the same presentation. The app behind the native
Modal stays in place; the dimming backdrop supplies separation.

The sheet stays mounted until its slide-out finishes. It retains the last
visible title and content when callers clear their selection, avoiding an empty
or renamed surface during exit. Reopening cancels the current animation and
continues from its existing progress. A cancelled exit cannot hide a newly
opened modal.

The grab handle supports downward dragging. A short drag springs back; a drag
past 25% of the sheet's height (capped at 96pt), or a downward fling over 900pt/s
with at least 12pt travel, dismisses it. Dragging is restricted to the handle
so content scrolling and child controls keep their own interactions. Upward
dragging has resistance. Reduced motion presents and dismisses instantly;
close, backdrop, platform back/Escape, and the handle accessibility escape
remain available.

## Reproduce the inspection

```sh
curl -L --fail 'https://cdn.bestdesignsonx.com/amplify_video/2102421816077897728/vid/avc1/2160x2160/wQdzBelLclU9djbD.mp4' -o /private/tmp/dashboard-sheet-reference.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration,nb_frames -of default=nw=1 /private/tmp/dashboard-sheet-reference.mp4
ffmpeg -i /private/tmp/dashboard-sheet-reference.mp4 -vf 'fps=2,scale=240:240,tile=6x5' -frames:v 1 /private/tmp/dashboard-sheet-overview.png
ffmpeg -i /private/tmp/dashboard-sheet-reference.mp4 -vf "select='between(n,15,42)*not(mod(n,2))',scale=480:480,tile=7x2" -frames:v 1 -fps_mode passthrough /private/tmp/dashboard-sheet-open-frames.png
ffmpeg -i /private/tmp/dashboard-sheet-reference.mp4 -vf "select='between(n,214,245)*not(mod(n,2))',scale=480:480,tile=8x2" -frames:v 1 -fps_mode passthrough /private/tmp/dashboard-sheet-close-frames.png
```
