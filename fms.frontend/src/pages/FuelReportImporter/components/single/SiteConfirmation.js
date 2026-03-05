import React from "react";
import SlidePanel from "../../../../components/ui/SlidePanel";
import { Form } from "react-bootstrap";

const SiteConfirmation = ({
  isVisible,
  onHide,
  detectedSite,
  selectedSite,
  sites,
  onConfirm,
  onSiteChange,
  setSiteSelectionMode,
}) => {
  // Find the selected site object based on the selectedSite id
  const selectedSiteObj = sites.find(
    (site) => site.id.toString() === selectedSite.toString()
  );

  return (
    <SlidePanel
      open={isVisible}
      onClose={onHide}
      title="Confirm Site Selection"
      width={550}
    >
      <div
        className="tw-p-6 tw-flex tw-flex-col tw-h-full"
        style={{ fontFamily: '"Segoe UI", -apple-system, system-ui, sans-serif' }}
      >
        <div className="tw-flex-1">
          <p className="tw-mb-4 tw-font-medium tw-text-sm" style={{ color: "#323130" }}>
            <i className="fa-light fa-circle-info tw-mr-2" style={{ color: "#0078d4" }}></i>
            Based on the uploaded file, the system has automatically detected a
            site. Please confirm or select a different site if needed.
          </p>

          {detectedSite && (
            <div
              className="tw-mb-5 tw-p-4 tw-rounded-lg"
              style={{ background: "#deecf9", border: "1px solid #b4d6fa" }}
            >
              <h5 className="tw-font-medium tw-text-sm tw-mb-2" style={{ color: "#004578" }}>
                <i className="fa-light fa-file-lines tw-mr-2"></i>
                Detected from filename:
              </h5>
              <p className="tw-text-xs tw-font-mono tw-mb-1" style={{ color: "#323130" }}>
                {detectedSite.originalFileName}
              </p>

              <div className="tw-flex tw-flex-col tw-gap-1 tw-mt-3">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-text-xs tw-w-28" style={{ color: "#605e5c" }}>Extracted:</span>
                  <span className="tw-text-xs tw-font-medium" style={{ color: "#201f1e" }}>{detectedSite.extractedName}</span>
                </div>
                {detectedSite.mappedName && (
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <span className="tw-text-xs tw-w-28" style={{ color: "#605e5c" }}>Mapped to:</span>
                    <span className="tw-text-xs tw-font-medium" style={{ color: "#107c10" }}>
                      <i className="fa-light fa-arrow-right tw-mr-1"></i>
                      {detectedSite.mappedName}
                    </span>
                  </div>
                )}
                <div className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-text-xs tw-w-28" style={{ color: "#605e5c" }}>Selected site:</span>
                  <span className="tw-text-xs tw-font-medium" style={{ color: "#0078d4" }}>
                    {selectedSiteObj ? selectedSiteObj.name : "None"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Form.Group className="tw-mb-4">
            <Form.Label className="tw-font-medium tw-block tw-mb-2 tw-text-sm" style={{ color: "#323130" }}>
              <i className="fa-light fa-building tw-mr-2"></i>Site
            </Form.Label>
            <Form.Control
              as="select"
              value={selectedSite}
              onChange={(e) => onSiteChange(e.target.value)}
              required
              className="tw-w-full"
              style={{
                height: 36,
                border: "1px solid #8a8886",
                borderRadius: 4,
                fontSize: 14,
                padding: "0 12px",
              }}
            >
              <option value="">Select Site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <div
            className="tw-text-sm tw-mb-6 tw-p-3 tw-rounded-lg"
            style={{ background: "#faf9f8", border: "1px solid #edebe9" }}
          >
            <p style={{ color: "#323130" }}>
              <i className="fa-light fa-info-circle tw-mr-2" style={{ color: "#0078d4" }}></i>
              <span className="tw-font-medium">File naming tip:</span> To ensure
              correct site detection, name your files in the format:
            </p>
            <p className="tw-font-mono tw-text-xs tw-mt-2 tw-ml-6" style={{ color: "#605e5c" }}>
              SITE_NAME Fuel Report MONTH YEAR.xlsx
            </p>
            <p className="tw-mt-2 tw-text-xs" style={{ color: "#605e5c" }}>
              Special mappings:
              <ul className="tw-mt-1 tw-list-disc tw-list-inside">
                <li>"FOOTBRIDGE" → "BRIDGE" site</li>
                <li>"IP" → "Industrial Plot" site</li>
              </ul>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="tw-flex tw-justify-between tw-items-center tw-gap-3 tw-pt-4"
          style={{ borderTop: "1px solid #edebe9" }}
        >
          <button
            className="tw-bg-transparent tw-border-0 tw-text-sm tw-font-medium tw-cursor-pointer tw-px-0"
            style={{ color: "#0078d4" }}
            onClick={() => { setSiteSelectionMode("manual"); onHide(); }}
          >
            Switch to Manual Selection
          </button>
          <div className="tw-flex tw-gap-2">
            <button
              className="tw-rounded tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-cursor-pointer tw-border"
              style={{ background: "#fff", borderColor: "#8a8886", color: "#323130" }}
              onClick={onHide}
            >
              Cancel
            </button>
            <button
              className="tw-rounded tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-cursor-pointer tw-border-0"
              style={{
                background: selectedSite ? "#0078d4" : "#c8c6c4",
                color: "#fff",
                cursor: selectedSite ? "pointer" : "not-allowed",
              }}
              onClick={onConfirm}
              disabled={!selectedSite}
            >
              Confirm Site
            </button>
          </div>
        </div>
      </div>
    </SlidePanel>
  );
};

export default SiteConfirmation;
