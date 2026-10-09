import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';

// Privy's native Solana signer uses the Node-style global when encoding messages
// and decoding signatures. Load it before expo-router imports the wallet SDK.
globalThis.Buffer ??= Buffer;
