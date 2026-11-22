import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const engine = require('./fortress-native-engine.cjs');

export const isNative = engine.isNative;
export const simdScan = engine.simdScan;
export const verifyAntiDebug = engine.verifyAntiDebug;
export const encryptChaCha20ConstantTime = engine.encryptChaCha20ConstantTime;
export const THREAT_NOP_SLED = engine.THREAT_NOP_SLED;
export const THREAT_SHELLCODE_PROLOG = engine.THREAT_SHELLCODE_PROLOG;
export const THREAT_FORMAT_STRING = engine.THREAT_FORMAT_STRING;
export const THREAT_SQLI = engine.THREAT_SQLI;
export const THREAT_COMMAND_INJ = engine.THREAT_COMMAND_INJ;

export default engine;
