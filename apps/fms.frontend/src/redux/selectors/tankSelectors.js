export const selectTankState = (state) => state.tank || {};
export const selectTanks = (state) => selectTankState(state).tanks || [];
export const selectTanksBySite = (state, siteId) => selectTanks(state).filter(t => String(t.siteId) === String(siteId));
export const selectTankById = (state, tankId) => selectTanks(state).find(t => String(t.id) === String(tankId));
