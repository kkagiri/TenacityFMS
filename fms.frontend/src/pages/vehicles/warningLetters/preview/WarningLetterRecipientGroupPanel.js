/**
 * File: WarningLetterRecipientGroupPanel.js
 * Purpose: Manages direct user membership for warning letter notification groups.
 * Dependencies: React, devextreme-react/data-grid, devextreme-react/select-box, SlidePanel
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - WarningLetterRecipientGroupPanel(): Displays group members and add/remove actions.
 */
import React from "react";
import DataGrid, { Column } from "devextreme-react/data-grid";
import SelectBox from "devextreme-react/select-box";
import SlidePanel from "../../../../components/ui/SlidePanel";

const WarningLetterRecipientGroupPanel = ({
    open,
    onClose,
    target,
    loading,
    userOptions,
    addMemberId,
    onAddMemberIdChange,
    onAddMember,
    members,
    onRemoveMember,
}) => (
    <SlidePanel
        open={open}
        onClose={onClose}
        title={target ? `Members - ${target.displayName}` : "Group Members"}
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
                        dataSource={userOptions}
                        valueExpr="id"
                        displayExpr={(item) => {
                            if (!item) return "";
                            const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim();
                            const resolvedName = fullName || item.userName || item.email || item.id;
                            return `${resolvedName}${item.email ? ` (${item.email})` : ""}`;
                        }}
                        value={addMemberId}
                        onValueChanged={(event) => onAddMemberIdChange(event.value || "")}
                        placeholder="Search and select a user"
                        width="100%"
                        searchEnabled={true}
                        searchExpr={["firstName", "lastName", "userName", "email", "role"]}
                        showClearButton={true}
                        disabled={loading || !target}
                    />
                </div>
                <div className="warning-letter-preview__recipient-group-action">
                    <button
                        type="button"
                        className="m365-btn m365-btn--primary"
                        onClick={onAddMember}
                        disabled={loading || !target}
                    >
                        Add
                    </button>
                </div>
            </div>

            <div className="warning-letter-preview__recipient-group-grid">
                <DataGrid
                    dataSource={members}
                    height={400}
                    width="auto"
                    showBorders={false}
                    loadPanel={{ enabled: loading }}
                    rowAlternationEnabled={true}
                    columnAutoWidth={true}
                    hoverStateEnabled={true}
                    noDataText={loading ? "Loading members..." : "No members configured"}
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
                                onClick={() => onRemoveMember(data)}
                                disabled={loading}
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
);

export default WarningLetterRecipientGroupPanel;
