/**
 * Shared constants for Pepea.
 *
 * USSD service codes MUST be numeric: Kenyan handsets cannot dial letters
 * from the dialler, so `*384*PEPEA#` is not a valid code. The digits below are
 * the keypad mnemonic for PEPEA (P=7, E=3, P=7, E=3, A=2).
 *
 * The code actually registered with Africa's Talking (sandbox or production
 * channel) is the source of truth. If AT assigns a different one, change it
 * here and nowhere else.
 */
export const USSD_SERVICE_CODE = '*384*73732#';

/** The same code without the trailing '#', used to build shortcut dials such as `*384*73732*1#`. */
export const USSD_SERVICE_CODE_BASE = '*384*73732';

/** Africa's Talking SMS sender ID. */
export const SMS_SENDER_ID = 'PEPEA';
