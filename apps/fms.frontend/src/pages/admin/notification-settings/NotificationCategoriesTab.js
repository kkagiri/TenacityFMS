import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  DataGrid,
  Toolbar,
  Button,
  Popup,
  Form,
  LoadPanel
} from "devextreme-react";
import { Column } from "devextreme-react/data-grid";
import { Item as ToolbarItem } from "devextreme-react/toolbar";
import { SimpleItem, RequiredRule, PatternRule } from "devextreme-react/form";
import { confirm } from "devextreme/ui/dialog";
import notificationCategoriesApi from "../../../dataservice/notificationCategoriesApi";

const NotificationCategoriesTab = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const formRef = useRef(null);
  const gridRef = useRef(null);

  // Load categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationCategoriesApi.getAllCategories(includeInactive);
      if (result.isSuccess) {
        setCategories(result.data);
      } else {
        console.error("Failed to load categories:", result.message);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  // Load data on component mount and when includeInactive changes
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle create new category
  const handleCreate = useCallback(() => {
    setEditingCategory({
      id: "",
      name: "",
      description: "",
      defaultPriority: "Medium",
      isActive: true,
      displayOrder: categories.length + 1,
      iconClass: "fa-solid fa-bell",
      defaultRequireAcknowledgment: false,
      defaultDeliveryMethods: ["System"]
    });
    setPopupVisible(true);
  }, [categories.length]);

  // Handle edit category
  const handleEdit = useCallback((e) => {
    const category = e.row.data;
    setEditingCategory({
      ...category,
      defaultDeliveryMethods: category.defaultDeliveryMethods || ["System"]
    });
    setPopupVisible(true);
  }, []);

  // Handle delete category
  const handleDelete = useCallback(async (e) => {
    const category = e.row.data;
    const result = await confirm(
      `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`,
      "Delete Category"
    );

    if (result) {
      setSaving(true);
      try {
        const deleteResult = await notificationCategoriesApi.deleteCategory(category.id);
        if (deleteResult.isSuccess) {
          await loadCategories();
          console.log("Category deleted successfully");
        } else {
          console.error("Failed to delete category:", deleteResult.message);
        }
      } catch (error) {
        console.error("Error deleting category:", error);
      } finally {
        setSaving(false);
      }
    }
  }, [loadCategories]);

  // Handle save category
  const handleSave = useCallback(async () => {
    const formInstance = formRef.current?.instance;
    if (!formInstance) return;

    const validationResult = formInstance.validate();
    if (!validationResult.isValid) {
      return;
    }

    const formData = formInstance.option("formData");

    // Additional validation
    const validation = notificationCategoriesApi.validateCategory(formData);
    if (!validation.isValid) {
      console.error("Validation errors:", validation.errors);
      return;
    }

    setSaving(true);
    try {
      let result;
      if (editingCategory.id && categories.find(c => c.id === editingCategory.id)) {
        // Update existing category
        result = await notificationCategoriesApi.updateCategory(editingCategory.id, formData);
      } else {
        // Create new category
        result = await notificationCategoriesApi.createCategory(formData);
      }

      if (result.isSuccess) {
        setPopupVisible(false);
        setEditingCategory(null);
        await loadCategories();
        console.log("Category saved successfully");
      } else {
        console.error("Failed to save category:", result.message);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setSaving(false);
    }
  }, [editingCategory, categories, loadCategories]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setPopupVisible(false);
    setEditingCategory(null);
  }, []);

  // Toggle include inactive
  const handleToggleInactive = useCallback((e) => {
    setIncludeInactive(e.value);
  }, []);

  // Get priority levels and delivery methods
  const priorityLevels = notificationCategoriesApi.getPriorityLevels();
  const deliveryMethods = notificationCategoriesApi.getDeliveryMethods();
  const iconClasses = notificationCategoriesApi.getIconClasses();

  // Custom render functions
  const renderStatusCell = useCallback((cellData) => {
    const isActive = cellData.value;
    return (
      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
        <i className={`fa-light ${isActive ? 'fa-check-circle' : 'fa-times-circle'} tw-mr-1`}></i>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  }, []);

  const renderPriorityCell = useCallback((cellData) => {
    const priority = priorityLevels.find(p => p.id === cellData.value);
    return priority ? (
      <span className={`priority-badge ${priority.color}`}>
        {priority.name}
      </span>
    ) : cellData.value;
  }, [priorityLevels]);

  const renderIconCell = useCallback((cellData) => {
    return cellData.value ? (
      <i className={`${cellData.value} tw-text-lg`}></i>
    ) : null;
  }, []);

  const renderActionsCell = useCallback((cellData) => {
    return (
      <div className="action-buttons">
        <Button
          icon="fa-light fa-edit"
          stylingMode="text"
          onClick={() => handleEdit({ row: { data: cellData.data } })}
          hint="Edit category"
        />
        <Button
          icon="fa-light fa-trash"
          stylingMode="text"
          onClick={() => handleDelete({ row: { data: cellData.data } })}
          hint="Delete category"
          className="tw-text-red-500"
        />
      </div>
    );
  }, [handleEdit, handleDelete]);

  return (
    <div className="notification-categories-tab tw-h-full tw-flex tw-flex-col">
      <div className="categories-content tw-flex-1 tw-overflow-hidden">
        <DataGrid
          ref={gridRef}
          dataSource={categories}
          keyExpr="id"
          showBorders={true}
          showRowLines={true}
          showColumnLines={false}
          allowColumnResizing={true}
          columnAutoWidth={true}
          height="100%"
          className="categories-grid"
        >
          <Toolbar>
            <ToolbarItem location="before">
              <Button
                text="Add Category"
                icon="fa-light fa-plus"
                type="default"
                onClick={handleCreate}
              />
            </ToolbarItem>
            <ToolbarItem location="after">
              <div className="toolbar-controls">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeInactive}
                    onChange={handleToggleInactive}
                  />
                  <span className="tw-ml-2">Show inactive categories</span>
                </label>
              </div>
            </ToolbarItem>
          </Toolbar>

          <Column
            dataField="iconClass"
            caption="Icon"
            width={60}
            cellRender={renderIconCell}
            allowSorting={false}
          />

          <Column
            dataField="id"
            caption="ID"
            width={120}
          />

          <Column
            dataField="name"
            caption="Name"
            width={150}
          />

          <Column
            dataField="description"
            caption="Description"
            width={200}
          />

          <Column
            dataField="defaultPriority"
            caption="Default Priority"
            width={120}
            cellRender={renderPriorityCell}
          />

          <Column
            dataField="displayOrder"
            caption="Order"
            width={80}
            dataType="number"
          />

          <Column
            dataField="isActive"
            caption="Status"
            width={100}
            cellRender={renderStatusCell}
          />

          <Column
            dataField="defaultDeliveryMethods"
            caption="Default Delivery"
            width={150}
            cellRender={(cellData) => {
              const methods = Array.isArray(cellData.value)
                ? cellData.value
                : (cellData.value ? cellData.value.split(',') : []);
              return methods.join(', ');
            }}
          />

          <Column
            caption="Actions"
            width={100}
            allowSorting={false}
            cellRender={renderActionsCell}
          />
        </DataGrid>
      </div>

      {/* Edit/Create Popup */}
      <Popup
        visible={popupVisible}
        onHiding={handleCancel}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showTitle={true}
        title={editingCategory?.id && categories.find(c => c.id === editingCategory.id) ? "Edit Category" : "Create Category"}
        width={600}
        height={500}
      >
        <Form
          ref={formRef}
          formData={editingCategory}
          colCount={1}
          className="category-form"
        >
          <SimpleItem
            dataField="id"
            label={{ text: "Category ID" }}
            isRequired={true}
            editorOptions={{
              placeholder: "Enter unique category ID (e.g., CustomAlert)",
              disabled: editingCategory?.id && categories.find(c => c.id === editingCategory.id)
            }}
          >
            <RequiredRule message="Category ID is required" />
            <PatternRule
              pattern="^[a-zA-Z0-9_]+$"
              message="Category ID can only contain letters, numbers, and underscores"
            />
          </SimpleItem>

          <SimpleItem
            dataField="name"
            label={{ text: "Display Name" }}
            isRequired={true}
            editorOptions={{
              placeholder: "Enter category display name"
            }}
          >
            <RequiredRule message="Category name is required" />
          </SimpleItem>

          <SimpleItem
            dataField="description"
            editorType="dxTextArea"
            label={{ text: "Description" }}
            editorOptions={{
              placeholder: "Enter category description",
              height: 80
            }}
          />

          <SimpleItem
            dataField="iconClass"
            editorType="dxSelectBox"
            label={{ text: "Icon" }}
            editorOptions={{
              dataSource: iconClasses,
              displayExpr: "name",
              valueExpr: "id",
              itemTemplate: (data) => (
                <div className="icon-item">
                  <i className={`${data.icon} tw-mr-2`}></i>
                  {data.name}
                </div>
              ),
              fieldTemplate: (data) => (
                <div className="icon-field">
                  <i className={`${data?.icon} tw-mr-2`}></i>
                  {data?.name}
                </div>
              )
            }}
          />

          <SimpleItem
            dataField="defaultPriority"
            editorType="dxSelectBox"
            label={{ text: "Default Priority" }}
            isRequired={true}
            editorOptions={{
              dataSource: priorityLevels,
              displayExpr: "name",
              valueExpr: "id"
            }}
          >
            <RequiredRule message="Default priority is required" />
          </SimpleItem>

          <SimpleItem
            dataField="defaultDeliveryMethods"
            editorType="dxTagBox"
            label={{ text: "Default Delivery Methods" }}
            isRequired={true}
            editorOptions={{
              dataSource: deliveryMethods,
              displayExpr: "name",
              valueExpr: "id",
              showSelectionControls: true,
              applyValueMode: "useButtons"
            }}
          >
            <RequiredRule message="At least one delivery method is required" />
          </SimpleItem>

          <SimpleItem
            dataField="displayOrder"
            editorType="dxNumberBox"
            label={{ text: "Display Order" }}
            editorOptions={{
              min: 0,
              showSpinButtons: true
            }}
          />

          <SimpleItem
            dataField="defaultRequireAcknowledgment"
            editorType="dxCheckBox"
            label={{ text: "Require Acknowledgment by Default" }}
          />

          <SimpleItem
            dataField="isActive"
            editorType="dxCheckBox"
            label={{ text: "Active" }}
          />

          <SimpleItem itemType="group" cssClass="buttons-group">
            <SimpleItem itemType="button" horizontalAlignment="right">
              <Button
                text="Cancel"
                onClick={handleCancel}
                stylingMode="outlined"
              />
            </SimpleItem>
            <SimpleItem itemType="button" horizontalAlignment="right">
              <Button
                text="Save"
                type="default"
                onClick={handleSave}
                disabled={saving}
              />
            </SimpleItem>
          </SimpleItem>
        </Form>
      </Popup>

      <LoadPanel visible={loading || saving} message={loading ? "Loading categories..." : "Saving category..."} />
    </div>
  );
};

export default NotificationCategoriesTab;
