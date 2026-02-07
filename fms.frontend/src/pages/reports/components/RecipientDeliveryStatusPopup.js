/**
 * File: RecipientDeliveryStatusPopup.js
 * Purpose: Popup showing per-recipient delivery status for a scheduled email.
 * Dependencies: react, devextreme-react/popup, devextreme-react/data-grid
 * Last Modified: 2026-02-07
 *
 * Key Components:
 * - RecipientDeliveryStatusPopup: Displays recipient delivery timeline and errors.
 */
import React from "react";
import DataGrid, { Column } from "devextreme-react/data-grid";
import { Popup } from "devextreme-react/popup";

const RecipientDeliveryStatusPopup = ({
  schedule,
  onHiding,
  formatLocalDateTime,
}) => {
  const recipients = Array.isArray(schedule?.recipients) ? schedule.recipients : [];

  return (
    <Popup
      visible={!!schedule}
      onHiding={onHiding}
      title="Recipient Delivery Status"
      width={760}
      height={520}
      showCloseButton={true}
    >
      <div className="tw-p-4 tw-h-full tw-flex tw-flex-col">
        <div className="tw-mb-3 tw-text-sm tw-text-gray-700">
          <strong>{schedule?.title || "Scheduled Report"}</strong>
        </div>

        <div className="tw-flex-1">
          <DataGrid
            dataSource={recipients}
            keyExpr="userId"
            showBorders={true}
            showRowLines={true}
            columnAutoWidth={true}
          >
            <Column dataField="userName" caption="User" />
            <Column dataField="recipientAddress" caption="Email" />
            <Column dataField="deliveryMethod" caption="Method" width={110} />
            <Column dataField="deliveryStatus" caption="Status" width={120} />
            <Column
              dataField="sentAt"
              caption="Sent At"
              width={180}
              customizeText={(e) => formatLocalDateTime(e.value)}
            />
            <Column
              dataField="deliveredAt"
              caption="Delivered At"
              width={180}
              customizeText={(e) => formatLocalDateTime(e.value)}
            />
            <Column dataField="deliveryError" caption="Error" minWidth={180} />
          </DataGrid>
        </div>
      </div>
    </Popup>
  );
};

export default RecipientDeliveryStatusPopup;
