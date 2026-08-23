/**
 * Block E stall overrides — merge and split declarations.
 * Edit this file when physical booths are merged or split at the fair.
 * Exhibitor data always comes from the EPCH API — only the structure is declared here.
 *
 * MERGE:  primary stall absorbs one or more adjacent stalls.
 *         The absorbed stalls disappear; the primary stall's rect expands.
 *
 *   merges: {
 *     'E-01/51': ['E-01/52'],   // 51 absorbs 52 → sequence: …50 / 51 / 53…
 *   }
 *
 * SPLIT:  one stall is divided into sub-units (A, B, …).
 *         The base stall disappears; sub-stalls appear stacked in its rect.
 *         Status and exhibitor data are fetched from the EPCH API by sub-stall number.
 *
 *   splits: {
 *     'E-01/24': ['E-01/24A', 'E-01/24B'],
 *   }
 */

export const STALL_OVERRIDES = {
  /** primary stall → array of stalls it absorbs */
  merges: {
   // 'E-01/08': ['E-01/09'],
  },

  /** base stall → ordered array of sub-stall numbers */
  splits: {
    // 'E-01/24': ['E-01/24A', 'E-01/24B'],
    // 'E-03/05': ['E-03/05A', 'E-03/05B'],
  },
};
