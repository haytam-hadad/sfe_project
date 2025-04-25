"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  AlertCircle,
  Clock,
  CheckSquare,
  MessageSquare,
  Eye,
  ShieldCheck,
  ExternalLink,
  Link2,
  Video,
  ImageIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Helper function to process inline formatting
const processInlineFormatting = (text) => {
  if (!text) return null

  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|__[^_]+__)/g).map((chunk, index) => {
    switch (true) {
      case chunk.startsWith("**") && chunk.endsWith("**"):
        return (
          <span key={index} className="font-bold">
            {chunk.slice(2, -2)}
          </span>
        )
      case chunk.startsWith("*") && chunk.endsWith("*"):
        return (
          <span key={index} className="underline">
            {chunk.slice(1, -1)}
          </span>
        )
      case chunk.startsWith("~~") && chunk.endsWith("~~"):
        return (
          <span key={index} className="line-through">
            {chunk.slice(2, -2)}
          </span>
        )
      case chunk.startsWith("__") && chunk.endsWith("__"):
        return (
          <span key={index} className="italic">
            {chunk.slice(2, -2)}
          </span>
        )
      case chunk.startsWith("`") && chunk.endsWith("`"):
        return (
          <code key={index} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-md font-mono">
            {chunk.slice(1, -1)}
          </code>
        )
      default:
        return chunk
    }
  })
}

// Format content function to handle markdown-like formatting
const formatContent = (text) => {
  if (!text) return null

  // Process text line by line to handle headings and blockquotes
  const lines = text.split("\n")

  return (
    <>
      {lines.map((line, lineIndex) => {
        // Skip empty lines but preserve the space
        if (!line.trim()) {
          return <br key={`br-${lineIndex}`} />
        }

        // Handle headings
        if (line.startsWith("# ")) {
          return (
            <h1 key={`line-${lineIndex}`} className="text-2xl font-bold my-4 text-gray-900 dark:text-white">
              {processInlineFormatting(line.substring(2))}
            </h1>
          )
        }

        if (line.startsWith("## ")) {
          return (
            <h2 key={`line-${lineIndex}`} className="text-xl font-bold my-3 text-gray-900 dark:text-white">
              {processInlineFormatting(line.substring(3))}
            </h2>
          )
        }

        if (line.startsWith("### ")) {
          return (
            <h3 key={`line-${lineIndex}`} className="text-lg font-bold my-2 text-gray-900 dark:text-white">
              {processInlineFormatting(line.substring(4))}
            </h3>
          )
        }

        // Handle blockquotes
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={`line-${lineIndex}`}
              className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 bg-gray-50 dark:bg-gray-800 rounded-r-md italic text-gray-700 dark:text-gray-300"
            >
              {processInlineFormatting(line.substring(2))}
            </blockquote>
          )
        }

        // Regular paragraph
        return (
          <p key={`line-${lineIndex}`} className="my-2 text-gray-700 dark:text-gray-300">
            {processInlineFormatting(line)}
          </p>
        )
      })}
    </>
  )
}

// Add the SourcesDisplay component definition after the formatContent function
const SourcesDisplay = ({ sources }) => {
  if (!sources || sources.length === 0) return null

  const getSourceIcon = (source) => {
    // Determine source type based on URL or properties
    const sourceType = source.key || (source.url && "url") || "document"

    switch (sourceType.toLowerCase()) {
      case "video":
        return <Video className="w-5 h-5 mr-3 flex-shrink-0" />
      case "image":
        return <ImageIcon className="w-5 h-5 mr-3 flex-shrink-0" />
      case "document":
      case "pdf":
        return <FileText className="w-5 h-5 mr-3 flex-shrink-0" />
      case "url":
      case "link":
        return <Link2 className="w-5 h-5 mr-3 flex-shrink-0" />
      default:
        return <ExternalLink className="w-5 h-5 mr-3 flex-shrink-0" />
    }
  }

  const getSourceLabel = (source) => {
    try {
      // If it's a URL source
      if (source.url) {
        try {
          const url = new URL(source.url)
          return source.title || url.hostname
        } catch (error) {
          return source.title || source.url
        }
      }

      // For sources with key/value format
      if (source.key && source.value) {
        if (source.key === "url" || source.key === "link") {
          const url = new URL(source.value)
          return url.hostname
        }
        return source.key.charAt(0).toUpperCase() + source.key.slice(1) + " Source"
      }

      // Fallback
      return source.title || source.citation || "Source"
    } catch (error) {
      return source.title || source.citation || "Source"
    }
  }

  return (
    <div className="border-gray-200 dark:border-gray-700 pt-1 mb-2">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sources</h3>
      <ul className="space-y-2 p-1">
        {sources.map((source, index) => (
          <li key={source._id || index} className="flex items-center">
            <a
              href={source.url || source.value}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
            >
              {getSourceIcon(source)}
              <span>{getSourceLabel(source)}</span>
            </a>
            {source.citation && (
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">- {source.citation}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ArticlesManagement() {
  const router = useRouter()

  // State for articles and loading
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // State for filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")

  // State for bulk actions
  const [selectedArticles, setSelectedArticles] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // State for dialogs
  const [viewArticle, setViewArticle] = useState(null)
  const [rejectReason, setRejectReason] = useState("")
  const [bulkRejectReason, setBulkRejectReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  // State for stats
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])

  // Fetch articles on component mount
  useEffect(() => {
    fetchArticles()
    fetchStats()
  }, [])

  // Apply filters when filter state changes
  useEffect(() => {
    if (articles.length > 0) {
      applyFilters()
    }
  }, [articles, searchQuery, statusFilter, categoryFilter, sortBy, sortOrder])

  // Toggle select all when changed
  useEffect(() => {
    if (selectAll) {
      setSelectedArticles(filteredArticles.map((article) => article._id))
    } else {
      setSelectedArticles([])
    }
  }, [selectAll, filteredArticles])

  // Fetch all articles
  const fetchArticles = async () => {
    setLoading(true)
    setError(null)

    try {
      // Add a small delay to ensure API is ready
      await new Promise((resolve) => setTimeout(resolve, 500))

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/articles/all`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.status}`)
      }

      const data = await response.json()

      if (!data || !data.articles) {
        throw new Error("Invalid response format")
      }

      setArticles(data.articles)
      setFilteredArticles(data.articles)
    } catch (err) {
      console.error("Error fetching articles:", err)
      setError(`Failed to load articles: ${err.message}. Please try again.`)
      // Set empty arrays to prevent undefined errors
      setArticles([])
      setFilteredArticles([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch article statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/articles/stats`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch article statistics")
      }

      const data = await response.json()
      setStats(data)

      // Extract unique categories
      if (data.categories) {
        setCategories(data.categories.map((cat) => cat._id))
      }
    } catch (err) {
      console.error("Error fetching article statistics:", err)
      // Don't set error state here to avoid blocking the main content
    }
  }

  // Apply filters to articles
  const applyFilters = () => {
    let filtered = [...articles]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (article) =>
          article.title?.toLowerCase().includes(query) ||
          article.content?.toLowerCase().includes(query) ||
          article.authorusername?.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((article) => article.status === statusFilter)
    }

    // Apply category filter
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((article) => article.category === categoryFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || ""
      const bValue = b[sortBy] || ""

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      // Handle date strings
      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        return sortOrder === "asc"
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime()
      }

      return 0
    })

    setFilteredArticles(filtered)
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Invalid date"
    }
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 flex items-center"
          >
            <CheckCircle className="w-3 h-3 mr-1" /> Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 flex items-center"
          >
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        )
      case "on-going":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 flex items-center"
          >
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
            {status || "Unknown"}
          </Badge>
        )
    }
  }

  // Function to extract YouTube ID from URL
  const getYouTubeID = (url) => {
    if (!url) return null

    // Handle different YouTube URL formats
    const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
    const match = url.match(regExp)
    return match ? match[1] : null
  }

  // Function to display media based on type
  const displayMedia = (mediaUrl, mediaType, title) => {
    if (!mediaUrl) return null

    if (mediaType === "image" || mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      return (
        <div className="rounded-md overflow-hidden mb-4 max-w-md mx-auto">
          <Image
            src={mediaUrl || "/placeholder.svg"}
            alt={title || "Article image"}
            className="w-full h-auto object-cover max-h-[300px]"
            width={500}
            height={500}
          />
        </div>
      )
    } else {
      // Check for YouTube URL
      const youtubeID = getYouTubeID(mediaUrl)
      if (youtubeID) {
        return (
          <div className="rounded-md overflow-hidden mb-4 max-w-md mx-auto">
            <iframe
              width="100%"
              height="250"
              src={`https://www.youtube.com/embed/${youtubeID}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )
      }


      // Default to a link if we can't determine the media type
      return (
        <div className="mb-4">
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline flex items-center"
          >
            {mediaUrl}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      )
    }
  }

  // Approve an article
  const approveArticle = async (articleId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/articles/${articleId}/approve`, {
        method: "PATCH",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to approve article")
      }

      // Update local state
      setArticles((prev) =>
        prev.map((article) => (article._id === articleId ? { ...article, status: "approved" } : article)),
      )

      // Refresh stats
      fetchStats()
    } catch (err) {
      console.error("Error approving article:", err)
      setError("Failed to approve article. Please try again.")
    }
  }

  // Reject an article
  const rejectArticle = async (articleId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/articles/${articleId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to reject article")
      }

      // Update local state
      setArticles((prev) =>
        prev.map((article) => (article._id === articleId ? { ...article, status: "rejected" } : article)),
      )

      // Reset and close dialog
      setRejectReason("")
      setShowRejectDialog(false)

      // Refresh stats
      fetchStats()
    } catch (err) {
      console.error("Error rejecting article:", err)
      setError("Failed to reject article. Please try again.")
    }
  }

  // Delete an article
  const deleteArticle = async (articleId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/articles/${articleId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete article")
      }

      // Update local state
      setArticles((prev) => prev.filter((article) => article._id !== articleId))

      // Close dialog
      setShowDeleteDialog(false)

      // Refresh stats
      fetchStats()
    } catch (err) {
      console.error("Error deleting article:", err)
      setError("Failed to delete article. Please try again.")
    }
  }

  // Bulk approve articles
  const bulkApproveArticles = async () => {
    if (selectedArticles.length === 0) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/articles/bulk-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleIds: selectedArticles }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to approve articles")
      }

      // Update local state
      setArticles((prev) =>
        prev.map((article) => (selectedArticles.includes(article._id) ? { ...article, status: "approved" } : article)),
      )

      // Reset selection
      setSelectedArticles([])
      setSelectAll(false)

      // Refresh stats
      fetchStats()
    } catch (err) {
      console.error("Error bulk approving articles:", err)
      setError("Failed to approve articles. Please try again.")
    }
  }

  // Bulk reject articles
  const bulkRejectArticles = async () => {
    if (selectedArticles.length === 0) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/articles/bulk-reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleIds: selectedArticles,
          reason: bulkRejectReason,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to reject articles")
      }

      // Update local state
      setArticles((prev) =>
        prev.map((article) => (selectedArticles.includes(article._id) ? { ...article, status: "rejected" } : article)),
      )

      // Reset and close dialog
      setBulkRejectReason("")
      setShowBulkRejectDialog(false)
      setSelectedArticles([])
      setSelectAll(false)

      // Refresh stats
      fetchStats()
    } catch (err) {
      console.error("Error bulk rejecting articles:", err)
      setError("Failed to reject articles. Please try again.")
    }
  }

  // Bulk delete articles
  const bulkDeleteArticles = async () => {
    if (selectedArticles.length === 0) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/articles/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleIds: selectedArticles }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete articles")
      }

      // Update local state
      setArticles((prev) => prev.filter((article) => !selectedArticles.includes(article._id)))

      // Reset and close dialog
      setShowBulkDeleteDialog(false)
      setSelectedArticles([])
      setSelectAll(false)

      // Refresh stats
      fetchStats()
    } catch (err) {
      console.error("Error bulk deleting articles:", err)
      setError("Failed to delete articles. Please try again.")
    }
  }

  // Get excerpt from content
  const getExcerpt = (content, maxLength = 150) => {
    if (!content) return "No content"
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  // Table columns definition
  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("")
    setCategoryFilter("")
    setSortBy("createdAt")
    setSortOrder("desc")
  }

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox checked={selectAll} onCheckedChange={(value) => setSelectAll(!!value)} aria-label="Select all" />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedArticles.includes(row.original._id)}
            onCheckedChange={(value) => toggleUserSelection(row.original._id)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const article = row.original
          return (
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate max-w-[200px]">{article.title}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "authorusername",
        header: "Author",
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const article = row.original
          return (
            <div className="flex items-center justify-end">
              <Button variant="ghost" size="sm" onClick={() => setViewArticle(article)} className="mr-2">
                View
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {article.status !== "approved" && (
                    <DropdownMenuItem onClick={() => approveArticle(article._id)} className="text-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </DropdownMenuItem>
                  )}
                  {article.status !== "rejected" && (
                    <DropdownMenuItem
                      onClick={() => {
                        setViewArticle(article)
                        setShowRejectDialog(true)
                      }}
                      className="text-red-600"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      setViewArticle(article)
                      setShowDeleteDialog(true)
                    }}
                    className="text-gray-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [selectedArticles, selectAll],
  )

  // Toggle article selection
  const toggleUserSelection = (articleId) => {
    setSelectedArticles((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId],
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Article Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage, approve, reject, and delete articles</p>
        </div>

        <Button variant="outline" onClick={fetchArticles} className="flex items-center gap-1">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Total Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{stats["on-going"] || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats["approved"] || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{stats["rejected"] || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">Filter and search articles</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="on-going">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="updatedAt">Date Updated</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="authorusername">Author</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                <ChevronDown className={`h-4 w-4 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
              </Button>

              <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto text-sm text-gray-500">
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedArticles.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedArticles.length} articles selected</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setSelectedArticles([])}>
                  Clear Selection
                </Button>

                <Button
                  variant="default"
                  onClick={bulkApproveArticles}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Selected
                </Button>

                <Button
                  variant="default"
                  onClick={() => setShowBulkRejectDialog(true)}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Selected
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Articles</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filteredArticles.length} articles found</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-8 text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mb-2 opacity-20" />
              <p>No articles found</p>
              <Button variant="link" onClick={resetFilters} className="mt-2 text-primary">
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.id || column.accessorKey}>
                        {column.header
                          ? typeof column.header === "function"
                            ? column.header({ table: {} })
                            : column.header
                          : column.accessorKey}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article._id}>
                      {columns.map((column) => (
                        <TableCell key={column.id || column.accessorKey}>
                          {column.cell ? column.cell({ row: { original: article } }) : article[column.accessorKey]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Article Dialog */}
      {viewArticle && (
        <Dialog
          open={!!viewArticle && !showRejectDialog && !showDeleteDialog}
          onOpenChange={(open) => !open && setViewArticle(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewArticle.title}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className="capitalize">
                {viewArticle.category}
              </Badge>
              {getStatusBadge(viewArticle.status)}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                By @{viewArticle.authorusername} • {formatDate(viewArticle.createdAt)}
              </span>
            </div>

            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-3">
                {/* Trust Rating */}
                {viewArticle.rating !== undefined && (
                  <div className="mb-3 p-2 rounded-md border w-fit flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{viewArticle.rating?.toFixed(2)}%</span>
                  </div>
                )}

                {/* Media */}
                {viewArticle.mediaUrl && displayMedia(viewArticle.mediaUrl, viewArticle.mediaType, viewArticle.title)}

                {/* Content */}
                <div className="prose prose-sm max-w-none dark:prose-invert">{formatContent(viewArticle.content)}</div>

                {/* Sources */}
                {viewArticle.sources && viewArticle.sources.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <SourcesDisplay sources={viewArticle.sources} />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="details">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                    <div className="mt-1">
                      {viewArticle.description ? (
                        <div className="text-sm">{processInlineFormatting(viewArticle.description)}</div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No description provided</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Media</h3>
                    <div className="mt-1">
                      {viewArticle.mediaUrl ? (
                        <div>
                          <p className="text-sm mb-2">
                            <span className="font-medium">Type:</span> {viewArticle.mediaType || "Unknown"}
                          </p>
                          <a
                            href={viewArticle.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center text-sm"
                          >
                            {viewArticle.mediaUrl}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No media URL provided</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Preview Article</h3>
                    <div className="mt-1 space-y-2">
                      <a
                        href={`http://localhost:3000/post/${viewArticle._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View on frontend (localhost:3000)</span>
                      </a>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="block">Preview link: </span>
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono break-all">
                          http://localhost:3000/post/{viewArticle._id}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Sources Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Sources</h3>
                    {viewArticle.sources && viewArticle.sources.length > 0 ? (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <SourcesDisplay sources={viewArticle.sources} />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No sources provided</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Author</h3>
                      <p>{viewArticle.authorusername}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</h3>
                      <p className="capitalize">{viewArticle.category}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
                      <p>{formatDate(viewArticle.createdAt)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h3>
                      <p>{formatDate(viewArticle.updatedAt)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                      <p>{getStatusBadge(viewArticle.status)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Votes</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <ChevronUp className="h-5 w-5 text-green-500" />
                          <span className="font-medium">{viewArticle.upvotes?.length || 0} Upvotes</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <ChevronDown className="h-5 w-5 text-red-500" />
                          <span className="font-medium">{viewArticle.downvotes?.length || 0} Downvotes</span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">{viewArticle.comments?.length || 0} Comments</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-5 w-5 text-purple-500" />
                          <span className="font-medium">{viewArticle.views || 0} Views</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <div className="flex items-center gap-2">
                {viewArticle.status !== "approved" && (
                  <Button
                    onClick={() => {
                      approveArticle(viewArticle._id)
                      setViewArticle(null)
                    }}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                )}

                {viewArticle.status !== "rejected" && (
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    className="bg-red-600 hover:bg-red-700 flex items-center gap-1"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Article Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Article</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this article. This information will be stored for reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Article: {viewArticle?.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">By {viewArticle?.authorusername}</p>
            </div>

            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => viewArticle && rejectArticle(viewArticle._id)}
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50"
            >
              Reject Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Article Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will delete the article {viewArticle?.title}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => viewArticle && deleteArticle(viewArticle._id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Multiple Articles</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedArticles.length} articles. This information will be stored for
              reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={bulkRejectArticles}
              disabled={!bulkRejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50"
            >
              Reject {selectedArticles.length} Articles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will delete {selectedArticles.length} articles. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={bulkDeleteArticles}>
              Delete {selectedArticles.length} Articles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
