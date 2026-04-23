/**
 * File: useWorkflowEditor.js
 * Purpose: Manage local workflow editor state, dirty tracking, and workflow persistence.
 * Dependencies: React, @xyflow/react, issueTrackerV2Service, devextreme notify
 * Last Modified: 2026-04-23
 *
 * Key Functions:
 * - useWorkflowEditor(): loads, edits, validates, and saves staged workflow data.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MarkerType, applyNodeChanges } from '@xyflow/react';
import notify from 'devextreme/ui/notify';
import issueTrackerV2Service from '../../../../services/issueTrackerV2Service';

const DEFAULT_STAGE_LIBRARY = [
    { key: 'diagnose', name: 'Diagnose', color: '#0078d4' },
    { key: 'repair', name: 'Repair', color: '#ca5010' },
    { key: 'verify', name: 'Verify', color: '#107c10' }
];

export const STAGE_COLOR_OPTIONS = [
    { value: '#0078d4', text: 'Blue' },
    { value: '#106ebe', text: 'Cobalt' },
    { value: '#ca5010', text: 'Orange' },
    { value: '#107c10', text: 'Green' },
    { value: '#8764b8', text: 'Purple' },
    { value: '#038387', text: 'Teal' },
    { value: '#c239b3', text: 'Magenta' },
    { value: '#d13438', text: 'Red' }
];

export const ACTION_TYPE_OPTIONS = [
    { value: 'General', text: 'General' },
    { value: 'DeviceChange', text: 'Device Change' },
    { value: 'CameraInstall', text: 'Camera Install' },
    { value: 'SensorReplacement', text: 'Sensor Replacement' },
    { value: 'SensorCalibration', text: 'Sensor Calibration' }
];

export const ACTION_TYPE_META = {
    General: { icon: 'fa-light fa-screwdriver-wrench', tint: '#deecf9', color: '#0078d4' },
    DeviceChange: { icon: 'fa-light fa-microchip', tint: '#fff4ce', color: '#ca5010' },
    CameraInstall: { icon: 'fa-light fa-camera', tint: '#dff6dd', color: '#107c10' },
    SensorReplacement: { icon: 'fa-light fa-plug-circle-bolt', tint: '#f3e8ff', color: '#8764b8' },
    SensorCalibration: { icon: 'fa-light fa-ruler-combined', tint: '#fff4ce', color: '#986f0b' }
};

export const WORKFLOW_MOBILE_BREAKPOINT = 768;

const STAGE_HEIGHT = 220;
const STAGE_GAP = 28;
const NODE_X_START = 48;
const NODE_X_GAP = 300;
const NODE_Y_OFFSET = 52;
const NODE_ROW_GAP = 118;

const EMPTY_ACTION = {
    name: 'New action',
    actionType: 'General',
    description: '',
    isActive: true,
    positionX: null,
    positionY: null
};

const buildDefaultStages = () => DEFAULT_STAGE_LIBRARY.map((stage, index) => ({
    id: `stage-default-${index}`,
    persistedId: null,
    name: stage.name,
    description: '',
    color: stage.color,
    sortOrder: index,
    isActive: true
}));

export const getStageTop = (sortOrder) => sortOrder * (STAGE_HEIGHT + STAGE_GAP);

const getNodeId = (persistedId, fallbackKey) => (persistedId != null ? `action-${persistedId}` : fallbackKey);
const getStageId = (persistedId, fallbackKey) => (persistedId != null ? `stage-${persistedId}` : fallbackKey);
const getPersistedId = (value) => (typeof value === 'number' ? value : null);

const getRequirementsFromActionType = (actionType) => ({
    requiresDeviceDetails: actionType === 'DeviceChange',
    requiresSourceVehicle: actionType === 'DeviceChange',
    requiresCameraDetails: actionType === 'CameraInstall',
    requiresSensorDetails: actionType === 'SensorReplacement',
    requiresCalibrationResult: actionType === 'SensorCalibration'
});

const getDefaultStageForActionType = (actionType, stages) => {
    if (actionType === 'SensorCalibration') {
        return stages.find((stage) => stage.name.toLowerCase() === 'verify') || stages[2] || stages[stages.length - 1] || stages[0];
    }

    if (actionType === 'DeviceChange' || actionType === 'CameraInstall' || actionType === 'SensorReplacement') {
        return stages.find((stage) => stage.name.toLowerCase() === 'repair') || stages[1] || stages[0];
    }

    return stages.find((stage) => stage.name.toLowerCase() === 'diagnose') || stages[0];
};

const getStageNodes = (nodes, stageId) => nodes
    .filter((node) => node.data.stageId === stageId)
    .sort((left, right) => (left.position.y - right.position.y) || (left.position.x - right.position.x) || left.data.sortOrder - right.data.sortOrder);

const buildNode = (action, stage, indexWithinStage) => ({
    id: getNodeId(action.id, `temp-${stage.id}-${indexWithinStage + 1}`),
    type: 'actionNode',
    position: {
        x: action.positionX ?? (NODE_X_START + ((indexWithinStage % 3) * NODE_X_GAP)),
        y: action.positionY ?? (getStageTop(stage.sortOrder) + NODE_Y_OFFSET + (Math.floor(indexWithinStage / 3) * NODE_ROW_GAP))
    },
    data: {
        persistedId: getPersistedId(action.id),
        stageId: stage.id,
        name: action.name,
        actionType: action.actionType || 'General',
        description: action.description || '',
        isActive: action.isActive !== false,
        sortOrder: action.sortOrder || indexWithinStage
    }
});

const determineStageIdForPosition = (positionY, stages) => {
    if (!stages.length) {
        return null;
    }

    const nearestStage = stages.reduce((closest, stage) => {
        const currentDistance = Math.abs(positionY - getStageTop(stage.sortOrder));
        const closestDistance = Math.abs(positionY - getStageTop(closest.sortOrder));
        return currentDistance < closestDistance ? stage : closest;
    }, stages[0]);

    return nearestStage.id;
};

const buildEdges = (nodes, stages) => {
    const edges = [];

    stages.forEach((stage, stageIndex) => {
        const stageNodes = getStageNodes(nodes, stage.id);

        stageNodes.forEach((node, index) => {
            if (index < stageNodes.length - 1) {
                edges.push({
                    id: `edge-${stage.id}-${node.id}-${stageNodes[index + 1].id}`,
                    source: node.id,
                    target: stageNodes[index + 1].id,
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#0078d4' },
                    style: { stroke: '#0078d4', strokeWidth: 1.5 }
                });
            }
        });

        const currentLast = stageNodes[stageNodes.length - 1];
        const nextStage = stages[stageIndex + 1];
        const nextFirst = nextStage ? getStageNodes(nodes, nextStage.id)[0] : null;

        if (currentLast && nextFirst) {
            edges.push({
                id: `edge-stage-${stage.id}-${nextStage.id}`,
                source: currentLast.id,
                target: nextFirst.id,
                markerEnd: { type: MarkerType.ArrowClosed, color: '#605e5c' },
                style: { stroke: '#c8c6c4', strokeWidth: 1.25, strokeDasharray: '4 4' }
            });
        }
    });

    return edges;
};

const reflowNodesForStages = (nodes, stages) => {
    if (!stages.length) {
        return nodes;
    }

    return stages.flatMap((stage) => {
        const stageNodes = getStageNodes(nodes, stage.id);

        return stageNodes.map((node, index) => ({
            ...node,
            position: {
                x: typeof node.position.x === 'number' ? node.position.x : NODE_X_START + ((index % 3) * NODE_X_GAP),
                y: getStageTop(stage.sortOrder) + NODE_Y_OFFSET + (Math.floor(index / 3) * NODE_ROW_GAP)
            },
            data: {
                ...node.data,
                stageId: stage.id,
                sortOrder: index
            }
        }));
    });
};

const buildDirtySnapshot = (workflowMeta, stages, nodes, templateId, templateName) => JSON.stringify({
    id: workflowMeta.id,
    issueTemplateId: templateId,
    name: workflowMeta.name || `${templateName || 'Template'} workflow`,
    isActive: workflowMeta.isActive,
    rowVersion: workflowMeta.rowVersion,
    stages: [...stages]
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((stage, stageIndex) => ({
            id: stage.persistedId,
            name: stage.name?.trim() || `Stage ${stageIndex + 1}`,
            description: stage.description?.trim() || null,
            color: stage.color,
            sortOrder: stageIndex,
            isActive: stage.isActive !== false,
            actions: getStageNodes(nodes, stage.id).map((node, actionIndex) => ({
                id: node.data.persistedId,
                name: node.data.name?.trim() || 'Unnamed action',
                actionType: node.data.actionType || 'General',
                description: node.data.description?.trim() || null,
                sortOrder: actionIndex,
                isActive: node.data.isActive !== false,
                positionX: node.position.x,
                positionY: node.position.y,
                ...getRequirementsFromActionType(node.data.actionType || 'General')
            }))
        }))
});

const getViewportIsMobile = () => typeof window !== 'undefined' && window.innerWidth < WORKFLOW_MOBILE_BREAKPOINT;

export const useWorkflowEditor = ({ templateId, templateName }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [workflowMeta, setWorkflowMeta] = useState({ id: null, rowVersion: 1, name: 'Default workflow', isActive: true });
    const [stages, setStages] = useState(buildDefaultStages());
    const [nodes, setNodes] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedStageId, setSelectedStageId] = useState(null);
    const [deleteStageTarget, setDeleteStageTarget] = useState(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(getViewportIsMobile);
    const nextStageIndexRef = useRef(4);
    const nextNodeIndexRef = useRef(1);
    const lastSavedSnapshotRef = useRef('');
    const pendingCloseRef = useRef(null);

    const laneHeight = useMemo(() => {
        const minimum = stages.length * (STAGE_HEIGHT + STAGE_GAP);
        const dynamic = nodes.length ? Math.max(...nodes.map((node) => node.position.y)) + 180 : 0;
        return Math.max(minimum, dynamic, 720);
    }, [nodes, stages]);

    const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) || null, [nodes, selectedNodeId]);
    const edges = useMemo(() => buildEdges(nodes, stages), [nodes, stages]);
    const stageActionCounts = useMemo(() => stages.reduce((summary, stage) => {
        summary[stage.id] = getStageNodes(nodes, stage.id).length;
        return summary;
    }, {}), [nodes, stages]);
    const dirtySnapshot = useMemo(() => buildDirtySnapshot(workflowMeta, stages, nodes, templateId, templateName), [nodes, stages, templateId, templateName, workflowMeta]);
    const dirty = dirtySnapshot !== lastSavedSnapshotRef.current;

    useEffect(() => {
        const handleResize = () => setIsMobile(getViewportIsMobile());

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!dirty) {
            return undefined;
        }

        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [dirty]);

    useEffect(() => {
        if (isMobile) {
            setSelectedNodeId(null);
        }
    }, [isMobile]);

    const applyWorkflow = useCallback((workflow) => {
        const sourceStages = workflow?.stages?.length
            ? workflow.stages.map((stage, index) => ({
                id: getStageId(stage.id, `stage-${index + 1}`),
                persistedId: getPersistedId(stage.id),
                name: stage.name || `Stage ${index + 1}`,
                description: stage.description || '',
                color: stage.color || DEFAULT_STAGE_LIBRARY[index % DEFAULT_STAGE_LIBRARY.length]?.color || '#0078d4',
                sortOrder: typeof stage.sortOrder === 'number' ? stage.sortOrder : index,
                isActive: stage.isActive !== false,
                sourceActions: stage.actions || []
            })).sort((left, right) => left.sortOrder - right.sortOrder)
            : buildDefaultStages();

        const stageIds = new Set(sourceStages.map((stage) => stage.id));
        const nextNodes = sourceStages.flatMap((stage) => (stage.sourceActions || [])
            .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0))
            .map((action, index) => buildNode(action, stage, index)))
            .map((node) => {
                if (!stageIds.has(node.data.stageId)) {
                    const fallbackStage = getDefaultStageForActionType(node.data.actionType, sourceStages);
                    return { ...node, data: { ...node.data, stageId: fallbackStage.id } };
                }

                return node;
            });

        const nextWorkflowMeta = {
            id: workflow?.id ?? null,
            rowVersion: workflow?.rowVersion ?? 1,
            name: workflow?.name || 'Default workflow',
            isActive: workflow?.isActive !== false
        };
        const nextStages = sourceStages.map(({ sourceActions, ...stage }, index) => ({ ...stage, sortOrder: index }));

        setWorkflowMeta(nextWorkflowMeta);
        setStages(nextStages);
        setNodes(nextNodes);
        setSelectedNodeId(nextNodes[0]?.id || null);
        setSelectedStageId(nextNodes[0]?.data.stageId || nextStages[0]?.id || null);
        setDeleteStageTarget(null);
        setDiscardOpen(false);
        lastSavedSnapshotRef.current = buildDirtySnapshot(nextWorkflowMeta, nextStages, nextNodes, templateId, templateName);
    }, [templateId, templateName]);

    const loadWorkflow = useCallback(async () => {
        try {
            setLoading(true);
            const workflow = await issueTrackerV2Service.getWorkflow(templateId);
            applyWorkflow(workflow);
        } catch (error) {
            console.error('Error loading workflow:', error);
            notify({ message: 'Failed to load workflow', type: 'error', displayTime: 3000 });
            applyWorkflow(null);
        } finally {
            setLoading(false);
        }
    }, [applyWorkflow, templateId]);

    useEffect(() => {
        if (templateId) {
            loadWorkflow();
        }
    }, [loadWorkflow, templateId]);

    const handleNodesChange = useCallback((changes) => {
        setNodes((currentNodes) => applyNodeChanges(changes, currentNodes).map((node) => {
            const nextStageId = determineStageIdForPosition(node.position.y, stages);
            return nextStageId && nextStageId !== node.data.stageId
                ? { ...node, data: { ...node.data, stageId: nextStageId } }
                : node;
        }));
    }, [stages]);

    const selectNode = useCallback((nodeId) => {
        const node = nodes.find((item) => item.id === nodeId);
        if (!node) {
            return;
        }

        setSelectedNodeId(node.id);
        setSelectedStageId(node.data.stageId);
    }, [nodes]);

    const selectStage = useCallback((stageId) => {
        setSelectedStageId(stageId);
    }, []);

    const closeInspector = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    const addStage = useCallback(() => {
        const nextIndex = nextStageIndexRef.current;
        nextStageIndexRef.current += 1;

        const nextStages = [
            ...stages,
            {
                id: `stage-temp-${nextIndex}`,
                persistedId: null,
                name: `Stage ${nextIndex}`,
                description: '',
                color: STAGE_COLOR_OPTIONS[(nextIndex - 1) % STAGE_COLOR_OPTIONS.length].value,
                sortOrder: stages.length,
                isActive: true
            }
        ];

        setStages(nextStages);
        setSelectedStageId(nextStages[nextStages.length - 1].id);
    }, [stages]);

    const updateStage = useCallback((stageId, field, value) => {
        setStages((current) => current.map((stage) => (stage.id === stageId ? { ...stage, [field]: value } : stage)));
    }, []);

    const moveStage = useCallback((stageId, direction) => {
        const currentIndex = stages.findIndex((stage) => stage.id === stageId);
        const targetIndex = currentIndex + direction;

        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= stages.length) {
            return;
        }

        const reorderedStages = [...stages];
        const [movedStage] = reorderedStages.splice(currentIndex, 1);
        reorderedStages.splice(targetIndex, 0, movedStage);
        const nextStages = reorderedStages.map((stage, index) => ({ ...stage, sortOrder: index }));

        setStages(nextStages);
        setNodes((current) => reflowNodesForStages(current, nextStages));
    }, [stages]);

    const requestDeleteStage = useCallback((stageId) => {
        const stage = stages.find((item) => item.id === stageId) || null;

        if (!stage) {
            return;
        }

        if (stages.length <= 1) {
            notify({ message: 'At least one stage is required', type: 'warning', displayTime: 2500 });
            return;
        }

        setDeleteStageTarget(stage);
    }, [stages]);

    const cancelDeleteStage = useCallback(() => {
        setDeleteStageTarget(null);
    }, []);

    const confirmDeleteStage = useCallback(() => {
        if (!deleteStageTarget) {
            return;
        }

        const remainingStages = stages
            .filter((stage) => stage.id !== deleteStageTarget.id)
            .map((stage, index) => ({ ...stage, sortOrder: index }));
        const fallbackStage = remainingStages[0];

        if (!fallbackStage) {
            return;
        }

        const reassignedNodes = nodes.map((node) => (
            node.data.stageId === deleteStageTarget.id
                ? { ...node, data: { ...node.data, stageId: fallbackStage.id } }
                : node
        ));

        setStages(remainingStages);
        setNodes(reflowNodesForStages(reassignedNodes, remainingStages));
        setSelectedNodeId((current) => {
            const selected = reassignedNodes.find((node) => node.id === current);
            return selected ? current : null;
        });
        setSelectedStageId((current) => (current === deleteStageTarget.id ? fallbackStage.id : current));
        setDeleteStageTarget(null);
    }, [deleteStageTarget, nodes, stages]);

    const addAction = useCallback(() => {
        const activeStage = stages.find((stage) => stage.id === selectedStageId)
            || stages.find((stage) => stage.id === selectedNode?.data.stageId)
            || stages[0];

        if (!activeStage) {
            return;
        }

        const stageNodes = getStageNodes(nodes, activeStage.id);
        const tempId = `temp-${nextNodeIndexRef.current}`;
        nextNodeIndexRef.current += 1;

        const nextNode = buildNode({
            id: null,
            ...EMPTY_ACTION,
            sortOrder: stageNodes.length,
            positionX: NODE_X_START + ((stageNodes.length % 3) * NODE_X_GAP),
            positionY: getStageTop(activeStage.sortOrder) + NODE_Y_OFFSET + (Math.floor(stageNodes.length / 3) * NODE_ROW_GAP)
        }, activeStage, stageNodes.length);

        nextNode.id = tempId;
        nextNode.data.persistedId = null;
        setNodes((current) => [...current, nextNode]);
        setSelectedNodeId(tempId);
        setSelectedStageId(activeStage.id);
    }, [nodes, selectedNode, selectedStageId, stages]);

    const removeSelectedAction = useCallback(() => {
        if (!selectedNode) {
            return;
        }

        setNodes((current) => current.filter((node) => node.id !== selectedNode.id));
        setSelectedNodeId(null);
    }, [selectedNode]);

    const updateNode = useCallback((field, value) => {
        if (!selectedNode) {
            return;
        }

        setNodes((current) => {
            const nextNodes = current.map((node) => {
                if (node.id !== selectedNode.id) {
                    return node;
                }

                return {
                    ...node,
                    data: {
                        ...node.data,
                        [field]: value
                    }
                };
            });

            return field === 'stageId' ? reflowNodesForStages(nextNodes, stages) : nextNodes;
        });

        if (field === 'stageId') {
            setSelectedStageId(value);
        }
    }, [selectedNode, stages]);

    const buildSavePayload = useCallback(() => JSON.parse(buildDirtySnapshot(workflowMeta, stages, nodes, templateId, templateName)), [nodes, stages, templateId, templateName, workflowMeta]);

    const saveWorkflow = useCallback(async () => {
        try {
            setSaving(true);
            const savedWorkflow = await issueTrackerV2Service.saveWorkflow(templateId, buildSavePayload(), { silent: true });
            applyWorkflow(savedWorkflow);
            notify({ message: 'Workflow saved successfully.', type: 'success', displayTime: 3000 });
        } catch (error) {
            console.error('Error saving workflow:', error);
            notify({ message: error?.message || 'Failed to save workflow', type: 'error', displayTime: 3000 });
        } finally {
            setSaving(false);
        }
    }, [applyWorkflow, buildSavePayload, templateId]);

    const requestClose = useCallback((onApprove) => {
        if (!dirty) {
            onApprove?.();
            return;
        }

        pendingCloseRef.current = onApprove || null;
        setDiscardOpen(true);
    }, [dirty]);

    const cancelDiscardClose = useCallback(() => {
        pendingCloseRef.current = null;
        setDiscardOpen(false);
    }, []);

    const confirmDiscardClose = useCallback(() => {
        const onApprove = pendingCloseRef.current;
        pendingCloseRef.current = null;
        setDiscardOpen(false);
        onApprove?.();
    }, []);

    return {
        loading,
        saving,
        dirty,
        isMobile,
        workflowMeta,
        stages,
        nodes,
        edges,
        selectedNode,
        selectedNodeId,
        selectedStageId,
        laneHeight,
        stageActionCounts,
        deleteStageTarget,
        discardOpen,
        loadWorkflow,
        saveWorkflow,
        addStage,
        updateStage,
        moveStage,
        requestDeleteStage,
        cancelDeleteStage,
        confirmDeleteStage,
        addAction,
        removeSelectedAction,
        updateNode,
        selectNode,
        selectStage,
        closeInspector,
        handleNodesChange,
        requestClose,
        cancelDiscardClose,
        confirmDiscardClose
    };
};