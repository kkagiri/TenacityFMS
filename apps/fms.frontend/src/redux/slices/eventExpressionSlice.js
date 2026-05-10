/**
 * File: eventExpressionSlice.js
 * Purpose: Redux Toolkit slice for Event Expression management state.
 *          Handles CRUD operations, type metadata, and execution history.
 * Dependencies: @reduxjs/toolkit, eventExpressionApi
 * Last Modified: 2026-02-06
 *
 * Key Thunks:
 * - fetchEventExpressions: List with filters
 * - fetchEventExpressionById: Single expression detail
 * - fetchEventExpressionTypes: Available types and conditions metadata
 * - fetchExecutionHistory: Execution log for an expression
 * - createEventExpression: Create new
 * - updateEventExpression: Update existing
 * - deleteEventExpression: Soft-delete
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import eventExpressionApi from '../../dataservice/eventExpressionApi';

// ─── Async Thunks ───────────────────────────────────────────────

export const fetchEventExpressions = createAsyncThunk(
    'eventExpressions/fetchAll',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await eventExpressionApi.getEventExpressions(params);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchEventExpressionById = createAsyncThunk(
    'eventExpressions/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await eventExpressionApi.getEventExpressionById(id);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchEventExpressionTypes = createAsyncThunk(
    'eventExpressions/fetchTypes',
    async (_, { rejectWithValue }) => {
        try {
            const response = await eventExpressionApi.getEventExpressionTypes();
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchExecutionHistory = createAsyncThunk(
    'eventExpressions/fetchExecutions',
    async ({ expressionId, params = {} }, { rejectWithValue }) => {
        try {
            const response = await eventExpressionApi.getExecutionHistory(expressionId, params);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createEventExpression = createAsyncThunk(
    'eventExpressions/create',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await eventExpressionApi.createEventExpression(payload);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateEventExpression = createAsyncThunk(
    'eventExpressions/update',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const response = await eventExpressionApi.updateEventExpression(id, payload);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteEventExpression = createAsyncThunk(
    'eventExpressions/delete',
    async (id, { rejectWithValue }) => {
        try {
            const response = await eventExpressionApi.deleteEventExpression(id);
            return { id, response };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ─── Slice ──────────────────────────────────────────────────────

const initialState = {
    // List
    expressions: [],
    totalCount: 0,
    loading: false,
    error: null,

    // Selected expression detail
    selectedExpression: null,
    selectedLoading: false,
    selectedError: null,

    // Available types metadata
    expressionTypes: [],
    typesLoading: false,
    typesError: null,

    // Execution history
    executions: [],
    executionsTotalCount: 0,
    executionsLoading: false,
    executionsError: null,

    // CRUD operation state
    saving: false,
    saveError: null,
    deleting: false,
    deleteError: null,

    // Filters
    filters: {
        eventType: null,
        siteId: null,
        isActive: true,
        skip: 0,
        take: 50
    }
};

const eventExpressionSlice = createSlice({
    name: 'eventExpressions',
    initialState,
    reducers: {
        setFilters(state, action) {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearSelectedExpression(state) {
            state.selectedExpression = null;
            state.selectedError = null;
        },
        clearExecutions(state) {
            state.executions = [];
            state.executionsTotalCount = 0;
        },
        clearErrors(state) {
            state.error = null;
            state.selectedError = null;
            state.saveError = null;
            state.deleteError = null;
            state.executionsError = null;
        }
    },
    extraReducers: (builder) => {
        // ─── Fetch All ──────────────────────────
        builder
            .addCase(fetchEventExpressions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEventExpressions.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload?.data || action.payload;
                state.expressions = Array.isArray(data) ? data : [];
                state.totalCount = state.expressions.length;
            })
            .addCase(fetchEventExpressions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch event expressions';
            });

        // ─── Fetch By ID ────────────────────────
        builder
            .addCase(fetchEventExpressionById.pending, (state) => {
                state.selectedLoading = true;
                state.selectedError = null;
            })
            .addCase(fetchEventExpressionById.fulfilled, (state, action) => {
                state.selectedLoading = false;
                state.selectedExpression = action.payload?.data || action.payload;
            })
            .addCase(fetchEventExpressionById.rejected, (state, action) => {
                state.selectedLoading = false;
                state.selectedError = action.payload || 'Failed to fetch expression';
            });

        // ─── Fetch Types ────────────────────────
        builder
            .addCase(fetchEventExpressionTypes.pending, (state) => {
                state.typesLoading = true;
                state.typesError = null;
            })
            .addCase(fetchEventExpressionTypes.fulfilled, (state, action) => {
                state.typesLoading = false;
                const data = action.payload?.data || action.payload;
                state.expressionTypes = Array.isArray(data) ? data : [];
            })
            .addCase(fetchEventExpressionTypes.rejected, (state, action) => {
                state.typesLoading = false;
                state.typesError = action.payload || 'Failed to fetch expression types';
            });

        // ─── Fetch Executions ───────────────────
        builder
            .addCase(fetchExecutionHistory.pending, (state) => {
                state.executionsLoading = true;
                state.executionsError = null;
            })
            .addCase(fetchExecutionHistory.fulfilled, (state, action) => {
                state.executionsLoading = false;
                const data = action.payload?.data || action.payload;
                state.executions = Array.isArray(data) ? data : [];
                state.executionsTotalCount = state.executions.length;
            })
            .addCase(fetchExecutionHistory.rejected, (state, action) => {
                state.executionsLoading = false;
                state.executionsError = action.payload || 'Failed to fetch executions';
            });

        // ─── Create ─────────────────────────────
        builder
            .addCase(createEventExpression.pending, (state) => {
                state.saving = true;
                state.saveError = null;
            })
            .addCase(createEventExpression.fulfilled, (state, action) => {
                state.saving = false;
                const created = action.payload?.data || action.payload;
                if (created) {
                    state.expressions = [created, ...state.expressions];
                    state.totalCount += 1;
                }
            })
            .addCase(createEventExpression.rejected, (state, action) => {
                state.saving = false;
                state.saveError = action.payload || 'Failed to create expression';
            });

        // ─── Update ─────────────────────────────
        builder
            .addCase(updateEventExpression.pending, (state) => {
                state.saving = true;
                state.saveError = null;
            })
            .addCase(updateEventExpression.fulfilled, (state, action) => {
                state.saving = false;
                const updated = action.payload?.data || action.payload;
                if (updated) {
                    const index = state.expressions.findIndex(e => e.id === updated.id);
                    if (index >= 0) {
                        state.expressions[index] = updated;
                    }
                    if (state.selectedExpression?.id === updated.id) {
                        state.selectedExpression = updated;
                    }
                }
            })
            .addCase(updateEventExpression.rejected, (state, action) => {
                state.saving = false;
                state.saveError = action.payload || 'Failed to update expression';
            });

        // ─── Delete ─────────────────────────────
        builder
            .addCase(deleteEventExpression.pending, (state) => {
                state.deleting = true;
                state.deleteError = null;
            })
            .addCase(deleteEventExpression.fulfilled, (state, action) => {
                state.deleting = false;
                const deletedId = action.payload?.id;
                if (deletedId) {
                    state.expressions = state.expressions.filter(e => e.id !== deletedId);
                    state.totalCount -= 1;
                }
            })
            .addCase(deleteEventExpression.rejected, (state, action) => {
                state.deleting = false;
                state.deleteError = action.payload || 'Failed to delete expression';
            });
    }
});

export const {
    setFilters,
    clearSelectedExpression,
    clearExecutions,
    clearErrors
} = eventExpressionSlice.actions;

export default eventExpressionSlice.reducer;
