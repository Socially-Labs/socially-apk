import { createContext } from 'react';

// Auth mounts under the intro, but waits for the welcome lockup to leave.
export const IntroCompleteContext = createContext(true);
