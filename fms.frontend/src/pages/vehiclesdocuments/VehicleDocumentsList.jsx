import React, { useState, useEffect } from "react";
import {
  DataGrid,
  Column,
  FilterRow,
  Pager,
  Paging,
  SearchPanel,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import VehicleDocumentForm from "./components/VehicleDocumentForm";
import BulkDocumentUpload from "./components/BulkDocumentUpload";
import DocumentStatusBadge from "./components/DocumentStatusBadge";
import {
  getVehicleDocuments,
  createVehicleDocument,
  updateVehicleDocument,
  deleteVehicleDocument,
} from "../../../../redux/actions/vehicleDocumentActions";
import { fetchVehicleList } from "../../../../redux/actions/vehicleActions";

const VehicleDocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isBulkUploadVisible, setIsBulkUploadVisible] = useState(false);

  const fetchDocuments = async () => {
    const response = await getVehicleDocuments();
    if (response.isSuccess) {
      setDocuments(response.data);
    }
  };

  const fetchVehicles = async () => {
    const response = await fetchVehicleList();
    if (response.isSuccess) {
      setVehicles(response.data);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchVehicles();
  }, []);

  const handleAddClick = () => {
    setCurrentDocument({});
    setIsFormVisible(true);
  };

  const handleEditClick = (e) => {
    setCurrentDocument(e.row.data);
    setIsFormVisible(true);
  };

  const handleDeleteClick = async (e) => {
    await deleteVehicleDocument(e.row.data.id);
    fetchDocuments();
  };

  const handleSave = async (documentData) => {
    const formData = new FormData();
    Object.keys(documentData).forEach((key) => {
      if (key === "documentFile" && documentData[key] && documentData[key][0]) {
        formData.append(key, documentData[key][0]);
      } else if (
        documentData[key] !== null &&
        documentData[key] !== undefined
      ) {
        formData.append(key, documentData[key]);
      }
    });

    if (documentData.id) {
      await updateVehicleDocument(documentData.id, formData);
    } else {
      await createVehicleDocument(formData);
    }
    fetchDocuments();
    setIsFormVisible(false);
  };

  const statusCellRender = (data) => {
    return <DocumentStatusBadge status={data.value} />;
  };

  const actionsCellRender = (e) => {
    return (
      <div className="tw-flex">
        <Button
          icon="edit"
          onClick={() => handleEditClick(e)}
          className="tw-mr-2"
        />
        <Button icon="trash" onClick={() => handleDeleteClick(e)} />
      </div>
    );
  };

  return (
    <div className="tw-p-4">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <h2 className="tw-text-2xl tw-font-bold">Vehicle Documents</h2>
        <div className="tw-flex tw-gap-2">
          <Button
            text="Bulk Upload"
            icon="fa fa-light fa-cloud-arrow-up"
            stylingMode="outlined"
            type="default"
            onClick={() => setIsBulkUploadVisible(true)}
          />
          <Button
            text="Add Document"
            icon="plus"
            type="default"
            onClick={handleAddClick}
          />
        </div>
      </div>

      <DataGrid
        dataSource={documents}
        keyExpr="id"
        showBorders={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
      >
        <SearchPanel visible={true} width={240} placeholder="Search..." />
        <FilterRow visible={true} />
        <Paging defaultPageSize={10} />
        <Pager showPageSizeSelector={true} allowedPageSizes={[10, 25, 50]} />

        <Column dataField="vehicleRegistration" caption="Vehicle" />
        <Column dataField="documentTypeName" caption="Document Type" />
        <Column dataField="documentNumber" caption="Document Number" />
        <Column dataField="issueDate" caption="Issue Date" dataType="date" />
        <Column dataField="expiryDate" caption="Expiry Date" dataType="date" />
        <Column
          dataField="status"
          caption="Status"
          cellRender={statusCellRender}
        />
        <Column dataField="daysUntilExpiry" caption="Days to Expire" />
        <Column type="buttons" cellRender={actionsCellRender} />
      </DataGrid>

      {isFormVisible && (
        <VehicleDocumentForm
          visible={isFormVisible}
          onHide={() => setIsFormVisible(false)}
          onSave={handleSave}
          documentData={currentDocument}
          vehicles={vehicles}
        />
      )}

      <BulkDocumentUpload
        visible={isBulkUploadVisible}
        onHide={() => setIsBulkUploadVisible(false)}
        onSaved={fetchDocuments}
      />
    </div>
  );
};

export default VehicleDocumentsList;
