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
   // 'E-03/08': ['E-03/09'],

   // 'E-02/08': { absorbs: ['E-02/10'], x: 2434.5242, y:  733.954, x1: 2438.568, y1: 740.453 },

  },

  /** base stall → ordered array of sub-stall numbers */
  splits: {
    // 'E-01/24': ['E-01/24A', 'E-01/24B'],
    // 'E-03/05': ['E-03/05A', 'E-03/05B'],
     
    // with exact coords (DWG units, same convention as block-e-coords.js):
    // 'E-01/24': [
    //   { stallNumber: 'E-01/24A', x: 2446.5876, y: 765.956, x1: 2450.5876, y1: 768.956 },
    //   { stallNumber: 'E-01/24B', x: 2446.5876, y: 768.956, x1: 2450.5876, y1: 773.4695 },
    // ],

    // 'E-01/05': [
    //   { stallNumber: 'E-01/05A', x: 2434.5242, y: 719.454, x1: 2438.5242, y1: 723.457 },
    //   { stallNumber: 'E-01/05B', x: 2438.5242, y: 719.454, x1: 2442.5347, y1: 723.457 },
    // ],
  },
};
