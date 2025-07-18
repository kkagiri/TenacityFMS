"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Search,
  Users,
  UserPlus,
  Mail,
  Phone,
  Edit,
  Trash2,
  MoreHorizontal,
  Upload,
  Download,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const users = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@company.com",
    phone: "+1 (555) 123-4567",
    role: "Operations Manager",
    department: "Operations",
    status: "Active",
    preferences: {
      email: true,
      sms: false,
      system: true,
    },
    groups: ["Operations Team", "Emergency Response"],
    lastActive: "2024-01-28 14:30:00",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    phone: "+1 (555) 234-5678",
    role: "Maintenance Supervisor",
    department: "Maintenance",
    status: "Active",
    preferences: {
      email: true,
      sms: true,
      system: true,
    },
    groups: ["Maintenance Team"],
    lastActive: "2024-01-28 13:45:00",
  },
  {
    id: 3,
    name: "Mike Wilson",
    email: "mike.wilson@company.com",
    phone: "+1 (555) 345-6789",
    role: "IT Administrator",
    department: "IT",
    status: "Active",
    preferences: {
      email: true,
      sms: false,
      system: true,
    },
    groups: ["IT Support", "Emergency Response"],
    lastActive: "2024-01-28 15:00:00",
  },
  {
    id: 4,
    name: "Lisa Chen",
    email: "lisa.chen@company.com",
    phone: "+1 (555) 456-7890",
    role: "Safety Officer",
    department: "Safety",
    status: "Inactive",
    preferences: {
      email: true,
      sms: true,
      system: false,
    },
    groups: ["Safety Team", "Emergency Response"],
    lastActive: "2024-01-25 16:20:00",
  },
]

const groups = [
  {
    id: 1,
    name: "Operations Team",
    description: "Daily operations and monitoring staff",
    members: 8,
    policies: 5,
    status: "Active",
  },
  {
    id: 2,
    name: "Maintenance Team",
    description: "Equipment maintenance and repair staff",
    members: 5,
    policies: 3,
    status: "Active",
  },
  {
    id: 3,
    name: "Emergency Response",
    description: "Critical incident response team",
    members: 12,
    policies: 8,
    status: "Active",
  },
  {
    id: 4,
    name: "Management",
    description: "Senior management and executives",
    members: 4,
    policies: 2,
    status: "Active",
  },
]

export default function RecipientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter
    const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter

    return matchesSearch && matchesStatus && matchesDepartment
  })

  const filteredGroups = groups.filter((group) => {
    return (
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recipients Management</h1>
          <p className="text-muted-foreground">Manage users, groups, and notification preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Users
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{users.filter((u) => u.status === "Active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Groups</p>
                <p className="text-2xl font-bold">{groups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Email Enabled</p>
                <p className="text-2xl font-bold">{users.filter((u) => u.preferences.email).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="escalation">Escalation Chains</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>Create a new user account for notification management</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" placeholder="Smith" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="john.smith@company.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" placeholder="+1 (555) 123-4567" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Input id="role" placeholder="Operations Manager" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="operations">Operations</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="it">IT</SelectItem>
                              <SelectItem value="safety">Safety</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label>Notification Preferences</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="emailPref">Email Notifications</Label>
                            <Switch id="emailPref" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="smsPref">SMS Notifications</Label>
                            <Switch id="smsPref" />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="systemPref">System Notifications</Label>
                            <Switch id="systemPref" defaultChecked />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setIsAddUserOpen(false)}>Create User</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Showing {filteredUsers.length} of {users.length} users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{user.name}</h4>
                          <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.role} • {user.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {user.preferences.email && <Mail className="h-3 w-3 text-blue-600" />}
                          {user.preferences.sms && <Phone className="h-3 w-3 text-green-600" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.groups.length} groups</p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Test Notification
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          {/* Groups Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 max-w-md"
              />
            </div>
            <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>Create a new notification group for organizing recipients</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input id="groupName" placeholder="Operations Team" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupDescription">Description</Label>
                    <Input id="groupDescription" placeholder="Daily operations and monitoring staff" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddGroupOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddGroupOpen(false)}>Create Group</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Groups List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <Badge variant={group.status === "Active" ? "default" : "secondary"}>{group.status}</Badge>
                  </div>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Members:</span>
                      <span className="font-medium">{group.members}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Policies:</span>
                      <span className="font-medium">{group.policies}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Users className="h-3 w-3 mr-1" />
                        Members
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="escalation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escalation Chains</CardTitle>
              <CardDescription>Configure escalation paths for critical notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Critical Tank Alerts</h4>
                  <p className="text-sm text-muted-foreground mb-3">Escalation chain for critical tank level alerts</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Level 1</Badge>
                      <span>Operations Team (Immediate)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Level 2</Badge>
                      <span>Operations Manager (15 minutes)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Level 3</Badge>
                      <span>Site Manager (30 minutes)</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Emergency Response</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Emergency escalation for critical system failures
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Level 1</Badge>
                      <span>Emergency Response Team (Immediate)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Level 2</Badge>
                      <span>Safety Officer (5 minutes)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Level 3</Badge>
                      <span>Management Team (10 minutes)</span>
                    </div>
                  </div>
                </div>

                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Escalation Chain
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
