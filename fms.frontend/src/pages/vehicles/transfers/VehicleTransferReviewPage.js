/**
 * File:          VehicleTransferReviewPage.js
 * Purpose:       Standalone review page for vehicle transfers reached via email approval link.
 *                URL pattern: /vehicles/transfers/:id/review
 *                Fetches transfer by ID and renders VehicleTransferDetails with full workflow actions.
 * Dependencies:  axiosInstance, VehicleTransferDetails, react-router-dom
 * Last Modified: 2026-02-28
 *
 * Key Functions:
 * - loadTransfer(): Fetches single transfer by URL param :id
 * - handleRefresh(): Reloads transfer data after workflow action
 * - Renders VehicleTransferDetails in a full-page layout (not SlidePanel)
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";
import VehicleTransferDetails from "./VehicleTransferDetails";

import "./VehicleTransferReviewPage.scss";

const VehicleTransferReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTransfer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/vehicletransfers/${id}`, {
        params: { _: Date.now() },
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const detailedTransfer = response.data?.data || response.data?.Data || response.data;
      if (response.data?.isSuccess && detailedTransfer) {
        setTransfer(detailedTransfer);
      } else {
        setError(response.data?.message || "Transfer not found");
      }
    } catch (err) {
      const msg =
        err.response?.status === 404
          ? "Transfer not found"
          : err.response?.data?.message || "Failed to load transfer";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTransfer();
  }, [loadTransfer]);

  useEffect(() => {
    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        loadTransfer();
      }
    };

    const handleWindowFocus = () => {
      loadTransfer();
    };

    document.addEventListener("visibilitychange", handleVisibilityRefresh);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadTransfer]);

  const handleRefresh = useCallback(() => {
    loadTransfer();
  }, [loadTransfer]);

  const handleBack = useCallback(() => {
    navigate("/vehicles/transfers");
  }, [navigate]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="transfer-review-page">
        <div className="transfer-review-page__header">
          <button className="m365-btn m365-btn--ghost" onClick={handleBack} type="button">
            <i className="fa-light fa-arrow-left" /> Back to Transfers
          </button>
        </div>
        <div className="transfer-review-page__loading">
          <i className="fa-light fa-spinner-third fa-spin" />
          <span>Loading transfer details…</span>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !transfer) {
    return (
      <div className="transfer-review-page">
        <div className="transfer-review-page__header">
          <button className="m365-btn m365-btn--ghost" onClick={handleBack} type="button">
            <i className="fa-light fa-arrow-left" /> Back to Transfers
          </button>
        </div>
        <div className="transfer-review-page__error">
          <i className="fa-light fa-circle-exclamation" />
          <h3>Unable to load transfer</h3>
          <p>{error || "Transfer data is not available"}</p>
          <button className="m365-btn m365-btn--primary" onClick={loadTransfer}>
            <i className="fa-light fa-rotate-right" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Normal state ──
  return (
    <div className="transfer-review-page">
      <div className="transfer-review-page__header">
        <button className="m365-btn m365-btn--ghost tw-flex tw-items-center tw-gap-2" onClick={handleBack} type="button">
          <i className="fa-light fa-arrow-left" />
          <span>Back to Transfers</span>
        </button>
        <span className="tw-text-gray-300 tw-mx-1">|</span>
        <h2 className="transfer-review-page__title">
          Review Transfer #{transfer.deliveryNoteNumber || transfer.transferId}
        </h2>
        <span className="transfer-review-page__subtitle">
          {transfer.vehicleHyoungNo} — {transfer.fromSiteName} → {transfer.toSiteName}
        </span>
      </div>

      <div className="transfer-review-page__body">
        <VehicleTransferDetails
          transfer={transfer}
          onClose={handleBack}
          onRefresh={handleRefresh}
          isApprovalReview={true}
        />
      </div>
    </div>
  );
};

export default VehicleTransferReviewPage;
