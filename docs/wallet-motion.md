# Wallet motion reference

Source: https://cdn.bestdesignsonx.com/amplify_video/2104845613175283713/vid/avc1/960x960/qSA3JfArQorehaBb.mp4

The October 2 screenshot supplies the wallet layout and artwork direction. The
video supplies the Pay/Request control labels, shapes, and interaction. Holdings
are preview data; payment, contact, and QR sheets describe the unconnected state.

The subsequent layout revision moves Wallet and its subtitle into a top header
matching the home greeting, renames the controls Deposit and Withdraw, and nests
them in the Receive on Solana card. The extra receive description is removed.
Deposit opens Contact and My QR; Withdraw opens Contact and Scan QR, so the
receiving and sending actions match their updated names. Both idle pills fill
the available card width equally to keep the longer labels readable.

## Reference inspection

ffprobe reports 960 × 960, 60fps, 8.962111 seconds, 517 frames. The stream contains
repeated demonstrations of the same three states:

- Idle: green northeast arrow with Pay; blue southwest arrow with Request.
- Pay: Contact, Scan QR, circular close on the right.
- Request: circular close on the left, Contact, My QR.

Dense frame stacks around 0.10–0.60s and 2.25–2.75s show these details:

- Main movement begins around 0.40s for Pay and 2.58s for Request.
- The row stays on one horizontal baseline. Other content stays stationary.
- The Pay pill moves left and the Request pill moves right. A third pill emerges
  between them, with overlapping label handoffs rather than a sequential stagger.
- Old labels soften and fade while the new labels sharpen into place.
- The opposite action’s coloured circle loses its tint and its arrow turns into
  an X. Pay produces the right close button; Request produces the left close.
- The large early displacement and decreasing frame deltas indicate an ease-out;
  there is no obvious oscillating overshoot in the sampled windows.

`wallet-actions.tsx` uses a reversible 0–1 Reanimated progress, 380ms opening,
320ms closing, and cubic Bézier (0.22, 1, 0.36, 1). These are tuned approximations
from the sampled frames. Incoming labels crossfade over progress 0.20–0.78;
outgoing labels fade over 0–0.52. New actions emerge at progress 0.10–0.60.
Arrow strokes share a stable path topology to morph into the X.

## Mobile adaptations

- The wallet retains the airy arches and sailboat backdrop from the app’s
  existing `assets/images/auth/voyage-blue.png`; no new artwork is needed.
- Buttons are 56pt high and the close pill is 48pt wide for touch access.
- The row adapts to its measured width. It does not shift surrounding content.
- The three isolated, absolutely positioned pill widths interpolate locally to
  preserve capsule radii and sharp, unscaled type. They do not reflow the page.
- Web and Android 12+ use the brief blur filter. iOS uses opacity and scale for
  the label handoff because React Native’s iOS View filter does not support blur.
- Reduced motion skips all movement and crossfades. Repeated taps reverse from
  the current progress; there are no timers to queue stale animation states.
- The clip is not autoplayed. Motion follows taps, as in the recorded interaction.

## Reproduce the dissection

```sh
curl -L --fail 'https://cdn.bestdesignsonx.com/amplify_video/2104845613175283713/vid/avc1/960x960/qSA3JfArQorehaBb.mp4' -o /private/tmp/wallet-motion-reference.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration,nb_frames -of default=nw=1 /private/tmp/wallet-motion-reference.mp4
ffmpeg -i /private/tmp/wallet-motion-reference.mp4 -vf 'fps=2,scale=240:240,tile=6x5' -frames:v 1 /private/tmp/wallet-motion-overview.png
ffmpeg -i /private/tmp/wallet-motion-reference.mp4 -vf "crop=960:220:0:370,select='between(t,0.10,0.60)',fps=30,scale=720:165,tile=1x15" -frames:v 1 /private/tmp/wallet-motion-pay-stack.png
ffmpeg -i /private/tmp/wallet-motion-reference.mp4 -vf "crop=960:220:0:370,select='between(t,2.25,2.75)',fps=30,scale=720:165,tile=1x15" -frames:v 1 /private/tmp/wallet-motion-request-stack.png
```
