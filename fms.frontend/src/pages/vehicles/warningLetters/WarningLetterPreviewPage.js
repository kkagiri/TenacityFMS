/**
 * File: WarningLetterPreviewPage.js
 * Purpose: Presents a saved warning letter with PDF preview and workflow actions.
 * Dependencies: React, react-router-dom, warningLetterService, usePermissions, SlidePanel
 * Last Modified: 2026-04-14
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import notify from "devextreme/ui/notify";
import DataGrid, { Column } from "devextreme-react/data-grid";
import SelectBox from "devextreme-react/select-box";
import TagBox from "devextreme-react/tag-box";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import SlidePanel from "../../../components/ui/SlidePanel";
import notificationGroupsApi from "../../../dataservice/notificationGroupsApi";
import notificationsApi from "../../../dataservice/notificationsApi";
import {
    acknowledgeWarningLetter,
    downloadWarningLetterApproveLetter,
    fetchWarningLetterPdf,
    fetchWarningLetterSignatureRecipients,
    getWarningLetter,
    downloadWarningLetterSignedCopy,
    requestWarningLetterSignature,
    sendWarningLetterEmail,
    uploadWarningLetterApproveLetter,
    uploadWarningLetterSignedCopy,
} from "./warningLetterService";
import "./WarningLetters.scss";

const workflowStageMap = {
    0: { label: "Draft", cls: "m365-badge--neutral" },
    1: { label: "Approved", cls: "m365-badge--primary" },
    2: { label: "Pending Signed", cls: "m365-badge--warning" },
    3: { label: "Signed", cls: "m365-badge--success" },
    4: { label: "Acknowledged", cls: "m365-badge--success" },
};

const typeMap = {
    1: "Excess Fuel Consumption",
    2: "Excessive Speed",
    3: "Excessive Idling",
};

const isGuidLike = (value) =>
    typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const mapGroupToViewModel = (group) => ({
    id: group.id,
    name: group.name || group.id || group.groupName,
    displayName: group.name || group.displayName || group.groupName || `Group #${group.id}`,
    description: group.description,
    memberCount: group.memberCount ?? group.members?.length ?? 0,
    isActive: group.isActive === true || group.isActive !== false,
    siteId: group.siteId ?? group.siteID ?? null,
    siteName: group.siteName || group.site?.name || "",
});

const mapUserToViewModel = (user) => ({
    id: user.id || user.userId || user.Id,
    firstName: user.firstName || user.FirstName || "",
    lastName: user.lastName || user.LastName || "",
    userName: user.userName || user.UserName || user.username || user.Username || "",
    email: user.email || user.Email || "",
    role: (user.role || user.Role || (Array.isArray(user.roles) ? user.roles.join(",") : "")) ?? "",
    isActive: user.isActive !== false && user.deleted !== true,
});

const WarningLetterPreviewPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPermission } = usePermissions();
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

    const canUpdate = hasPermission("_Update_WarningLetter");
    const canSend = hasPermission("_Send_WarningLetter");
    const canViewPdf = hasPermission("_Generate_WarningLetter_PDF");
    const canUploadApproveLetter = hasPermission("_Update_WarningLetter");
    const canUploadSignedCopy = hasPermission("_UploadSignedCopy_WarningLetter");
    const canManageRecipientGroups = hasPermission("_Manage_NotificationGroups");
    const canEditSignatureRecipients = canManageRecipientGroups || canUpdate;

    const signatureRecipients = Array.isArray(signatureRecipientOptions.siteRepresentatives) ? signatureRecipientOptions.siteRepresentatives : [];
    const signatureCcRecipients = Array.isArray(signatureRecipientOptions.signatureCcRecipients) ? signatureRecipientOptions.signatureCcRecipients : [];
    const availableSignatureCcRecipients = signatureCcRecipients.filter((recipient) => recipient.id !== selectedSignatureRecipientId);
    const selectedSignatureRecipient = signatureRecipients.find((recipient) => recipient.id === selectedSignatureRecipientId) || null;
    const showSignatureGroupWarning = signatureRecipients.length === 0 && signatureCcRecipients.length > 0;
    const workflowStage = letter?.workflowStage ?? 0;
    const hasApprovedLetter = Boolean(letter?.approveLetterUploadedAt);
    const hasSignedCopy = Boolean(letter?.signedCopyUploadedAt);
    const workflowLocked = workflowStage >= 3;
    const canUploadWorkflowDocuments = Boolean(letter);
    const approvedLetterLocked = Boolean(letter?.signatureRequestedAt || letter?.signedCopyUploadedAt || letter?.employeeAcknowledgedAt);

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

    const openRecipientGroupPanel = useCallback(async (groupName) => {
        if (!canEditSignatureRecipients) {
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
    }, [canEditSignatureRecipients, letter?.siteId, loadRecipientGroupMembers, loadRecipientGroupUsers]);

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
        setSelectedCcRecipientIds(Array.isArray(letter?.signatureRequestCcUserIds) ? letter.signatureRequestCcUserIds : []);
    }, [letter?.signatureRequestCcUserIds, letter?.signatureRequestRecipientUserId]);

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

    const refreshAll = async (forceGenerate = false) => {
        await loadDetail();

        if (canViewPdf) {
            await loadPdfPreview(forceGenerate);
        }
    };

    const handleAcknowledge = async () => {
        if (!window.confirm(`Mark warning letter #${id} as acknowledged?`)) {
            return;
        }

        try {
            await acknowledgeWarningLetter(id);
            notify("Warning letter acknowledged.", "success", 2500);
            refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to acknowledge warning letter.", "error", 3000);
        }
    };

    const handleSendEmail = async () => {
        const recipient = letter?.emailRecipient || letter?.employeeEmail || "";
        if (!recipient) {
            notify("No employee email address is available for this warning letter.", "warning", 3000);
            return;
        }

        try {
            await sendWarningLetterEmail(id);
            notify(`Warning letter emailed to ${recipient}.`, "success", 2500);
            refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to send warning letter email.", "error", 3000);
        }
    };

    const handleOpenRequestSignature = () => {
        setSelectedSignatureRecipientId(letter?.signatureRequestRecipientUserId || null);
        setSignaturePopupOpen(true);
    };

    const handleCloseRecipientGroupPanel = () => {
        if (recipientGroupLoading) {
            return;
        }

        setRecipientGroupPanelOpen(false);
        setRecipientGroupTarget(null);
        setRecipientGroupMembers([]);
        setRecipientGroupAddMemberId("");
    };

    const handleAddRecipientGroupMember = async () => {
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
    };

    const handleRemoveRecipientGroupMember = async (member) => {
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
    };

    const handleRequestSignature = async () => {
        if (!selectedSignatureRecipient) {
            notify("Select a site representative first.", "warning", 2500);
            return;
        }

        try {
            setSignatureSubmitting(true);
            await requestWarningLetterSignature(id, {
                signatureRecipientUserId: selectedSignatureRecipient.id,
                emailRecipient: selectedSignatureRecipient.email,
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
    };

    const handleSignedCopySelected = async (event) => {
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
    };

    const handleApproveLetterSelected = async (event) => {
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
    };

    const handleDownloadSignedCopy = async () => {
        try {
            const fileDocument = await downloadWarningLetterSignedCopy(id);
            const url = URL.createObjectURL(fileDocument.blob);
            const link = window.document.createElement("a");
            link.href = url;
            link.download = fileDocument.fileName;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            notify(error.message || "Failed to download signed copy.", "error", 3000);
        }
    };

    const handleDownloadApproveLetter = async () => {
        try {
            const fileDocument = await downloadWarningLetterApproveLetter(id);
            const url = URL.createObjectURL(fileDocument.blob);
            const link = window.document.createElement("a");
            link.href = url;
            link.download = fileDocument.fileName;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            notify(error.message || "Failed to download approved letter.", "error", 3000);
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) {
            return;
        }

        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `warning-letter-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const status = workflowStageMap[workflowStage] || { label: "Unknown", cls: "m365-badge--neutral" };

    const getUploadedByLabel = (value) => {
        if (!value) {
            return "N/A";
        }

        return isGuidLike(value) ? "Refreshing uploader details..." : value;
    };

    const formatDocumentDate = (value, fallback) => (value ? new Date(value).toLocaleString() : fallback);
    const formatDocumentSize = (value) => {
        if (!value) {
            return "N/A";
        }

        if (value >= 1024 * 1024) {
            return `${(value / (1024 * 1024)).toFixed(2)} MB`;
        }

        if (value >= 1024) {
            return `${(value / 1024).toFixed(1)} KB`;
        }

        return `${value} bytes`;
    };

    const approveLetterUploadedByLabel = getUploadedByLabel(letter?.approveLetterUploadedBy);
    const signedCopyUploadedByLabel = getUploadedByLabel(letter?.signedCopyUploadedBy);
    const ccRecipientsLabel = Array.isArray(letter?.signatureRequestCcRecipients) && letter.signatureRequestCcRecipients.length > 0
        ? letter.signatureRequestCcRecipients.join(", ")
        : "None";
    const approvedStatus = hasApprovedLetter
        ? { label: "Uploaded", cls: "m365-badge--success" }
        : { label: "Pending", cls: "m365-badge--neutral" };
    const signedStatus = hasSignedCopy
        ? { label: "Received", cls: "m365-badge--success" }
        : letter?.signatureRequestedAt
            ? { label: "Requested", cls: "m365-badge--warning" }
            : { label: "Pending", cls: "m365-badge--neutral" };

    const togglePanel = (panelKey) => {
        setExpandedPanels((currentPanels) => ({
            ...currentPanels,
            [panelKey]: !currentPanels[panelKey],
        }));
    };

    return (
        <div className="warning-letter-page warning-letter-preview">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-file-pdf m365-page-header__icon" />
                    <h2 className="m365-page-header__title">Warning Letter Preview</h2>
                    {letter && <span className={`m365-badge ${status.cls}`}>{status.label}</span>}
                </div>
                <div className="m365-page-header__actions warning-letter-preview__header-actions">
                    <div className="warning-letter-preview__header-group">
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate("/reports/warning-letters")}>
                            <i className="fa-light fa-arrow-left" /> Back
                        </button>
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => setHelpPanelOpen(true)}>
                            <i className="fa-light fa-circle-question" /> Document Procedure
                        </button>
                        {canUpdate && letter?.status === 0 && (
                            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate(`/reports/warning-letters/${id}/edit`)}>
                                <i className="fa-light fa-pen" /> Edit
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {letter && (
                <div className="warning-letter-preview__layout">
                    <div className="warning-letter-preview__rail">
                        <div className="warning-letter-page__panel warning-letter-preview__meta-card">
                            <div className="warning-letter-preview__panel-heading">
                                <button
                                    type="button"
                                    className="warning-letter-preview__collapse-toggle"
                                    onClick={() => togglePanel("document")}
                                    aria-expanded={expandedPanels.document}
                                >
                                    <div>
                                        <span className="warning-letter-preview__eyebrow">Document</span>
                                        <h3>Warning Letter Details</h3>
                                    </div>
                                    <div className="warning-letter-preview__panel-heading-meta">
                                        <span className="m365-badge m365-badge--primary">PDF Only</span>
                                        <i className={`fa-light ${expandedPanels.document ? "fa-chevron-up" : "fa-chevron-down"}`} />
                                    </div>
                                </button>
                            </div>
                            {expandedPanels.document && (
                                <div className="warning-letter-preview__meta-list">
                                    <div><span>Reference</span><strong>#{letter.id}</strong></div>
                                    <div><span>Type</span><strong>{typeMap[letter.letterType] || "Unknown"}</strong></div>
                                    <div><span>Employee</span><strong>{letter.employeeName}</strong></div>
                                    <div><span>Email</span><strong>{letter.emailRecipient || letter.employeeEmail || "N/A"}</strong></div>
                                    <div><span>Vehicle</span><strong>{letter.vehicleHyoungNo}</strong></div>
                                    <div><span>Site</span><strong>{letter.siteName}</strong></div>
                                    <div><span>Recipient</span><strong>{letter.signatureRequestRecipient || "N/A"}</strong></div>
                                </div>
                            )}
                        </div>

                        <div className="warning-letter-page__panel warning-letter-preview__workflow-card warning-letter-preview__signed-copy">
                            <div className="warning-letter-preview__signed-copy-header">
                                <div className="warning-letter-preview__section-copy">
                                    <button
                                        type="button"
                                        className="warning-letter-preview__collapse-toggle warning-letter-preview__collapse-toggle--section"
                                        onClick={() => togglePanel("approved")}
                                        aria-expanded={expandedPanels.approved}
                                    >
                                        <div>
                                            <h3>Approved Letter</h3>
                                        </div>
                                        <div className="warning-letter-preview__panel-heading-meta">
                                            <span className={`m365-badge ${approvedStatus.cls}`}>{approvedStatus.label}</span>
                                        </div>
                                    </button>
                                    <p>Freeze the issued copy before requesting a signature.</p>
                                </div>
                                <div className="warning-letter-preview__signed-copy-actions">
                                    {canUploadApproveLetter && canUploadWorkflowDocuments && !approvedLetterLocked && !hasApprovedLetter && (
                                        <>
                                            <input
                                                ref={approveLetterInputRef}
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="warning-letter-preview__signed-copy-input"
                                                onChange={handleApproveLetterSelected}
                                                disabled={approveLetterUploading}
                                            />
                                            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => approveLetterInputRef.current?.click()} disabled={approveLetterUploading}>
                                                <i className={`fa-light ${approveLetterUploading ? "fa-spinner-third fa-spin" : "fa-upload"}`} /> {approveLetterUploading ? "Uploading..." : "Upload Approved Letter"}
                                            </button>
                                        </>
                                    )}
                                    {letter.approveLetterUploadedAt && (
                                        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleDownloadApproveLetter} disabled={approveLetterUploading}>
                                            <i className="fa-light fa-download" /> Download Approved Letter
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="warning-letter-preview__section-toggle-button"
                                        onClick={() => togglePanel("approved")}
                                        aria-expanded={expandedPanels.approved}
                                        aria-label={expandedPanels.approved ? "Collapse approved letter section" : "Expand approved letter section"}
                                    >
                                        <i className={`fa-light ${expandedPanels.approved ? "fa-chevron-up" : "fa-chevron-down"}`} />
                                    </button>
                                </div>
                            </div>
                            {expandedPanels.approved && (
                                <>
                                    {approveLetterUploading && (
                                        <div className="warning-letter-preview__signed-copy-uploading">
                                            <i className="fa-light fa-spinner-third fa-spin" /> Uploading approved letter...
                                        </div>
                                    )}
                                    <div className="warning-letter-preview__compact-list">
                                        <div><span>Uploaded</span><strong>{formatDocumentDate(letter.approveLetterUploadedAt, "Pending")}</strong></div>
                                        <div><span>By</span><strong>{approveLetterUploadedByLabel}</strong></div>
                                        <div><span>File</span><strong>{letter.approveLetterFileName || "No approved letter uploaded"}</strong></div>
                                        <div><span>Type</span><strong>{letter.approveLetterContentType || "N/A"}</strong></div>
                                        <div><span>Size</span><strong>{formatDocumentSize(letter.approveLetterFileSize)}</strong></div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="warning-letter-page__panel warning-letter-preview__workflow-card warning-letter-preview__signed-copy">
                            <div className="warning-letter-preview__signed-copy-header">
                                <div className="warning-letter-preview__section-copy">
                                    <button
                                        type="button"
                                        className="warning-letter-preview__collapse-toggle warning-letter-preview__collapse-toggle--section"
                                        onClick={() => togglePanel("signed")}
                                        aria-expanded={expandedPanels.signed}
                                    >
                                        <div>
                                            <h3>Signed Copy</h3>
                                        </div>
                                        <div className="warning-letter-preview__panel-heading-meta">
                                            <span className={`m365-badge ${signedStatus.cls}`}>{signedStatus.label}</span>
                                        </div>
                                    </button>
                                    <p>{workflowLocked ? "Signed copy received. Editing actions are locked." : "Request the signature, then upload the returned signed copy."}</p>
                                </div>
                                <div className="warning-letter-preview__signed-copy-actions">
                                    {canSend && hasApprovedLetter && workflowStage < 3 && (
                                        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleOpenRequestSignature}>
                                            <i className="fa-light fa-signature" /> Request Signature
                                        </button>
                                    )}
                                    {canUploadSignedCopy && canUploadWorkflowDocuments && letter.signatureRequestedAt && workflowStage < 4 && (
                                        <>
                                            <input
                                                ref={signedCopyInputRef}
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="warning-letter-preview__signed-copy-input"
                                                onChange={handleSignedCopySelected}
                                                disabled={signedCopyUploading}
                                            />
                                            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => signedCopyInputRef.current?.click()} disabled={signedCopyUploading}>
                                                <i className={`fa-light ${signedCopyUploading ? "fa-spinner-third fa-spin" : "fa-upload"}`} /> {signedCopyUploading ? "Uploading..." : "Upload Signed Copy"}
                                            </button>
                                        </>
                                    )}
                                    {letter.signedCopyUploadedAt && (
                                        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleDownloadSignedCopy} disabled={signedCopyUploading}>
                                            <i className="fa-light fa-download" /> Download Signed Copy
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="warning-letter-preview__section-toggle-button"
                                        onClick={() => togglePanel("signed")}
                                        aria-expanded={expandedPanels.signed}
                                        aria-label={expandedPanels.signed ? "Collapse signed copy section" : "Expand signed copy section"}
                                    >
                                        <i className={`fa-light ${expandedPanels.signed ? "fa-chevron-up" : "fa-chevron-down"}`} />
                                    </button>
                                </div>
                            </div>
                            {expandedPanels.signed && (
                                <>
                                    {signedCopyUploading && (
                                        <div className="warning-letter-preview__signed-copy-uploading">
                                            <i className="fa-light fa-spinner-third fa-spin" /> Uploading signed document...
                                        </div>
                                    )}
                                    <div className="warning-letter-preview__compact-list">
                                        <div><span>Recipient</span><strong>{letter.signatureRequestRecipient || "N/A"}</strong></div>
                                        <div><span>CC</span><strong>{ccRecipientsLabel}</strong></div>
                                        <div><span>Requested</span><strong>{formatDocumentDate(letter.signatureRequestedAt, "N/A")}</strong></div>
                                        <div><span>Uploaded</span><strong>{formatDocumentDate(letter.signedCopyUploadedAt, "Pending")}</strong></div>
                                        <div><span>By</span><strong>{signedCopyUploadedByLabel}</strong></div>
                                        <div><span>File</span><strong>{letter.signedCopyFileName || "No signed copy uploaded"}</strong></div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="warning-letter-preview__main">
                        <div className="warning-letter-page__panel warning-letter-preview__preview-shell">
                            <div className="warning-letter-preview__preview-header">
                                <div className="warning-letter-preview__preview-title">
                                    <span className="warning-letter-preview__eyebrow">Preview</span>
                                    <h3>Issued PDF</h3>
                                </div>
                                <div className="warning-letter-preview__preview-actions">
                                    <div className="warning-letter-preview__header-group warning-letter-preview__header-group--workflow">
                                        {canSend && letter.status !== 0 && (
                                            <button type="button" className="m365-btn m365-btn--primary" onClick={handleSendEmail}>
                                                <i className="fa-light fa-envelope" /> Email Employee
                                            </button>
                                        )}
                                        {canUpdate && workflowStage === 3 && (
                                            <button type="button" className="m365-btn m365-btn--success" onClick={handleAcknowledge}>
                                                <i className="fa-light fa-badge-check" /> Acknowledge
                                            </button>
                                        )}
                                    </div>
                                    <div className="warning-letter-preview__document-toolbar-actions">
                                        {canViewPdf && (
                                            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => loadPdfPreview(true)} disabled={previewLoading || loading || workflowLocked} title={workflowLocked ? "Signed copy already uploaded. Regeneration disabled to preserve the issued document." : undefined}>
                                                <i className="fa-light fa-rotate-right" /> Regenerate PDF
                                            </button>
                                        )}
                                        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleDownload} disabled={!pdfUrl || !canViewPdf}>
                                            <i className="fa-light fa-download" /> Download
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="warning-letter-preview__frame-wrap">
                                {(loading || previewLoading) && <div className="warning-letter-preview__loading">Loading preview...</div>}
                                {!loading && !previewLoading && pdfUrl && (
                                    <iframe title={`Warning letter ${id}`} className="warning-letter-preview__frame" src={pdfUrl} />
                                )}
                                {!loading && !previewLoading && !pdfUrl && !canViewPdf && (
                                    <div className="warning-letter-preview__loading">PDF preview is unavailable because you do not have permission to generate warning letter PDFs.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <SlidePanel
                open={helpPanelOpen}
                onClose={() => setHelpPanelOpen(false)}
                title="Document Procedure"
                width={440}
                panelClassName="warning-letter-preview__help-panel"
            >
                <div className="warning-letter-preview__help-panel-body">
                    <div className="warning-letter-preview__help-panel-intro">
                        <i className="fa-light fa-circle-info" />
                        <span>Use this checklist on the preview page to keep the issued document consistent through approval, signature, and acknowledgement.</span>
                    </div>

                    <div className="warning-letter-preview__help-section">
                        <h3>Procedure</h3>
                        <ol className="warning-letter-preview__help-list">
                            <li>Review the PDF preview on the right and confirm the employee, vehicle, site, and violation details are correct.</li>
                            <li>If you changed document content, use Regenerate PDF before uploading any workflow documents.</li>
                            <li>Upload the approved letter once management confirms the final version. After signature is requested, the approved copy should not be changed.</li>
                            <li>Send Request Signature to the site representative only after the approved letter is in place.</li>
                            <li>When the signed document comes back, upload the signed copy to lock the issued workflow record.</li>
                            <li>Use Acknowledge only after the signed copy is complete and the employee response has been captured.</li>
                        </ol>
                    </div>

                    <div className="warning-letter-preview__help-section">
                        <h3>Important Notes</h3>
                        <ul className="warning-letter-preview__help-list warning-letter-preview__help-list--unordered">
                            <li>Regenerating the PDF after a signed copy exists is disabled to preserve the issued document.</li>
                            <li>The Approved Letter and Signed Copy sections on the left show the current workflow status for quick checking.</li>
                            <li>If anything is wrong in the PDF, go back to Edit before continuing with approval or signature steps.</li>
                        </ul>
                    </div>
                </div>
            </SlidePanel>

            <SlidePanel
                open={signaturePopupOpen}
                onClose={() => !signatureSubmitting && setSignaturePopupOpen(false)}
                title="Request Signature"
                width={520}
                panelClassName="warning-letter-preview__signature-panel"
            >
                <div className="warning-letter-preview__signature-picker">
                    <div className="warning-letter-preview__signature-picker-header">
                        <div>
                            <div className="warning-letter-preview__signature-picker-titlebar">
                                <h3>Select Site Representative</h3>
                            </div>
                            <p>The selected representative will receive both email and in-app notification. Recipients are managed in Notification Recipient Management using dedicated warning letter groups.</p>
                            <p className="warning-letter-preview__signature-group-summary">
                                Site Representative Group <strong>{signatureRecipientOptions.siteRepresentativeGroupName}</strong><br />
                                Signature CC Group <strong>{signatureRecipientOptions.signatureCcGroupName}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="warning-letter-preview__signature-picker-field">
                        <div className="warning-letter-preview__signature-picker-label-row">
                            <span>
                                Site Representative
                                <strong className="warning-letter-preview__signature-picker-count">{signatureRecipients.length}</strong>
                            </span>
                            {canEditSignatureRecipients && (
                                <button
                                    type="button"
                                    className="m365-icon-btn"
                                    title="Edit site representative group"
                                    aria-label="Edit site representative group"
                                    onClick={() => openRecipientGroupPanel(signatureRecipientOptions.siteRepresentativeGroupName)}
                                    disabled={!letter?.siteId || signatureSubmitting}
                                >
                                    <i className="fa-light fa-pen-to-square" />
                                </button>
                            )}
                        </div>
                        <small>
                            This list only shows members of <strong>{signatureRecipientOptions.siteRepresentativeGroupName}</strong>.
                            Adding a user to Signature CC does not add them here.
                        </small>
                        {showSignatureGroupWarning && (
                            <div className="warning-letter-preview__signature-picker-warning">
                                <i className="fa-light fa-triangle-exclamation" />
                                <span>
                                    Site Representatives is empty, but Signature CC already has {signatureCcRecipients.length} member{signatureCcRecipients.length !== 1 ? "s" : ""}. Add at least one user to the Site Representatives group before sending a signature request.
                                </span>
                            </div>
                        )}
                        <SelectBox
                            dataSource={signatureRecipients}
                            value={selectedSignatureRecipientId}
                            onValueChanged={(event) => setSelectedSignatureRecipientId(event.value || null)}
                            valueExpr="id"
                            displayExpr={(item) => item ? `${item.userName || "Unknown"}${item.email ? ` (${item.email})` : ""}` : ""}
                            searchEnabled={true}
                            searchExpr={["userName", "email"]}
                            placeholder={signatureRecipientsLoading ? "Loading site representatives..." : "Search and select a site representative"}
                            showClearButton={true}
                            disabled={signatureRecipientsLoading || signatureSubmitting}
                            noDataText={`No recipients configured in ${signatureRecipientOptions.siteRepresentativeGroupName}`}
                            stylingMode="outlined"
                        />
                    </div>

                    <div className="warning-letter-preview__signature-picker-field">
                        <div className="warning-letter-preview__signature-picker-label-row">
                            <span>
                                CC Recipients
                                <strong className="warning-letter-preview__signature-picker-count">{signatureCcRecipients.length}</strong>
                            </span>
                            {canEditSignatureRecipients && (
                                <button
                                    type="button"
                                    className="m365-icon-btn"
                                    title="Edit signature CC group"
                                    aria-label="Edit signature CC group"
                                    onClick={() => openRecipientGroupPanel(signatureRecipientOptions.signatureCcGroupName)}
                                    disabled={!letter?.siteId || signatureSubmitting}
                                >
                                    <i className="fa-light fa-pen-to-square" />
                                </button>
                            )}
                        </div>
                        <small>
                            This list shows members of <strong>{signatureRecipientOptions.signatureCcGroupName}</strong> only.
                        </small>
                        <TagBox
                            dataSource={availableSignatureCcRecipients}
                            value={selectedCcRecipientIds}
                            onValueChanged={(event) => setSelectedCcRecipientIds(Array.isArray(event.value) ? event.value : [])}
                            valueExpr="id"
                            displayExpr={(item) => item ? `${item.userName || "Unknown"}${item.email ? ` (${item.email})` : ""}` : ""}
                            searchEnabled={true}
                            searchExpr={["userName", "email"]}
                            placeholder={signatureRecipientsLoading ? "Loading additional recipients..." : "Optional CC recipients at this site"}
                            showClearButton={true}
                            noDataText={`No recipients configured in ${signatureRecipientOptions.signatureCcGroupName}`}
                            disabled={signatureRecipientsLoading || signatureSubmitting}
                            stylingMode="outlined"
                        />
                    </div>

                    <div className="warning-letter-preview__signature-picker-actions">
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => setSignaturePopupOpen(false)} disabled={signatureSubmitting}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="m365-btn m365-btn--primary"
                            onClick={handleRequestSignature}
                            disabled={signatureRecipientsLoading || signatureSubmitting || !selectedSignatureRecipient}
                        >
                            <i className="fa-light fa-paper-plane-top" /> {signatureSubmitting ? "Sending..." : "Send Request"}
                        </button>
                    </div>
                </div>
            </SlidePanel>

            <SlidePanel
                open={recipientGroupPanelOpen}
                onClose={handleCloseRecipientGroupPanel}
                title={recipientGroupTarget ? `Members - ${recipientGroupTarget.displayName}` : "Group Members"}
                width={720}
                panelClassName="warning-letter-preview__recipient-group-panel"
            >
                <div className="warning-letter-preview__recipient-group-editor">
                    <div className="warning-letter-preview__recipient-group-info">
                        <i className="fa-light fa-circle-info" />
                        <span>Use the user picker below to add members directly to this warning-letter recipient group.</span>
                    </div>

                    <div className="warning-letter-preview__recipient-group-bar">
                        <div className="warning-letter-preview__recipient-group-field">
                            <label className="warning-letter-preview__recipient-group-label">User</label>
                            <SelectBox
                                dataSource={recipientGroupUserOptions}
                                valueExpr="id"
                                displayExpr={(item) => {
                                    if (!item) return "";
                                    const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim();
                                    const resolvedName = fullName || item.userName || item.email || item.id;
                                    return `${resolvedName}${item.email ? ` (${item.email})` : ""}`;
                                }}
                                value={recipientGroupAddMemberId}
                                onValueChanged={(event) => setRecipientGroupAddMemberId(event.value || "")}
                                placeholder="Search and select a user"
                                width="100%"
                                searchEnabled={true}
                                searchExpr={["firstName", "lastName", "userName", "email", "role"]}
                                showClearButton={true}
                                disabled={recipientGroupLoading || !recipientGroupTarget}
                            />
                        </div>
                        <div className="warning-letter-preview__recipient-group-action">
                            <button
                                type="button"
                                className="m365-btn m365-btn--primary"
                                onClick={handleAddRecipientGroupMember}
                                disabled={recipientGroupLoading || !recipientGroupTarget}
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="warning-letter-preview__recipient-group-grid">
                        <DataGrid
                            dataSource={recipientGroupMembers}
                            height={400}
                            width="auto"
                            showBorders={false}
                            loadPanel={{ enabled: recipientGroupLoading }}
                            rowAlternationEnabled={true}
                            columnAutoWidth={true}
                            hoverStateEnabled={true}
                            noDataText={recipientGroupLoading ? "Loading members..." : "No members configured"}
                        >
                            <Column
                                caption=""
                                width={60}
                                alignment="center"
                                fixed={true}
                                fixedPosition="left"
                                cellRender={({ data }) => (
                                    <button
                                        type="button"
                                        className="m365-icon-btn m365-icon-btn--danger"
                                        title="Remove"
                                        onClick={() => handleRemoveRecipientGroupMember(data)}
                                        disabled={recipientGroupLoading}
                                    >
                                        <i className="fa-light fa-trash" />
                                    </button>
                                )}
                            />
                            <Column dataField="name" caption="Name / Identifier" />
                            <Column dataField="email" caption="Email" width={220} />
                            <Column dataField="memberId" caption="User Id" width={220} visible={false} />
                        </DataGrid>
                    </div>
                </div>
            </SlidePanel>

        </div>
    );
};

export default WarningLetterPreviewPage;