// Site selectors
export const selectSitesState = (state) => state.site || {};
export const selectSites = (state) => selectSitesState(state).sites || [];
export const selectSitesLoading = (state) => selectSitesState(state).loading;
export const selectSiteById = (state, siteId) => selectSites(state).find(s => String(s.id) === String(siteId));
