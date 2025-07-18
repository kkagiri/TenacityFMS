import React from "react";
import { Popup } from "devextreme-react/popup";
import Button from "devextreme-react/button"; //Cursor
import { Form } from "react-bootstrap";

const SiteConfirmation = ({
  isVisible,
  onHide,
  detectedSite,
  selectedSite,
  sites,
  onConfirm,
  onSiteChange,
  setSiteSelectionMode //Cursor
}) => {
  // Find the selected site object based on the selectedSite id
  const selectedSiteObj = sites.find(site => site.id.toString() === selectedSite.toString());

  return (
    <Popup
      visible={isVisible}
      onHiding={onHide}
      dragEnabled={false}
      showCloseButton
={true}
      showTitle={true}
      title="Confirm Site Selection"
      width={600}
      height="auto"
      className="tw-p-4"
    >
      <div className="tw-p-4">
        <p className="tw-mb-4 tw-font-medium">
          <i className="fa-light fa-circle-info tw-mr-2 tw-text-blue-500"></i>
          Based on the uploaded file, the system has automatically detected a site.
          Please confirm or select a different site if needed.
        </p>

        {detectedSite && (
          <div className="tw-mb-5 tw-bg-blue-50 tw-p-3 tw-rounded-md tw-border tw-border-blue-200">
            <h5 className="tw-text-blue-800 tw-font-medium tw-text-sm tw-mb-2">
              <i className="fa-light fa-file-lines tw-mr-2"></i>
              Detected from filename:
            </h5>
            <p className="tw-text-xs tw-font-mono tw-mb-1 tw-text-gray-700">
              {detectedSite.originalFileName}
            </p>

            <div className="tw-flex tw-flex-col tw-gap-1 tw-mt-3">
              <div className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-text-xs tw-text-gray-500 tw-w-28">Extracted:</span>
                <span className="tw-text-xs tw-font-medium">{detectedSite.extractedName}</span>
              </div>

              {detectedSite.mappedName && (
                <div className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-text-xs tw-text-gray-500 tw-w-28">Mapped to:</span>
                  <span className="tw-text-xs tw-font-medium tw-text-green-700">
                    <i className="fa-light fa-arrow-right tw-mr-1"></i>
                    {detectedSite.mappedName}
                  </span>
                </div>
              )}

              <div className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-text-xs tw-text-gray-500 tw-w-28">Selected site:</span>
                <span className="tw-text-xs tw-font-medium tw-text-blue-700">
                  {selectedSiteObj ? selectedSiteObj.name : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}

        <Form.Group className="tw-mb-4">
          <Form.Label className="tw-font-medium tw-text-gray-700 tw-block tw-mb-2">
            <i className="fa-light fa-building tw-mr-2"></i>Site
          </Form.Label>
          <Form.Control
            as="select"
            value={selectedSite}
            onChange={(e) => onSiteChange(e.target.value)}
            required
            className="tw-w-full tw-border-gray-300 tw-rounded-md tw-shadow-sm focus:tw-ring-blue-500 focus:tw-border-blue-500"
          >
            <option value="">Select Site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <div className="tw-text-sm tw-mb-6 tw-p-3 tw-bg-gray-50 tw-rounded-md tw-border tw-border-gray-200">
          <p className="tw-text-gray-700">
            <i className="fa-light fa-info-circle tw-mr-2 tw-text-blue-600"></i>
            <span className="tw-font-medium">File naming tip:</span> To ensure correct site detection,
            name your files in the format:
          </p>
          <p className="tw-text-gray-600 tw-font-mono tw-text-xs tw-mt-2 tw-ml-6">
            SITE_NAME Fuel Report MONTH YEAR.xlsx
          </p>
          <p className="tw-text-gray-600 tw-mt-2 tw-text-xs">
            Special mappings:
            <ul className="tw-mt-1 tw-list-disc tw-list-inside">
              <li>"FOOTBRIDGE" → "BRIDGE" site</li>
              <li>"IP" → "Industrial Plot" site</li>
            </ul>
          </p>
        </div>

        <div className="tw-flex tw-justify-between tw-gap-3 tw-mt-4">
          <div>
            <Button
              stylingMode="text"
              text="Switch to Manual Selection"
              onClick={() => {
                setSiteSelectionMode("manual");
                onHide();
              }}
              elementAttr={{
                class: "tw-text-blue-600",
              }}
            />
          </div>
          <div className="tw-flex tw-gap-3">
            <Button
              stylingMode="outlined"
              text="Cancel"
              onClick={onHide}
            />
            <Button
              stylingMode="contained"
              type="default"
              text="Confirm Site"
              onClick={onConfirm}
              disabled={!selectedSite}
            />
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default SiteConfirmation;