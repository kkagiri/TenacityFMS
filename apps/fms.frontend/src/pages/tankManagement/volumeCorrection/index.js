/**
 * Tank Volume Data Correction Module
 *
 * Complete DETECT-ANALYZE-CORRECT-VERIFY workflow for identifying
 * and resolving corrupted tank volume history data.
 *
 * PHASES:
 * 1. DETECT: Identify sequence breaks and corrupted volumes
 * 2. ANALYZE: Generate correction plans and recommend strategies
 * 3. CORRECT: Execute corrections using 4 different strategies
 * 4. VERIFY: Review audit trail and correction history
 *
 * CORRECTION STRATEGIES:
 * - RECALCULATE: Bulk rebuild from opening stock (recommended)
 * - MANUAL: Override with physically verified value
 * - RECALCULATE_SINGLE: Fix isolated broken transaction
 * - RECALCULATE_FROM_POINT: Fix multi-date corruption
 *
 * INTEGRATION:
 * - Redux: tankVolumeCorrectionSlice (9 async thunks)
 * - API: tankVolumeDataClient (10 endpoint methods)
 * - Components: 4 tab-based UI components
 * - Styling: SCSS with responsive design
 */

export { default } from './VolumeCorrectionMain';
export { default as VolumeCorrectionMain } from './VolumeCorrectionMain';
