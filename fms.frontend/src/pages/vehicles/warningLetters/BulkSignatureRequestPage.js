/**
 * File:          BulkSignatureRequestPage.js
 * Purpose:       3-step wizard for bulk requesting signatures on multiple warning letters at the same site.
 * Dependencies:  React, DevExtreme DataGrid/SelectBox/TagBox, react-router-dom, warningLetterService, usePermissions
 * Last Modified: 2026-06-09
 *
 * Key Functions:
 * - Step 1: Select warning letters eligible for signature (Finalized + Approved + approve letter uploaded)
 * - Step 2: Choose signature recipient and CC recipients from site groups
 * - Step 3: Review and submit bulk request
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataGrid, {
    Column,
    Selection,
    SearchPanel,
    Paging,
    Sorting,
    LoadPanel,
} from "devextreme-react/data-grid";
import SelectBox from "devextreme-react/select-box";
import TagBox from "devextreme-react/tag-box";
import notify from "devextreme/ui/notify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import SlidePanel from "../../../components/ui/SlidePanel";
import notificationGroupsApi from "../../../dataservice/notificationGroupsApi";
import notificationsApi from "../../../dataservice/notificationsApi";
import {
    bulkRequestSignature,
    fetchSiteSignatureRecipients,
    getWarningLetters,
} from "./warningLetterService";
import "./WarningLetters.scss";

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

const workflowStageMap = {
    0: "Draft",
    1: "Approved",
    2: "Pending Signed",
    3: "Signed",
    4: "Acknowledged",
};

const typeMap = {
    1: "Excess Fuel",
    2: "Excess Speed",
    3: "Excess Idling",
};

const STEPS = [
    { key: 0, label: "Select Letters", icon: "fa-light fa-list-check" },
    { key: 1, label: "Choose Recipient", icon: "fa-light fa-user-pen" },
    { key: 2, label: "Review & Send", icon: "fa-light fa-paper-plane" },
];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const BulkSignatureRequestPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedSiteId = searchParams.get("siteId") || "";
    const { hasPermission } = usePermissions();
    const canManageRecipientGroups = hasPermission("_Manage_NotificationGroups");
    const canEditSignatureRecipients = canManageRecipientGroups;

    const [step, setStep] = useState(0);
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLetterIds, setSelectedLetterIds] = useState([]);

    const [recipientOptions, setRecipientOptions] = useState({
        siteRepresentativeGroupName: "Warning Letter Site Representatives",
        signatureCcGroupName: "Warning Letter Signature CC",
        siteRepresentatives: [],
        signatureCcRecipients: [],
    });
    const [recipientsLoading, setRecipientsLoading] = useState(false);
    const [selectedRecipientId, setSelectedRecipientId] = useState(null);
    const [manualEmail, setManualEmail] = useState("");
    const [selectedCcIds, setSelectedCcIds] = useState([]);

    const [submitting, setSubmitting] = useState(false);

    const [recipientGroupPanelOpen, setRecipientGroupPanelOpen] = useState(false);
    const [recipientGroupLoading, setRecipientGroupLoading] = useState(false);
    const [recipientGroupTarget, setRecipientGroupTarget] = useState(null);
    const [recipientGroupMembers, setRecipientGroupMembers] = useState([]);
    const [recipientGroupUserOptions, setRecipientGroupUserOptions] = useState([]);
    const [recipientGroupAddMemberId, setRecipientGroupAddMemberId] = useState("");

    const signatureRecipients = useMemo(
        () => Array.isArray(recipientOptions.siteRepresentatives) ? recipientOptions.siteRepresentatives : [],
        [recipientOptions.siteRepresentatives]
    );

    const ccRecipients = useMemo(
        () => {
            const all = Array.isArray(recipientOptions.signatureCcRecipients) ? recipientOptions.signatureCcRecipients : [];
            return all.filter((r) => r.id !== selectedRecipientId);
        },
        [recipientOptions.signatureCcRecipients, selectedRecipientId]
    );

    const selectedRecipient = useMemo(
        () => signatureRecipients.find((r) => r.id === selectedRecipientId) || null,
        [signatureRecipients, selectedRecipientId]
    );

    const selectedLetters = useMemo(
        () => letters.filter((l) => selectedLetterIds.includes(l.id)),
        [letters, selectedLetterIds]
    );

    const selectedSiteName = useMemo(() => {
        const resolvedSiteName = selectedLetters[0]?.siteName || letters[0]?.siteName || "";
        return resolvedSiteName || `Site ${preselectedSiteId}`;
    }, [letters, preselectedSiteId, selectedLetters]);

    const selectedRecipientValue = selectedRecipientId || manualEmail || null;

    const effectiveEmail = (manualEmail || selectedRecipient?.email || "").trim();

    const canProceedToStep2 = selectedLetterIds.length > 0;
    const canProceedToStep3 = Boolean(selectedRecipient || isValidEmail(effectiveEmail));
    const canSubmit = canProceedToStep3 && selectedLetterIds.length > 0 && !submitting;

    const renderLetterType = useCallback(({ value }) => typeMap[value] || value || "-", []);

    const renderWorkflowStage = useCallback(({ value }) => workflowStageMap[value] || value || "-", []);

    const loadEligibleLetters = useCallback(async () => {
        if (!preselectedSiteId) return;
        try {
            setLoading(true);
            const data = await getWarningLetters({ siteId: preselectedSiteId });
            const eligible = (Array.isArray(data) ? data : []).filter((letter) => {
                const status = Number(letter.status);
                const stage = Number(letter.workflowStage);
                const hasApproveLetter = Boolean(letter.approveLetterUploadedAt);
                return status === 1 && stage === 1 && hasApproveLetter;
            });
            setLetters(eligible);
        } catch (error) {
            setLetters([]);
            notify(error.message || "Failed to load eligible letters.", "error", 3000);
        } finally {
            setLoading(false);
        }
    }, [preselectedSiteId]);

    const loadRecipients = useCallback(async () => {
        if (!preselectedSiteId) return;
        try {
            setRecipientsLoading(true);
            const options = await fetchSiteSignatureRecipients(preselectedSiteId);
            setRecipientOptions(options);
        } catch (error) {
            notify(error.message || "Failed to load signature recipients.", "error", 3000);
        } finally {
            setRecipientsLoading(false);
        }
    }, [preselectedSiteId]);

    useEffect(() => {
        loadEligibleLetters();
    }, [loadEligibleLetters]);

    const handleSelectionChanged = useCallback((e) => {
        const ids = (e.selectedRowsData || []).map((row) => row.id);
        setSelectedLetterIds(ids);
    }, []);

    const handleNext = () => {
        if (step === 0 && !canProceedToStep2) {
            notify("Select at least one letter.", "warning", 2500);
            return;
        }
        if (step === 1 && !canProceedToStep3) {
            notify("Select a recipient or type a valid external email in the Site Representative field.", "warning", 2500);
            return;
        }
        if (step === 0) {
            loadRecipients();
        }
        setStep((prev) => Math.min(prev + 1, 2));
    };

    const handleBack = () => {
        setStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        try {
            setSubmitting(true);
            const result = await bulkRequestSignature({
                warningLetterIds: selectedLetterIds,
                signatureRecipientUserId: selectedRecipient?.id || null,
                emailRecipient: effectiveEmail,
                ccRecipientUserIds: selectedCcIds,
            });

            const successCount = result?.successCount ?? 0;
            const failedCount = result?.failedCount ?? 0;

            if (failedCount === 0) {
                notify(`All ${successCount} signature requests sent successfully.`, "success", 3000);
            } else {
                notify(`${successCount} sent, ${failedCount} failed. Check individual letters for details.`, "warning", 4000);
            }

            navigate("/reports/warning-letters");
        } catch (error) {
            notify(error.message || "Failed to send bulk signature request.", "error", 3000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecipientChanged = (e) => {
        const nextValue = e.value;
        const match = signatureRecipients.find((r) => r.id === nextValue);

        if (match) {
            setSelectedRecipientId(match.id);
            setManualEmail(match.email || "");
            setSelectedCcIds((prev) => prev.filter((id) => id !== match.id));
            return;
        }

        if (typeof nextValue === "string") {
            const trimmedValue = nextValue.trim();
            setSelectedRecipientId(null);
            setManualEmail(trimmedValue);
            return;
        }

        setSelectedRecipientId(null);
        setManualEmail("");
    };

    const handleRecipientCustomItemCreating = (e) => {
        const typedEmail = (e.text || "").trim();

        if (!typedEmail) {
            e.customItem = null;
            return;
        }

        if (!isValidEmail(typedEmail)) {
            notify("Enter a valid email address for an external recipient.", "warning", 2500);
            e.customItem = null;
            return;
        }

        e.customItem = typedEmail;
    };

    const loadRecipientGroupUsers = useCallback(async () => {
        if (recipientGroupUserOptions.length > 0) {
            return recipientGroupUserOptions;
        }
        if (!preselectedSiteId) {
            return [];
        }
        const response = await notificationsApi.getRecipientCandidates({
            siteId: Number(preselectedSiteId),
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
    }, [preselectedSiteId, recipientGroupUserOptions]);

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
                    return { ...member, name: resolvedName, email: matchedUser.email, role: matchedUser.role };
                }
            }
            return { ...member, name: member.name || member.memberId, email: member.email || "", role: member.role || "" };
        });
    }, []);

    const openRecipientGroupPanel = useCallback(async (groupName) => {
        if (!canEditSignatureRecipients) {
            notify("You do not have permission to manage warning-letter recipient groups.", "warning", 2500);
            return;
        }
        if (!preselectedSiteId || !groupName) {
            notify("Site context is missing.", "warning", 2500);
            return;
        }
        try {
            setRecipientGroupLoading(true);
            setRecipientGroupPanelOpen(true);
            setRecipientGroupAddMemberId("");

            const [usersSource, groupsResponse] = await Promise.all([
                loadRecipientGroupUsers(),
                notificationGroupsApi.getGroups(Number(preselectedSiteId)),
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
    }, [canEditSignatureRecipients, preselectedSiteId, loadRecipientGroupMembers, loadRecipientGroupUsers]);

    const handleCloseRecipientGroupPanel = () => {
        if (recipientGroupLoading) return;
        setRecipientGroupPanelOpen(false);
        setRecipientGroupTarget(null);
        setRecipientGroupMembers([]);
        setRecipientGroupAddMemberId("");
    };

    const handleAddRecipientGroupMember = async () => {
        if (!recipientGroupTarget) return;
        if (!recipientGroupAddMemberId) {
            notify("Select a user first.", "warning", 2500);
            return;
        }
        const alreadyExists = recipientGroupMembers.some(
            (m) => m.memberType === "User" && String(m.memberId) === String(recipientGroupAddMemberId)
        );
        if (alreadyExists) {
            notify("This member is already in the group.", "warning", 2500);
            return;
        }
        try {
            setRecipientGroupLoading(true);
            const result = await notificationGroupsApi.addGroupMembers(recipientGroupTarget.id, [
                { memberType: "User", memberId: recipientGroupAddMemberId },
            ]);
            if (!result.isSuccess) {
                throw new Error(result.message || "Failed to add member.");
            }
            const refreshed = await loadRecipientGroupMembers(recipientGroupTarget, recipientGroupUserOptions);
            setRecipientGroupMembers(refreshed);
            setRecipientGroupAddMemberId("");
            await loadRecipients();
            notify(result.message || "Member added.", "success", 2500);
        } catch (error) {
            notify(error.message || "Failed to add member.", "error", 3000);
        } finally {
            setRecipientGroupLoading(false);
        }
    };

    const handleRemoveRecipientGroupMember = async (member) => {
        if (!recipientGroupTarget || !member?.id) return;
        try {
            setRecipientGroupLoading(true);
            const result = await notificationGroupsApi.removeGroupMember(recipientGroupTarget.id, member.id);
            if (!result.isSuccess) {
                throw new Error(result.message || "Failed to remove member.");
            }
            setRecipientGroupMembers((curr) => curr.filter((m) => m.id !== member.id));
            await loadRecipients();
            notify("Member removed.", "success", 2000);
        } catch (error) {
            notify(error.message || "Failed to remove member.", "error", 3000);
        } finally {
            setRecipientGroupLoading(false);
        }
    };

    const showSignatureGroupWarning = signatureRecipients.length === 0 && ccRecipients.length > 0;

    if (!preselectedSiteId) {
        return (
            <div className="warning-letter-page">
                <div className="m365-page-header">
                    <div className="m365-page-header__left">
                        <i className="fa-light fa-signature m365-page-header__icon" />
                        <h2 className="m365-page-header__title">Bulk Request Signature</h2>
                    </div>
                </div>
                <div className="warning-letter-page__panel">
                    <div className="m365-info-banner m365-info-banner--warning">
                        <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
                        <span className="m365-info-banner__text">
                            Please select a site from the Warning Letters list page first.
                        </span>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate("/reports/warning-letters")}>
                            <i className="fa-light fa-arrow-left" /> Back to Warning Letters
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="warning-letter-page">
            {/* Header */}
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-signature m365-page-header__icon" />
                    <div>
                        <h2 className="m365-page-header__title">Bulk Request Signature</h2>
                        <div style={{ fontSize: 12, color: "#605e5c", marginTop: 4 }}>
                            Site: <strong>{selectedSiteName}</strong>
                        </div>
                    </div>
                </div>
                <div className="m365-page-header__actions">
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate("/reports/warning-letters")}>
                        <i className="fa-light fa-arrow-left" /> Back
                    </button>
                </div>
            </div>

            {/* Stepper */}
            <div className="warning-letter-page__panel">
                <div style={{ marginBottom: 12, fontSize: 13, color: "#605e5c" }}>
                    Selected site: <strong>{selectedSiteName}</strong>
                </div>
                <div className="bulk-signature__stepper">
                    {STEPS.map((s) => (
                        <div
                            key={s.key}
                            className={`bulk-signature__step ${step === s.key ? "bulk-signature__step--active" : ""} ${step > s.key ? "bulk-signature__step--done" : ""}`}
                        >
                            <span className="bulk-signature__step-number">
                                {step > s.key ? <i className="fa-light fa-check" /> : s.key + 1}
                            </span>
                            <span className="bulk-signature__step-label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 1: Select Letters */}
            {step === 0 && (
                <div className="warning-letter-page__panel">
                    <div className="m365-info-banner">
                        <i className="fa-light fa-circle-info m365-info-banner__icon" />
                        <span className="m365-info-banner__text">
                            Showing letters that are Finalized, Approved, and have an uploaded approve letter.
                            Select the letters you want to request signatures for.
                        </span>
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <DataGrid
                            dataSource={letters}
                            keyExpr="id"
                            showBorders={false}
                            showRowLines
                            hoverStateEnabled
                            columnAutoWidth
                            wordWrapEnabled
                            noDataText={loading ? "Loading..." : "No eligible letters found for this site."}
                            onSelectionChanged={handleSelectionChanged}
                            selectedRowKeys={selectedLetterIds}
                        >
                            <Selection mode="multiple" showCheckBoxesMode="always" />
                            <SearchPanel visible placeholder="Search letters..." />
                            <Paging defaultPageSize={20} />
                            <Sorting mode="multiple" />
                            <LoadPanel enabled={loading} />
                            <Column dataField="letterNumber" caption="Letter #" width={120} />
                            <Column dataField="employeeName" caption="Employee" />
                            <Column dataField="letterType" caption="Type" width={120} cellRender={renderLetterType} />
                            <Column dataField="letterDate" caption="Date" dataType="date" width={110} />
                            <Column dataField="workflowStage" caption="Stage" width={130} cellRender={renderWorkflowStage} />
                        </DataGrid>
                    </div>
                    <div className="bulk-signature__footer">
                        <span className="bulk-signature__selection-count">
                            {selectedLetterIds.length} letter{selectedLetterIds.length !== 1 ? "s" : ""} selected
                        </span>
                        <button type="button" className="m365-btn m365-btn--primary" onClick={handleNext} disabled={!canProceedToStep2}>
                            Next <i className="fa-light fa-arrow-right" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Choose Recipient */}
            {step === 1 && (
                <div className="warning-letter-page__panel">
                    <div className="bulk-signature__recipient-section">
                        <h3 className="bulk-signature__section-title">
                            <i className="fa-light fa-user-pen" /> Signature Recipient
                        </h3>
                        <p className="bulk-signature__section-desc">
                            All {selectedLetterIds.length} selected letter{selectedLetterIds.length !== 1 ? "s" : ""} will be sent to the same recipient.
                            Site: <strong>{selectedSiteName}</strong>. Select from the site's warning-letter notification groups, or type an external email directly in the Site Representative field.
                            In-app notification is only sent when a configured site user is selected.
                        </p>
                        <p className="warning-letter-preview__signature-group-summary" style={{ margin: "0 0 12px 0", fontSize: 12, color: "#605e5c" }}>
                            Site Representative Group <strong>{recipientOptions.siteRepresentativeGroupName}</strong><br />
                            Signature CC Group <strong>{recipientOptions.signatureCcGroupName}</strong>
                        </p>

                        {showSignatureGroupWarning && (
                            <div className="m365-info-banner m365-info-banner--warning" style={{ marginBottom: 12 }}>
                                <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
                                <span className="m365-info-banner__text">
                                    Site Representatives is empty, but Signature CC already has {ccRecipients.length} member{ccRecipients.length !== 1 ? "s" : ""}. Add at least one user to the Site Representatives group before sending.
                                </span>
                            </div>
                        )}

                        {signatureRecipients.length === 0 && !recipientsLoading && !showSignatureGroupWarning && (
                            <div className="m365-info-banner m365-info-banner--warning" style={{ marginBottom: 12 }}>
                                <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
                                <span className="m365-info-banner__text">
                                    No site representatives configured. You can enter an email address manually, or edit the group to add users.
                                </span>
                            </div>
                        )}

                        <div className="bulk-signature__form-grid">
                            <label className="warning-letter-page__field">
                                <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                                    <span>
                                        Site Representative
                                        <strong style={{ marginLeft: 6, color: "#605e5c", fontWeight: 500 }}>({signatureRecipients.length})</strong>
                                    </span>
                                    {canEditSignatureRecipients && (
                                        <button
                                            type="button"
                                            className="m365-icon-btn"
                                            title="Edit site representative group"
                                            aria-label="Edit site representative group"
                                            onClick={() => openRecipientGroupPanel(recipientOptions.siteRepresentativeGroupName)}
                                            disabled={recipientsLoading}
                                        >
                                            <i className="fa-light fa-pen-to-square" />
                                        </button>
                                    )}
                                </span>
                                <SelectBox
                                    dataSource={signatureRecipients}
                                    displayExpr={(item) => item ? `${item.userName || "Unknown"}${item.email ? ` (${item.email})` : ""}` : ""}
                                    valueExpr="id"
                                    value={selectedRecipientValue}
                                    onValueChanged={handleRecipientChanged}
                                    acceptCustomValue={true}
                                    onCustomItemCreating={handleRecipientCustomItemCreating}
                                    placeholder={recipientsLoading ? "Loading site representatives..." : "Search and select a site representative"}
                                    searchEnabled
                                    searchExpr={["userName", "email"]}
                                    showClearButton
                                    disabled={recipientsLoading}
                                    noDataText={`No user members configured in ${recipientOptions.siteRepresentativeGroupName}`}
                                    stylingMode="outlined"
                                />
                                <small style={{ color: "#605e5c" }}>
                                    Only direct user members of <strong>{recipientOptions.siteRepresentativeGroupName}</strong> are shown. Role-based members are ignored here. To use an outsider email, type it here and press Enter.
                                </small>
                            </label>

                            <label className="warning-letter-page__field">
                                <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                                    <span>
                                        CC Recipients
                                        <strong style={{ marginLeft: 6, color: "#605e5c", fontWeight: 500 }}>({ccRecipients.length})</strong>
                                    </span>
                                    {canEditSignatureRecipients && (
                                        <button
                                            type="button"
                                            className="m365-icon-btn"
                                            title="Edit signature CC group"
                                            aria-label="Edit signature CC group"
                                            onClick={() => openRecipientGroupPanel(recipientOptions.signatureCcGroupName)}
                                            disabled={recipientsLoading}
                                        >
                                            <i className="fa-light fa-pen-to-square" />
                                        </button>
                                    )}
                                </span>
                                <TagBox
                                    dataSource={ccRecipients}
                                    displayExpr={(item) => item ? `${item.userName || "Unknown"}${item.email ? ` (${item.email})` : ""}` : ""}
                                    valueExpr="id"
                                    value={selectedCcIds}
                                    onValueChanged={(e) => setSelectedCcIds(e.value || [])}
                                    placeholder={recipientsLoading ? "Loading additional recipients..." : "Optional CC recipients at this site"}
                                    searchEnabled
                                    searchExpr={["userName", "email"]}
                                    showClearButton
                                    noDataText={`No recipients configured in ${recipientOptions.signatureCcGroupName}`}
                                    disabled={recipientsLoading}
                                    stylingMode="outlined"
                                />
                                <small style={{ color: "#605e5c" }}>
                                    Only direct user members of <strong>{recipientOptions.signatureCcGroupName}</strong> are shown. Manage the group to add site users.
                                </small>
                            </label>
                        </div>
                    </div>

                    <div className="bulk-signature__footer">
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleBack}>
                            <i className="fa-light fa-arrow-left" /> Back
                        </button>
                        <button type="button" className="m365-btn m365-btn--primary" onClick={handleNext} disabled={!canProceedToStep3}>
                            Next <i className="fa-light fa-arrow-right" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review & Send */}
            {step === 2 && (
                <div className="warning-letter-page__panel">
                    <h3 className="bulk-signature__section-title">
                        <i className="fa-light fa-clipboard-list" /> Review
                    </h3>

                    <div className="warning-letter-page__summary-grid" style={{ marginBottom: 16 }}>
                        <div>
                            <span>Letters</span>
                            <strong>{selectedLetterIds.length}</strong>
                        </div>
                        <div>
                            <span>Recipient</span>
                            <strong>{selectedRecipient?.userName || effectiveEmail || "—"}</strong>
                        </div>
                        <div>
                            <span>Email</span>
                            <strong>{effectiveEmail || "—"}</strong>
                        </div>
                        <div>
                            <span>CC Recipients</span>
                            <strong>{selectedCcIds.length}</strong>
                        </div>
                    </div>

                    <DataGrid
                        dataSource={selectedLetters}
                        keyExpr="id"
                        showBorders={false}
                        showRowLines
                        columnAutoWidth
                        wordWrapEnabled
                        noDataText="No letters selected."
                    >
                        <Paging defaultPageSize={20} />
                        <Column dataField="letterNumber" caption="Letter #" width={120} />
                        <Column dataField="employeeName" caption="Employee" />
                        <Column dataField="letterType" caption="Type" width={120} cellRender={renderLetterType} />
                        <Column dataField="letterDate" caption="Date" dataType="date" width={110} />
                    </DataGrid>

                    <div className="bulk-signature__footer">
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleBack}>
                            <i className="fa-light fa-arrow-left" /> Back
                        </button>
                        <button
                            type="button"
                            className="m365-btn m365-btn--primary"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                        >
                            {submitting ? (
                                <><i className="fa-light fa-spinner fa-spin" /> Sending...</>
                            ) : (
                                <><i className="fa-light fa-paper-plane" /> Send {selectedLetterIds.length} Request{selectedLetterIds.length !== 1 ? "s" : ""}</>
                            )}
                        </button>
                    </div>
                </div>
            )}

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
                        <span>Use the user picker below to add members directly to this warning-letter recipient group. Only users from the selected site are listed.</span>
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
                                searchEnabled
                                searchExpr={["firstName", "lastName", "userName", "email", "role"]}
                                showClearButton
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
                            rowAlternationEnabled
                            columnAutoWidth
                            hoverStateEnabled
                            noDataText={recipientGroupLoading ? "Loading members..." : "No members configured"}
                        >
                            <Column
                                caption=""
                                width={60}
                                alignment="center"
                                fixed
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

export default BulkSignatureRequestPage;
