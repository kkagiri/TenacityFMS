
import React, { useState } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { mockPolicyMetrics } from "../mockData";

const PolicyManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Using mock data instead of hardcoded sample data
  const policies = mockPolicyMetrics.map(policy => ({
    ...policy,
    policyType: policy.type,
    nextExecutionDate: policy.nextExecution,
    executionCount: policy.executionCount,
    successRate: policy.successRate,
    createdDate: policy.createdDate
  }));

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || policy.policyType.toLowerCase() === filterType.toLowerCase();
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && policy.isActive) ||
      (filterStatus === "inactive" && !policy.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="tw-space-y-6">
      {/* Header and Controls */}
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-justify-between tw-items-start sm:tw-items-center tw-space-y-4 sm:tw-space-y-0">
        <div>
          <h2 className="tw-text-2xl tw-font-bold">Policy Management</h2>
          <p className="tw-text-gray-600">Configure and monitor automated reconciliation policies</p>
        </div>
        <Button>
          <i className="fa-light fa-plus tw-mr-2"></i>
          Create Policy
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="tw-pt-6">
          <div className="tw-flex tw-flex-col sm:tw-flex-row tw-space-y-4 sm:tw-space-y-0 sm:tw-space-x-4">
            <div className="tw-flex-1">
              <div className="tw-relative">
                <i className="fa-light fa-search tw-absolute tw-left-3 tw-top-1/2 tw-transform tw--translate-y-1/2 tw-text-gray-400"></i>
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="tw-pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="tw-w-full sm:tw-w-40">
                <SelectValue placeholder="Policy Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="threshold">Threshold</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="eventdriven">Event Driven</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="tw-w-full sm:tw-w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policy List */}
      <div className="tw-space-y-4">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id}>
            <CardContent className="tw-pt-6">
              <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center tw-justify-between tw-space-y-4 lg:tw-space-y-0">
                <div className="tw-flex-1 tw-space-y-3">
                  <div className="tw-flex tw-items-center tw-space-x-3">
                    <h3 className="tw-text-lg tw-font-semibold">{policy.name}</h3>
                    <Badge variant="outline">{policy.policyType}</Badge>
                    <Badge variant={policy.isActive ? "default" : "secondary"}>
                      {policy.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="tw-bg-blue-50 tw-text-blue-700">
                      Priority: {policy.priority}
                    </Badge>
                  </div>

                  <p className="tw-text-gray-600">{policy.description}</p>

                  <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-text-sm">
                    <div>
                      <p className="tw-text-gray-500">Success Rate</p>
                      <p className="tw-font-medium tw-text-green-600">{policy.successRate}%</p>
                    </div>
                    <div>
                      <p className="tw-text-gray-500">Executions</p>
                      <p className="tw-font-medium">{policy.executionCount}</p>
                    </div>
                    <div>
                      <p className="tw-text-gray-500">Threshold</p>
                      <p className="tw-font-medium">
                        {policy.discrepancyThreshold}L / {policy.discrepancyPercentageThreshold}%
                      </p>
                    </div>
                    <div>
                      <p className="tw-text-gray-500">Next Execution</p>
                      <p className="tw-font-medium">
                        {policy.nextExecutionDate === "On Threshold"
                          ? "On Threshold"
                          : policy.nextExecutionDate === "Inactive"
                            ? "Inactive"
                            : "Tomorrow 2:00 AM"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="tw-flex tw-flex-col sm:tw-flex-row tw-space-y-2 sm:tw-space-y-0 sm:tw-space-x-2">
                  <Button size="sm" variant="outline">
                    <i className="fa-light fa-edit tw-mr-1"></i>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={
                      policy.isActive ? "tw-text-orange-600 hover:tw-text-orange-700" : "tw-text-green-600 hover:tw-text-green-700"
                    }
                  >
                    {policy.isActive ? (
                      <>
                        <i className="fa-light fa-pause tw-mr-1"></i>
                        Pause
                      </>
                    ) : (
                      <>
                        <i className="fa-light fa-play tw-mr-1"></i>
                        Activate
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" className="tw-text-red-600 hover:tw-text-red-700">
                    <i className="fa-light fa-trash tw-mr-1"></i>
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPolicies.length === 0 && (
        <Card>
          <CardContent className="tw-pt-6">
            <div className="tw-text-center tw-py-8">
              <i className="fa-light fa-filter tw-text-gray-400 tw-text-5xl tw-mb-4"></i>
              <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-2">No policies found</h3>
              <p className="tw-text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PolicyManagement;