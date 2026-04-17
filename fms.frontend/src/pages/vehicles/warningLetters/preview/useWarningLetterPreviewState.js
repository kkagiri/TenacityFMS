/**
 * File: useWarningLetterPreviewState.js
 * Purpose: Encapsulates warning letter preview page state, loading, and workflow actions.
 * Dependencies: React, devextreme notify, warningLetterService, notificationGroupsApi, notificationsApi
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - useWarningLetterPreviewState(): Coordinates preview data, recipients, and document workflow actions.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import notify from "devextreme/ui/notify";
import notificationGroupsApi from "../../../../dataservice/notificationGroupsApi";
import notificationsApi from "../../../../dataservice/notificationsApi";
import {
    acknowledgeWarningLetter,
    downloadWarningLetterApproveLetter,
    downloadWarningLetterSignedCopy,
    fetchWarningLetterPdf,
    fetchWarningLetterSignatureRecipients,
    getWarningLetter,
    requestWarningLetterSignature,
    sendWarningLetterEmail,
    uploadWarningLetterApproveLetter,
    uploadWarningLetterSignedCopy,
} from "../warningLetterService";
import { mapGroupToViewModel, mapUserToViewModel } from "./warningLetterPreviewConstants";
import {
    buildPreviewDerivedState,
    downloadBlobDocument,
    formatDocumentDate,
    formatDocumentSize,
} from "./warningLetterPreviewStateHelpers";

export const useWarningLetterPreviewState = ({ id, canViewPdf, canUpdate, canManageRecipientGroups, userInfo }) => {
    const approveLetterInputRef = useRef(null);
    const signedCopyInputRef = useRef(null);
    const [letter, setLetter] = useState(null);
    const [pdfUrl, setPdfUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [signaturePopupOpen, setSignaturePopupOpen] = useState(false);
    const [signatureRecipientOptions, setSignatureRecipientOptions] = useState({
        siteRepresentativeGroupName: "Warning Letter Site Representatives",
        signatureCcGroupName: "Warning Letter Signature CC",
        siteRepresentatives: [],
        signatureCcRecipients: [],
    });
    const [signatureRecipientsLoading, setSignatureRecipientsLoading] = useState(false);
    const [selectedSignatureRecipientId, setSelectedSignatureRecipientId] = useState(null);
    const [manualSignatureRecipientEmail, setManualSignatureRecipientEmail] = useState("");
    const [selectedCcRecipientIds, setSelectedCcRecipientIds] = useState([]);
    const [signatureSubmitting, setSignatureSubmitting] = useState(false);
    const [approveLetterUploading, setApproveLetterUploading] = useState(false);
    const [signedCopyUploading, setSignedCopyUploading] = useState(false);
    const [recipientGroupPanelOpen, setRecipientGroupPanelOpen] = useState(false);
    const [recipientGroupLoading, setRecipientGroupLoading] = useState(false);
    const [recipientGroupTarget, setRecipientGroupTarget] = useState(null);
    const [recipientGroupMembers, setRecipientGroupMembers] = useState([]);
    const [recipientGroupUserOptions, setRecipientGroupUserOptions] = useState([]);
    const [recipientGroupAddMemberId, setRecipientGroupAddMemberId] = useState("");
    const [helpPanelOpen, setHelpPanelOpen] = useState(false);
    const [expandedPanels, setExpandedPanels] = useState({
        document: true,
        approved: true,
        signed: true,
    });

    const loadRecipientGroupUsers = useCallback(async () => {
        if (recipientGroupUserOptions.length > 0) {
            return recipientGroupUserOptions;
        }
        if (!letter?.siteId) {
            return [];
        }
        const response = await notificationsApi.getRecipientCandidates({
            siteId: Number(letter.siteId),
            take: 200,
        });
        if (!response.isSuccess) {
            throw new Error(response.message || "Failed to load recipient candidates.");
        }
        const normalizedUsers = (Array.isArray(response.data) ? response.data : [])
            .map(mapUserToViewModel)
            .filter((user) => user.id);
        setRecipientGroupUserOptions(normalizedUsers);
        return normalizedUsers;
    }, [letter?.siteId, recipientGroupUserOptions]);

    const loadRecipientGroupMembers = useCallback(async (group, usersSource) => {
        const response = await notificationGroupsApi.getGroupMembers(group.id);
        if (!response.isSuccess) {
            throw new Error(response.message || "Failed to load members.");
        }

        const rawMembers = (response.data || []).map((member) => ({
            id: member.id,
            memberType: member.memberType,
            memberId: (member.memberId || "").trim(),
            name: member.name || "",
            email: member.email || "",
            role: member.role || "",
        }));

        const userMap = new Map((usersSource || []).map((user) => [String(user.id), user]));
        return rawMembers.map((member) => {
            if (member.memberType === "User") {
                const matchedUser = userMap.get(member.memberId);
                if (matchedUser) {
                    const fullName = `${matchedUser.firstName || ""} ${matchedUser.lastName || ""}`.trim();
                    const resolvedName = fullName || matchedUser.userName || matchedUser.email || member.memberId;
                    return {
                        ...member,
                        name: resolvedName,
                        email: matchedUser.email,
                        role: matchedUser.role,
                    };
                }

                if (member.name || member.email || member.role) {
                    return {
                        ...member,
                        name: member.name || member.memberId,
                        email: member.email || "",
                        role: member.role || "",
                    };
                }
            }

            return {
                ...member,
                name: member.name || member.memberId,
                email: member.email || "",
                role: member.role || "",
            };
        });
    }, []);

    const loadPdfPreview = useCallback(async (forceGenerate = false) => {
        try {
            setPreviewLoading(true);
            const document = await fetchWarningLetterPdf(id, forceGenerate);
            setPdfUrl((currentUrl) => {
                if (currentUrl) {
                    URL.revokeObjectURL(currentUrl);
                }

                return URL.createObjectURL(document.blob);
            });
        } catch (error) {
            notify(error.message || "Failed to load PDF preview.", "error", 3000);
        } finally {
            setPreviewLoading(false);
        }
    }, [id]);

    const loadDetail = useCallback(async () => {
        try {
            setLoading(true);
            const detail = await getWarningLetter(id);
            setLetter(detail);
        } catch (error) {
            notify(error.message || "Failed to load warning letter.", "error", 3000);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadSignatureRecipients = useCallback(async () => {
        try {
            setSignatureRecipientsLoading(true);
            const recipientOptions = await fetchWarningLetterSignatureRecipients(id);
            setSignatureRecipientOptions(recipientOptions);
        } catch (error) {
            notify(error.message || "Failed to load site representatives.", "error", 3000);
        } finally {
            setSignatureRecipientsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    useEffect(() => {
        setSelectedSignatureRecipientId(letter?.signatureRequestRecipientUserId || null);
        setManualSignatureRecipientEmail(letter?.signatureRequestRecipient || "");
        setSelectedCcRecipientIds(Array.isArray(letter?.signatureRequestCcUserIds) ? letter.signatureRequestCcUserIds : []);
    }, [letter?.signatureRequestCcUserIds, letter?.signatureRequestRecipient, letter?.signatureRequestRecipientUserId]);

    useEffect(() => {
        setSelectedSignatureRecipientId((currentValue) => {
            if (currentValue && signatureRecipients.some((recipient) => recipient.id === currentValue)) {
                return currentValue;
            }
            const persistedValue = letter?.signatureRequestRecipientUserId;
            return persistedValue && signatureRecipients.some((recipient) => recipient.id === persistedValue)
                ? persistedValue
                : null;
        });
        setSelectedCcRecipientIds((currentValue) => {
            if (!Array.isArray(currentValue)) {
                return [];
            }
            return currentValue.filter((recipientId) => signatureCcRecipients.some((recipient) => recipient.id === recipientId));
        });
    }, [letter?.signatureRequestRecipientUserId, signatureCcRecipients, signatureRecipients]);

    useEffect(() => {
        if (canViewPdf) {
            loadPdfPreview(false);
        }
    }, [canViewPdf, loadPdfPreview]);

    useEffect(() => () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
    }, [pdfUrl]);

    useEffect(() => {
        if (!signaturePopupOpen) {
            return;
        }
        loadSignatureRecipients();
    }, [loadSignatureRecipients, signaturePopupOpen]);

    const refreshAll = useCallback(async (forceGenerate = false) => {
        await loadDetail();

        if (canViewPdf) {
            await loadPdfPreview(forceGenerate);
        }
    }, [canViewPdf, loadDetail, loadPdfPreview]);

    const openRecipientGroupPanel = useCallback(async (groupName) => {
        if (!canManageRecipientGroups) {
            notify("You do not have permission to manage warning-letter recipient groups.", "warning", 2500);
            return;
        }

        if (!letter?.siteId || !groupName) {
            notify("Warning-letter site context is missing.", "warning", 2500);
            return;
        }

        try {
            setRecipientGroupLoading(true);
            setRecipientGroupPanelOpen(true);
            setRecipientGroupAddMemberId("");

            const [usersSource, groupsResponse] = await Promise.all([
                loadRecipientGroupUsers(),
                notificationGroupsApi.getGroups(Number(letter.siteId)),
            ]);

            if (!groupsResponse.isSuccess) {
                throw new Error(groupsResponse.message || "Failed to load notification groups.");
            }

            const matchedGroup = (groupsResponse.data || [])
                .map(mapGroupToViewModel)
                .find((group) => group.displayName === groupName);

            if (!matchedGroup) {
                throw new Error(`${groupName} is not configured for this site.`);
            }

            const members = await loadRecipientGroupMembers(matchedGroup, usersSource);
            setRecipientGroupTarget(matchedGroup);
            setRecipientGroupMembers(members);
        } catch (error) {
            setRecipientGroupPanelOpen(false);
            notify(error.message || "Failed to open recipient group editor.", "error", 3000);
        } finally {
            setRecipientGroupLoading(false);
        }
    }, [canManageRecipientGroups, letter?.siteId, loadRecipientGroupMembers, loadRecipientGroupUsers]);

    const handleAcknowledge = useCallback(async () => {
        if (!window.confirm(`Mark warning letter #${id} as acknowledged?`)) {
            return;
        }

        try {
            await acknowledgeWarningLetter(id);
            notify("Warning letter acknowledged.", "success", 2500);
            await refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to acknowledge warning letter.", "error", 3000);
        }
    }, [id, refreshAll]);

    const handleSendEmail = useCallback(async () => {
        const recipient = letter?.emailRecipient || letter?.employeeEmail || "";
        if (!recipient) {
            notify("No employee email address is available for this warning letter.", "warning", 3000);
            return;
        }

        try {
            await sendWarningLetterEmail(id);
            notify(`Warning letter emailed to ${recipient}.`, "success", 2500);
            await refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to send warning letter email.", "error", 3000);
        }
    }, [id, letter?.emailRecipient, letter?.employeeEmail, refreshAll]);

    const handleOpenRequestSignature = useCallback(() => {
        setSelectedSignatureRecipientId(letter?.signatureRequestRecipientUserId || null);
        setManualSignatureRecipientEmail(letter?.signatureRequestRecipient || "");
        setSignaturePopupOpen(true);
    }, [letter?.signatureRequestRecipient, letter?.signatureRequestRecipientUserId]);

    const handleSignatureRecipientChanged = useCallback((event) => {
        const nextRecipientId = event.value || null;
        const matchedRecipient = signatureRecipients.find((recipient) => recipient.id === nextRecipientId) || null;
        setSelectedSignatureRecipientId(nextRecipientId);
        if (matchedRecipient?.email) {
            setManualSignatureRecipientEmail(matchedRecipient.email);
        }
    }, [signatureRecipients]);

    const handleCloseRecipientGroupPanel = useCallback(() => {
        if (recipientGroupLoading) {
            return;
        }

        setRecipientGroupPanelOpen(false);
        setRecipientGroupTarget(null);
        setRecipientGroupMembers([]);
        setRecipientGroupAddMemberId("");
    }, [recipientGroupLoading]);

    const handleAddRecipientGroupMember = useCallback(async () => {
        if (!recipientGroupTarget) {
            return;
        }

        if (!recipientGroupAddMemberId) {
            notify("Select a user first.", "warning", 2500);
            return;
        }

        const alreadyExists = recipientGroupMembers.some(
            (member) => member.memberType === "User" && String(member.memberId) === String(recipientGroupAddMemberId)
        );

        if (alreadyExists) {
            notify("This member is already in the group.", "warning", 2500);
            return;
        }

        try {
            setRecipientGroupLoading(true);
            const result = await notificationGroupsApi.addGroupMembers(recipientGroupTarget.id, [{ memberType: "User", memberId: recipientGroupAddMemberId }]);
            if (!result.isSuccess) {
                throw new Error(result.message || "Failed to add member.");
            }

            const refreshedMembers = await loadRecipientGroupMembers(recipientGroupTarget, recipientGroupUserOptions);
            setRecipientGroupMembers(refreshedMembers);
            setRecipientGroupAddMemberId("");
            await loadSignatureRecipients();
            notify(result.message || "Member added.", "success", 2500);
        } catch (error) {
            notify(error.message || "Failed to add member.", "error", 3000);
        } finally {
            setRecipientGroupLoading(false);
        }
    }, [loadRecipientGroupMembers, loadSignatureRecipients, recipientGroupAddMemberId, recipientGroupMembers, recipientGroupTarget, recipientGroupUserOptions]);

    const handleRemoveRecipientGroupMember = useCallback(async (member) => {
        if (!recipientGroupTarget || !member?.id) {
            return;
        }

        try {
            setRecipientGroupLoading(true);
            const result = await notificationGroupsApi.removeGroupMember(recipientGroupTarget.id, member.id);
            if (!result.isSuccess) {
                throw new Error(result.message || "Failed to remove member.");
            }

            setRecipientGroupMembers((currentMembers) => currentMembers.filter((currentMember) => currentMember.id !== member.id));
            await loadSignatureRecipients();
            notify("Member removed.", "success", 2000);
        } catch (error) {
            notify(error.message || "Failed to remove member.", "error", 3000);
        } finally {
            setRecipientGroupLoading(false);
        }
    }, [loadSignatureRecipients, recipientGroupTarget]);

    const handleRequestSignature = useCallback(async () => {
        const effectiveSignatureRecipientEmail = previewDerivedState.effectiveSignatureRecipientEmail;

        if (!previewDerivedState.selectedSignatureRecipient && !previewDerivedState.canSubmitSignatureRequest) {
            notify("Select a site user or enter a valid recipient email first.", "warning", 2500);
            return;
        }

        try {
            setSignatureSubmitting(true);
            await requestWarningLetterSignature(id, {
                signatureRecipientUserId: previewDerivedState.selectedSignatureRecipient?.id || null,
                emailRecipient: effectiveSignatureRecipientEmail,
                ccRecipientUserIds: selectedCcRecipientIds,
            });
            notify("Signature request sent.", "success", 2500);
            setSignaturePopupOpen(false);
            await refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to request signature.", "error", 3000);
        } finally {
            setSignatureSubmitting(false);
        }
    }, [id, refreshAll, selectedCcRecipientIds, previewDerivedState.selectedSignatureRecipient, previewDerivedState.canSubmitSignatureRequest, previewDerivedState.effectiveSignatureRecipientEmail]);

    const handleSignedCopySelected = useCallback(async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }

        try {
            setSignedCopyUploading(true);
            const updatedLetter = await uploadWarningLetterSignedCopy(id, file);
            setLetter(updatedLetter);
            notify("Signed copy uploaded.", "success", 2500);
            await refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to upload signed copy.", "error", 3000);
        } finally {
            setSignedCopyUploading(false);
        }
    }, [id, refreshAll]);

    const handleApproveLetterSelected = useCallback(async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }

        try {
            setApproveLetterUploading(true);
            const updatedLetter = await uploadWarningLetterApproveLetter(id, file);
            setLetter(updatedLetter);
            notify("Approved letter uploaded.", "success", 2500);
            await refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to upload approved letter.", "error", 3000);
        } finally {
            setApproveLetterUploading(false);
        }
    }, [id, refreshAll]);

    const handleDownloadSignedCopy = useCallback(async () => {
        try {
            const fileDocument = await downloadWarningLetterSignedCopy(id);
            downloadBlobDocument(fileDocument);
        } catch (error) {
            notify(error.message || "Failed to download signed copy.", "error", 3000);
        }
    }, [id]);

    const handleDownloadApproveLetter = useCallback(async () => {
        try {
            const fileDocument = await downloadWarningLetterApproveLetter(id);
            downloadBlobDocument(fileDocument);
        } catch (error) {
            notify(error.message || "Failed to download approved letter.", "error", 3000);
        }
    }, [id]);

    const handleDownloadPdf = useCallback(() => {
        if (!pdfUrl) {
            return;
        }

        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `warning-letter-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [id, pdfUrl]);

    const togglePanel = useCallback((panelKey) => {
        setExpandedPanels((currentPanels) => ({
            ...currentPanels,
            [panelKey]: !currentPanels[panelKey],
        }));
    }, []);

    const signatureRecipients = useMemo(
        () => (Array.isArray(signatureRecipientOptions.siteRepresentatives) ? signatureRecipientOptions.siteRepresentatives : []),
        [signatureRecipientOptions.siteRepresentatives]
    );

    const signatureCcRecipients = useMemo(
        () => (Array.isArray(signatureRecipientOptions.signatureCcRecipients) ? signatureRecipientOptions.signatureCcRecipients : []),
        [signatureRecipientOptions.signatureCcRecipients]
    );

    const previewDerivedState = useMemo(() => buildPreviewDerivedState({
        letter,
        signatureRecipients,
        signatureCcRecipients,
        selectedSignatureRecipientId,
        manualSignatureRecipientEmail,
        signatureRecipientsLoading,
        signatureSubmitting,
        canUpdate,
        userInfo,
    }), [
        canUpdate,
        letter,
        manualSignatureRecipientEmail,
        selectedSignatureRecipientId,
        signatureCcRecipients,
        signatureRecipients,
        signatureRecipientsLoading,
        signatureSubmitting,
        userInfo,
    ]);
    return {
        approveLetterInputRef,
        signedCopyInputRef,
        letter,
        pdfUrl,
        loading,
        previewLoading,
        signaturePopupOpen,
        setSignaturePopupOpen,
        signatureRecipientOptions,
        signatureRecipients,
        signatureCcRecipients,
        availableSignatureCcRecipients: previewDerivedState.availableSignatureCcRecipients,
        signatureRecipientsLoading,
        selectedSignatureRecipientId,
        manualSignatureRecipientEmail,
        selectedCcRecipientIds,
        setManualSignatureRecipientEmail,
        setSelectedCcRecipientIds,
        signatureSubmitting,
        approveLetterUploading,
        signedCopyUploading,
        recipientGroupPanelOpen,
        recipientGroupLoading,
        recipientGroupTarget,
        recipientGroupMembers,
        recipientGroupUserOptions,
        recipientGroupAddMemberId,
        setRecipientGroupAddMemberId,
        helpPanelOpen,
        setHelpPanelOpen,
        expandedPanels,
        togglePanel,
        showSignatureGroupWarning: previewDerivedState.showSignatureGroupWarning,
        workflowStage: previewDerivedState.workflowStage,
        hasApprovedLetter: previewDerivedState.hasApprovedLetter,
        workflowLocked: previewDerivedState.workflowLocked,
        canUploadWorkflowDocuments: previewDerivedState.canUploadWorkflowDocuments,
        approvedLetterLocked: previewDerivedState.approvedLetterLocked,
        canAcknowledge: previewDerivedState.canAcknowledge,
        status: previewDerivedState.status,
        approveLetterUploadedByLabel: previewDerivedState.approveLetterUploadedByLabel,
        signedCopyUploadedByLabel: previewDerivedState.signedCopyUploadedByLabel,
        ccRecipientsLabel: previewDerivedState.ccRecipientsLabel,
        approvedStatus: previewDerivedState.approvedStatus,
        signedStatus: previewDerivedState.signedStatus,
        canSubmitSignatureRequest: previewDerivedState.canSubmitSignatureRequest,
        formatDocumentDate,
        formatDocumentSize,
        loadPdfPreview,
        handleAcknowledge,
        handleSendEmail,
        handleOpenRequestSignature,
        handleSignatureRecipientChanged,
        handleCloseRecipientGroupPanel,
        handleAddRecipientGroupMember,
        handleRemoveRecipientGroupMember,
        handleRequestSignature,
        handleSignedCopySelected,
        handleApproveLetterSelected,
        handleDownloadSignedCopy,
        handleDownloadApproveLetter,
        handleDownloadPdf,
        openRecipientGroupPanel,
    };
};
