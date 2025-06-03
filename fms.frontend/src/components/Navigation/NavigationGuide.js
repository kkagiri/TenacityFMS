import React, { useState } from 'react';
import { Accordion } from 'devextreme-react/accordion';

const NavigationGuide = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const guideItems = [
        {
            title: "Step 1: Create Navigation Item",
            content: (
                <div>
                    <p className="tw-mb-2">Use the Navigation Management page to create a new navigation item with:</p>
                    <ul className="tw-list-disc tw-ml-6">
                        <li><strong>Page Name:</strong> Display name in the menu (e.g., "Reports")</li>
                        <li><strong>Link:</strong> Route path (e.g., "/reports")</li>
                        <li><strong>Parent:</strong> Optional parent for nested menus</li>
                        <li><strong>Icon:</strong> Font Awesome icon class (e.g., "fa-chart-bar")</li>
                        <li><strong>Roles:</strong> User roles that can access this page</li>
                    </ul>
                </div>
            )
        },
        {
            title: "Step 2: Create Page Component",
            content: (
                <div>
                    <p className="tw-mb-2">Create a React component for your page:</p>
                    <pre className="tw-bg-gray-100 tw-p-3 tw-rounded tw-text-sm">
{`// src/pages/Reports/ReportsPage.js
import React from 'react';

const ReportsPage = () => {
  return (
    <div className="content-block">
      <div className="content">
        <h1>Reports</h1>
        {/* Your page content */}
      </div>
    </div>
  );
};

export default ReportsPage;`}
                    </pre>
                </div>
            )
        },
        {
            title: "Step 3: Add Route Configuration",
            content: (
                <div>
                    <p className="tw-mb-2">Add the route to your router configuration:</p>
                    <pre className="tw-bg-gray-100 tw-p-3 tw-rounded tw-text-sm">
{`// In your router configuration file
import ReportsPage from './pages/Reports/ReportsPage';

const routes = [
  {
    path: '/reports',
    component: ReportsPage,
    // Add route guards if needed
  },
  // ... other routes
];`}
                    </pre>
                </div>
            )
        },
        {
            title: "Step 4: Verify Navigation",
            content: (
                <div>
                    <p className="tw-mb-2">After completing the above steps:</p>
                    <ul className="tw-list-disc tw-ml-6">
                        <li>The navigation item will appear in the menu for users with appropriate roles</li>
                        <li>Clicking the menu item will navigate to your new page</li>
                        <li>The icon will be displayed if specified</li>
                        <li>Nested items will appear under their parent</li>
                    </ul>
                    <div className="tw-mt-4 tw-p-3 tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded">
                        <i className="fa fa-exclamation-triangle tw-text-yellow-600 tw-mr-2"></i>
                        <span className="tw-text-sm">
                            <strong>Important:</strong> Navigation items without corresponding page components and routes will result in 404 errors.
                        </span>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="tw-mt-6 tw-p-4 tw-bg-white tw-rounded tw-shadow">
            <h3 className="tw-text-lg tw-font-semibold tw-mb-4">
                <i className="fa fa-book tw-mr-2"></i>
                Developer Guide: Implementing Navigation Items
            </h3>
            <Accordion
                dataSource={guideItems}
                collapsible={true}
                multiple={false}
                selectedIndex={selectedIndex}
                onSelectionChanged={(e) => setSelectedIndex(e.component.option('selectedIndex'))}
                itemTitleRender={(item) => (
                    <div className="tw-flex tw-items-center tw-py-2">
                        <span className="tw-font-medium">{item.title}</span>
                    </div>
                )}
                itemRender={(item) => (
                    <div className="tw-p-4">
                        {item.content}
                    </div>
                )}
            />
        </div>
    );
};

export default NavigationGuide;