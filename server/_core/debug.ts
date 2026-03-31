/**
 * Reusable debug logger for full object inspection.
 * Prints a label followed by the full data structure.
 */
export const debugLog = (label: string, data: any) => {
  console.log(`\n===== ${label} =====`);
  console.dir(data, { depth: null });
};
