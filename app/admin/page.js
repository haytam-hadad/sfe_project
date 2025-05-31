"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Search, Edit, Trash2, Eye, RefreshCw, LoaderCircle, AlertCircle, FileSpreadsheet, User, Shield, UserPlus, Copy } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import { fetchAllUsers, fetchUser, updateUser, deleteUser, fetchUserSheetData, copySheetUrl } from "@/lib/api-admin"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"


export default function AdminDashboard() {
  const { toast } = useToast()
  const { user, token, isAuthenticated, isLoading: authLoading, adminSignup } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [userSheetData, setUserSheetData] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [loadingUserData, setLoadingUserData] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "sub-admin",
    sheetUrl: "",
    isActive: true
  })
  const [roleFilter, setRoleFilter] = useState("all"); // default to "all"
  const [hasSheetFilter, setHasSheetFilter] = useState("all"); // "all" | "has" | "no"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"
  const [copyingSheetUrl, setCopyingSheetUrl] = useState(false)

  // Check if current user is admin
  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (token && isAdmin && !authLoading) {
      loadUsers()
    }
  }, [token, isAdmin, authLoading])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await fetchAllUsers(token)
      if (!data || !data.users) {
        throw new Error("Invalid response from server")
      }
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      })
      setUsers([]) // Reset users array on error
    } finally {
      setLoading(false)
    }
  }

  const handleViewUser = async (userId) => {
    setLoadingUserData(true)
    try {
      // Fetch user details
      const userData = await fetchUser(token, userId)
      setSelectedUser(userData)

      // Fetch user's sheet data if they have a sheet URL
      if (userData.sheetUrl) {
        try {
          const sheetData = await fetchUserSheetData(token, userId)
          setUserSheetData(sheetData)
        } catch (error) {
          console.error("Error fetching sheet data:", error)
          setUserSheetData(null)
        }
      } else {
        setUserSheetData(null)
      }

      setShowUserDetails(true)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load user details",
        variant: "destructive",
      })
    } finally {
      setLoadingUserData(false)
    }
  }

  const handleEditUser = (user) => {
    setEditingUser({ 
      ...user,
      isActive: user.isActive ?? true // Ensure isActive is always a boolean
    })
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const { _id, createdAt, updatedAt, ...updateData } = editingUser
      const result = await updateUser(token, editingUser._id, {
        ...updateData,
        isActive: Boolean(editingUser.isActive) // Ensure isActive is a boolean
      })

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      setEditingUser(null)
      loadUsers()

      // If we're viewing this user's details, update the selected user
      if (selectedUser && selectedUser._id === editingUser._id) {
        setSelectedUser(result.user)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteUser(token, userId)

      if (!result.success) {
        throw new Error(result.message || "Failed to delete user")
      }

      toast({
        title: "Success",
        description: result.message || "User deleted successfully",
      })

      // Remove the deleted user from the list
      setUsers(users.filter(user => user._id !== userId))

      // If we're viewing this user's details, close the dialog
      if (selectedUser && selectedUser._id === userId) {
        setShowUserDetails(false)
        setSelectedUser(null)
        setUserSheetData(null)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleCreateUser = async () => {
    try {
      // Use the existing adminSignup function from auth context
      const result = await adminSignup({
        ...newUser,
        isActive: true // Ensure new users are active by default
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to create user")
      }

      toast({
        title: "Success",
        description: "User created successfully",
      })

      setShowCreateUser(false)
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "sub-admin",
        sheetUrl: "",
        isActive: true
      })
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const result = await updateUser(token, userId, {
        isActive: !currentStatus
      })

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      })

      loadUsers()

      // If we're viewing this user's details, update the selected user
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(result.user)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  const handleCopySheetUrl = async (sourceUserId) => {
    if (!confirm('Are you sure you want to copy this sheet URL?')) {
      return;
    }

    setCopyingSheetUrl(true);
    try {
      const result = await copySheetUrl(token, sourceUserId, user._id);
      
      toast({
        title: "Success",
        description: "Sheet URL copied successfully",
      });

      // Refresh users list and redirect to home page
      await loadUsers();
      router.push('/');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to copy sheet URL",
        variant: "destructive",
      });
    } finally {
      setCopyingSheetUrl(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === "all" ? true : user.role === roleFilter) &&
      (hasSheetFilter === "all"
        ? true
        : hasSheetFilter === "has"
        ? !!user.sheetUrl
        : !user.sheetUrl) &&
      (statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? user.isActive
        : !user.isActive)
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a")
    } catch (error) {
      return dateString
    }
  }

  const getRoleBadgeVariant = (role) => {
    return role === "admin" ? "destructive" : "secondary"
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You must be logged in to access this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Access denied. Admin privileges required.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage users and view their data</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateUser(true)}>
            <UserPlus className="mr-1 h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-9 w-9 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Shield className="h-9 w-9 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <User className="h-9 w-9 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Sub-Admins</p>
                <p className="text-2xl font-bold">{users.filter((u) => u.role === "sub-admin").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
          <CardDescription>View and manage all users in the system</CardDescription>
          <div className="flex flex-wrap items-center space-x-1 mt-4 gap-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-4 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 my-1 border-b-2 border-b-mainColor"
              />
            </div>
            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sub-admin">Sub-Admin</SelectItem>
              </SelectContent>
            </Select>
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {/* Has Sheet Filter */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="sheet-all"
                  name="hasSheetFilter"
                  value="all"
                  checked={hasSheetFilter === "all"}
                  onChange={() => setHasSheetFilter("all")}
                />
                <label htmlFor="sheet-all" className="text-sm text-muted-foreground select-none">
                  All
                </label>
                <input
                  type="radio"
                  id="sheet-has"
                  name="hasSheetFilter"
                  value="has"
                  checked={hasSheetFilter === "has"}
                  onChange={() => setHasSheetFilter("has")}
                />
                <label htmlFor="sheet-has" className="text-sm text-muted-foreground select-none">
                  Has Sheet
                </label>
                <input
                  type="radio"
                  id="sheet-no"
                  name="hasSheetFilter"
                  value="no"
                  checked={hasSheetFilter === "no"}
                  onChange={() => setHasSheetFilter("no")}
                />
                <label htmlFor="sheet-no" className="text-sm text-muted-foreground select-none">
                  No Sheet
                </label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="h-9 w-9 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-100 rounded-md dark:bg-zinc-900">
                    <TableHead className="text-center">User</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Sheet URL</TableHead>
                    <TableHead className="text-center">Created</TableHead>
                    <TableHead className="text-center">Last Activity</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-9 w-9 bg-primary border">
                              <AvatarFallback>
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)} className={user.role === "admin" ? "bg-mainColor" : ""}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={() => handleToggleActive(user._id, user.isActive)}
                              className="data-[state=checked]:bg-green-600"
                            />
                            <span className="text-sm text-muted-foreground">
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {user.sheetUrl ? (
                              <div className="flex items-center gap-2">
                                <Link
                                  href={user.sheetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                                >
                                  <FileSpreadsheet className="h-4 w-4" />
                                  View Sheet
                                </Link>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No sheet</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{formatDate(user.lastActivity)}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 hover:bg-transparent"
                              >
                                <MoreVertical className="h-4 w-4 text-black dark:text-white" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] p-2">
                              <DropdownMenuItem
                                onClick={() => handleViewUser(user._id)}
                                disabled={loadingUserData}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent rounded-md"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="font-medium">View User</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditUser(user)}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent rounded-md"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="font-medium">Edit User</span>
                              </DropdownMenuItem>
                              {user.sheetUrl && (
                                <DropdownMenuItem
                                  onClick={() => handleCopySheetUrl(user._id)}
                                  disabled={copyingSheetUrl}
                                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent rounded-md"
                                >
                                  {copyingSheetUrl ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                  <span className="font-medium">Copy Sheet URL</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user._id, user.username)}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-red-100 hover:text-red-600 rounded-md text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="font-medium">Delete User</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {searchTerm ? "No users found matching your search" : "No users found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Username <span className="text-red-500">*</span></label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password <span className="text-red-500">*</span></label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sheet URL (Optional)</label>
              <Input
                value={newUser.sheetUrl}
                onChange={(e) => setNewUser({ ...newUser, sheetUrl: e.target.value })}
                placeholder="Enter Google Sheets URL (optional)"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role <span className="text-red-500">*</span></label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sub-admin">Sub-Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateUser(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>Create User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sub-admin">Sub-Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Sheet URL</label>
                <Input
                  value={editingUser.sheetUrl || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, sheetUrl: e.target.value })}
                  placeholder="Google Sheets URL"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid m-auto w-full grid-cols-2">
                <TabsTrigger
                  value="info"
                  className="rounded-t-md border-b-2 border-transparent data-[state=active]:border-mainColor data-[state=active]:bg-zinc-50 dark:data-[state=active]:bg-zinc-900 transition"
                >
                  Info
                </TabsTrigger>
                <TabsTrigger
                  value="sheet"
                  className="rounded-t-md border-b-2 border-transparent data-[state=active]:border-mainColor data-[state=active]:bg-zinc-50 dark:data-[state=active]:bg-zinc-900 transition"
                >
                  Sheet Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 p-4">
                      <div>
                        <label className="text-md font-medium text-muted-foreground">Username</label>
                        <p className="text-sm">{selectedUser.username}</p>
                      </div>
                      <div>
                        <label className="text-md font-medium text-muted-foreground">Email</label>
                        <p className="text-sm">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-md font-medium text-muted-foreground">Role</label>
                          <Badge variant={getRoleBadgeVariant(user.role)} className={user.role === "admin" ? "bg-mainColor block w-fit" : " w-fit block"}>{user.role}</Badge>
                      </div>
                      <div>
                        <label className="text-md font-medium text-muted-foreground">Created</label>
                        <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                      <div>
                        <label className="text-md font-medium text-muted-foreground">Last Activity</label>
                        <p className="text-sm">{formatDate(selectedUser.lastActivity)}</p>
                      </div>
                      <div>
                        <label className="text-md font-medium text-muted-foreground">Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Switch
                            checked={selectedUser.isActive}
                            onCheckedChange={() => handleToggleActive(selectedUser._id, selectedUser.isActive)}
                            className="data-[state=checked]:bg-green-500"
                          />
                          <span className="text-sm text-muted-foreground">
                            {selectedUser.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedUser.sheetUrl ? (
                      <div className="mt-4">
                        <label className="text-md font-medium text-muted-foreground">Sheet URL</label>
                        <Link href={selectedUser.sheetUrl} target="_blank" rel="noopener noreferrer" className="text-sm block text-mainColor break-all underline">
                          {selectedUser.sheetUrl}
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-muted-foreground">Sheet URL</label>
                        <p className="text-sm text-zinc-500">Not set</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sheet" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-5 w-5" />
                      Sheet Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userSheetData ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 p-1 border-b-2 border-mainColor gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Total Rows</label>
                            <p className="text-2xl font-bold">{userSheetData.metadata?.totalRows || 0}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Headers</label>
                            <p className="text-2xl font-bold">{userSheetData.metadata?.headers?.length || 0}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Sheet Owner</label>
                            <p className="text-sm">{userSheetData.user?.username}</p>
                          </div>
                        </div>
                        {userSheetData.data && userSheetData.data.length > 0 && (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {userSheetData.metadata?.headers?.slice(0, 5).map((header, index) => (
                                    <TableHead key={index}>{header}</TableHead>
                                  ))}
                                  {userSheetData.metadata?.headers?.length > 5 && <TableHead>...</TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {userSheetData.data.slice(0, 10).map((row, index) => (
                                  <TableRow key={index}>
                                    {userSheetData.metadata?.headers?.slice(0, 5).map((header, cellIndex) => (
                                      <TableCell key={cellIndex} className="max-w-[150px] truncate">
                                        {row[header] || "-"}
                                      </TableCell>
                                    ))}
                                    {userSheetData.metadata?.headers?.length > 5 && <TableCell>...</TableCell>}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {userSheetData.data.length > 10 && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Showing first 10 rows of {userSheetData.data.length} total rows
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        {selectedUser.sheetUrl ? (
                          <div className="flex flex-col items-center">
                            <LoaderCircle className="h-9 w-9 animate-spin mb-2" />
                            <p className="text-muted-foreground">Loading sheet data...</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">User has no sheet URL configured</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
