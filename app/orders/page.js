"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format } from "date-fns"
import {
  CalendarIcon,
  Globe,
  SearchIcon,
  Info ,
  FilterIcon,
  RefreshCwIcon,
  PackageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  SlidersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/auth-context"
import { useFilters, useSheetData, useApp } from "@/contexts/app-context"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function OrdersDashboard() {
  // State management
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const isMobile = useMobile()
  const { token, user } = useAuth()
  const { filters, updateFilter, resetFilters } = useFilters()
  const { sheetData: orders, loadingSheetData: loading, errorSheetData: error, refreshSheetData } = useSheetData()
  const { formatCurrency, getCountryRate } = useApp()
  const [visibleColumns, setVisibleColumns] = useState({
    "Order date": true,
    "Order ID": true,
    "sku number": true,
    "Cod Amount": true,
    Quantity: true,
    City: true,
    "Country": true,
    "Source Traffic": true,
    STATUS: true,
    Agent: true,
  })

  // Filter states
  const [statusFilter, setStatusFilter] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [sortField, setSortField] = useState("Order date")
  const [sortDirection, setSortDirection] = useState("desc")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Sheet URL check and card
  if (!user?.sheetUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md p-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">No Sheet URL Configured</CardTitle>
            <CardDescription className="text-center">
              Please configure your Google Sheet URL to view your orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/profile?tab=sheet">
                Configure Sheet URL
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dynamically extract unique Source Traffic options from orders
  const sourceTrafficOptions = useMemo(() => {
    if (!orders.length) return []
    return [
      ...new Set(
        orders
          .map((order) => order["Source Traffic"])
          .filter(Boolean)
      ),
    ].sort()
  }, [orders])

  // Fetch data if not already loaded
  useEffect(() => {
    if (token && !orders.length) {
      refreshSheetData(token)
    }
  }, [token, orders.length, refreshSheetData])

  // Memoized derivations
  const countries = useMemo(() => {
    if (!orders.length) return []
    const uniqueCountries = [...new Set(orders.map((order) => order["Country"]).filter(Boolean))]
    return uniqueCountries.sort()
  }, [orders])

  const statuses = useMemo(() => {
    if (!orders.length) return []
    const uniqueStatuses = [...new Set(orders.map((order) => order["STATUS"]).filter(Boolean))]
    return uniqueStatuses.sort()
  }, [orders])

  const cities = useMemo(() => {
    if (!orders.length) return []
    const cityCounts = orders.reduce((acc, order) => {
      const city = order["City"]
      if (city) {
        acc[city] = (acc[city] || 0) + 1
      }
      return acc
    }, {})
    return Object.entries(cityCounts)
      .sort(([, countA], [, countB]) => countB - countA) // Sort by count descending
      .map(([city, count]) => ({ city, count })) // Return city and count as objects
  }, [orders])

  // Memoized unique products (SKU numbers)
  const products = useMemo(() => {
    if (!orders.length) return []
    const uniqueProducts = [...new Set(orders.map((order) => order["sku number"]).filter(Boolean))]
    return uniqueProducts.sort()
  }, [orders])

  // Memoized unique agents
  const agents = useMemo(() => {
    if (!orders.length) return []
    const uniqueAgents = [...new Set(orders.map((order) => order["Agent"]).filter(Boolean))]
    return uniqueAgents.sort()
  }, [orders])

  // Filter orders based on current criteria
  const filteredOrders = useMemo(() => {
    if (!orders.length) return []

    return orders
      .filter((order) => {
        const matchesProduct = !filters.product || order["sku number"] === filters.product
        const matchesStatus = !filters.status || order["STATUS"] === filters.status
        const matchesCountry = !filters.country || order["Country"] === filters.country
        const matchesCity = !filters.city || order["City"] === filters.city
        const matchesSource = !filters.source || order["Source Traffic"] === filters.source
        const matchesAgent = !filters.agent || order["Agent"] === filters.agent

        let matchesDateRange = true
        if (filters.startDate || filters.endDate) {
          const orderDate = new Date(order["Order date"])
          if (filters.startDate && orderDate < new Date(filters.startDate)) {
            matchesDateRange = false
          }
          if (filters.endDate) {
            const endDatePlusOne = new Date(filters.endDate)
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1)
            if (orderDate >= endDatePlusOne) {
              matchesDateRange = false
            }
          }
        }

        return (
          matchesProduct &&
          matchesStatus &&
          matchesCountry &&
          matchesCity &&
          matchesSource &&
          matchesAgent &&
          matchesDateRange
        )
      })
      .sort((a, b) => {
        const fieldA = a[sortField]
        const fieldB = b[sortField]

        // Handle numeric comparison
        if (typeof fieldA === "number" && typeof fieldB === "number") {
          return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA
        }

        // Handle empty values
        if (!fieldA && !fieldB) return 0
        if (!fieldA) return sortDirection === "asc" ? -1 : 1
        if (!fieldB) return sortDirection === "asc" ? 1 : -1

        // Handle string comparison
        if (sortDirection === "asc") {
          return String(fieldA).localeCompare(String(fieldB))
        } else {
          return String(fieldB).localeCompare(String(fieldA))
        }
      })
  }, [
    orders,
    filters.product,
    filters.status,
    filters.country,
    filters.city,
    filters.source,
    filters.agent, // <-- add this dependency
    filters.startDate,
    filters.endDate,
    sortField,
    sortDirection,
  ])

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredOrders, currentPage, itemsPerPage])

  // Order statistics
  const orderStats = useMemo(() => {
    if (!filteredOrders.length) return { totalAmount: 0, totalQuantity: 0, statusCounts: {} }

    // Only include delivered orders for revenue calculation
    const totalAmount = filteredOrders.reduce((sum, order) => {
      if (order["STATUS"] === "Delivered") {
        const amount = Number.parseFloat(order["Cod Amount"]) || 0
        return sum + amount
      }
      return sum
    }, 0)

    const totalQuantity = filteredOrders.reduce((sum, order) => {
      const qty = Number.parseFloat(order["Quantity"]) || 0
      return sum + qty
    }, 0)

    const statusCounts = filteredOrders.reduce((acc, order) => {
      const status = order["STATUS"] || "Unknown"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    return {
      totalAmount,
      totalQuantity,
      statusCounts,
    }
  }, [filteredOrders])

  // Callbacks
  const resetLocalFilters = useCallback(() => {
    setStatusFilter("")
    setCountryFilter("")
    setCityFilter("")
    setStartDate(null)
    setEndDate(null)
    setCurrentPage(1)
  }, [])

  const handleSort = useCallback(
    (field) => {
      const isSameField = field === sortField
      setSortField(field)
      setSortDirection(isSameField ? (sortDirection === "asc" ? "desc" : "asc") : "asc")
    },
    [sortField, sortDirection],
  )

  const goToPage = useCallback((page) => {
    setCurrentPage(page)
    if (typeof window !== "undefined") {
      const tableElement = document.querySelector("#orders-table")
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }, [])

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }, [currentPage, goToPage])

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }, [currentPage, totalPages, goToPage])

  const refreshData = useCallback(async () => {
    if (token) {
      await refreshSheetData(token)
    }
  }, [token, refreshSheetData])

  const viewOrderDetails = useCallback((order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }, [])

  const handleStatusFilterChange = (value) => {
    updateFilter("status", value)
  }

  const handleCountryFilterChange = (value) => {
    updateFilter("country", value)
  }

  const handleCityFilterChange = (value) => {
    updateFilter("city", value)
  }

  // Use the context resetFilters for clearing all filters
  const handleResetFilters = useCallback(() => {
    resetFilters()
    setCurrentPage(1)
  }, [resetFilters])

  // Date range handler
  const handleDateRangeChange = (from, to) => {
    updateFilter("startDate", from ? from.toISOString() : null)
    updateFilter("endDate", to ? to.toISOString() : null)
  }

  // UI Helper Functions
  const getStatusBadge = useCallback((status) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>

    switch (status) {
      case "Delivered":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Delivered</Badge>
      case "Cancelled":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Cancelled</Badge>
      case "Returned":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Returned</Badge>
      case "Processing":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Processing</Badge>
      case "Shipped":
        return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">Shipped</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }, [])

  // Remove conversion from formatOrderCurrency
  const formatOrderCurrency = useCallback(
    (amount /*, country*/) => {
      if (amount === undefined || amount === null || amount === "") return "—"
      // No conversion, just show the raw amount as USD
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    },
    [],
  )

  // Pagination rendering
  const renderPaginationButtons = useCallback(() => {
    const buttons = []
    const maxButtonsToShow = isMobile ? 3 : 5

    // Always show the first page
    buttons.push(
      <Button
        key="page-1"
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => goToPage(1)}
        className="h-8 w-8 p-0"
        aria-label="Go to first page"
      >
        1
      </Button>,
    )

    // Calculate range of pages to show
    const startPage = Math.max(2, currentPage - Math.floor(maxButtonsToShow / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxButtonsToShow - 2)

    if (startPage > 2) {
      buttons.push(
        <span key="ellipsis-1" className="px-2" aria-hidden="true">
          …
        </span>,
      )
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={`page-${i}`}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(i)}
          className="h-8 w-8 p-0"
          aria-label={`Go to page ${i}`}
          aria-current={currentPage === i ? "page" : undefined}
        >
          {i}
        </Button>,
      )
    }

    if (endPage < totalPages - 1) {
      buttons.push(
        <span key="ellipsis-2" className="px-2" aria-hidden="true">
          …
        </span>,
      )
    }

    if (totalPages > 1) {
      buttons.push(
        <Button
          key={`page-${totalPages}`}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(totalPages)}
          className="h-8 w-8 p-0"
          aria-label="Go to last page"
        >
          {totalPages}
        </Button>,
      )
    }

    return buttons
  }, [currentPage, goToPage, isMobile, totalPages])

  // Loading placeholder table
  const renderSkeletonRows = useCallback(() => {
    return Array(5)
      .fill(null)
      .map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-16 ml-auto" />
          </TableCell>
          <TableCell className="text-center">
            <Skeleton className="h-4 w-8 mx-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
        </TableRow>
      ))
  }, [])

  // Error handling UI
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-red-600">Error Loading Data</h2>
            <p className="text-sm text-muted-foreground">We couldn&apos;t load your orders data. Please try again.</p>
          </div>
          <div className="mb-4 text-sm text-muted-foreground">{error}</div>
          <Button className="w-full" onClick={() => window.location.reload()}>
            <RefreshCwIcon className="mr-1 h-4 w-4" /> Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="p-2 md:p-6">
      <div className="w-full mb-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-5">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Orders Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage and track all your orders in one place</p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={loading}
                    className="hidden md:flex h-9"
                  >
                    <RefreshCwIcon className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh order data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Badge variant="outline" className="text-xs sm:text-sm bg-green-600 text-white p-1 px-3">
              {filteredOrders.length} orders
            </Badge>


            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SlidersIcon className="mr-1 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-full sm:w-56 max-h-[80vh] overflow-y-auto">
                <div className="p-2">
                  <h4 className="font-medium text-sm mb-2">Toggle Columns</h4>
                  <div className="space-y-2">
                    {Object.keys(visibleColumns).map((column) => (
                      <div key={column} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`column-${column}`}
                          checked={visibleColumns[column]}
                          onChange={() =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [column]: !prev[column],
                            }))
                          }
                          className="mr-1"
                        />
                        <label htmlFor={`column-${column}`} className="text-xs sm:text-sm">
                          {column}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-between border-t items-center p-2 mb-1">
          <h2 className="text-md font-medium flex items-center">
            <FilterIcon className="mr-2 h-5 w-5 text-mainColor" />
            Filters
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8" onClick={() => setShowFilters((prev) => !prev)}>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-8"
                    onClick={() => setSortDirection((prevDirection) => (prevDirection === "asc" ? "desc" : "asc"))}
                    aria-label={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}
                  >
                    {sortDirection === "asc" ? (
                      <ArrowUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle sort direction: {sortDirection === "asc" ? "Ascending" : "Descending"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div
          className={`mb-3 md:mb-4 w-full transition-all duration-300 ${
            showFilters ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-[100vw] lg:grid-cols-4 p-1 gap-3">
              {/* Product filter */}
              <div className="relative">
                <label htmlFor="product-filter" className="text-sm font-medium mb-1 flex items-center">
                  <PackageIcon className="h-4 w-4 mr-1 text-yellow-500" /> Product
                </label>
                <Select
                  value={filters.product || "all"}
                  onValueChange={(value) => updateFilter("product", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full h-10 dark:bg-black">
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status filter */}
              <div className="relative">
                <label htmlFor="status-filter" className="text-sm font-medium mb-1 flex items-center">
                  <Info className="h-4 w-4 mr-1 text-blue-500" /> Status
                </label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => updateFilter("status", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full h-10 dark:bg-black">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Country filter */}
              <div className="relative">
                <label htmlFor="country-filter" className="text-sm font-medium mb-1 flex items-center">
                  <Globe className="h-4 w-4 mr-1 text-green-600" /> Country
                </label>
                <Select
                  value={filters.country || "all"}
                  onValueChange={(value) => updateFilter("country", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full h-10 dark:bg-black">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City filter */}
              <div className="relative">
                <label htmlFor="city-filter" className="text-sm font-medium mb-1 flex items-center">
                  <SearchIcon className="h-4 w-4 mr-1 text-blue-600" /> City
                </label>
                <Select
                  value={filters.city || "all"}
                  onValueChange={(value) => updateFilter("city", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full h-10 dark:bg-black">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map(({ city, count }) => (
                      <SelectItem key={city} value={city}>
                        {city} ({count} orders)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source Traffic filter */}
              <div className="relative">
                <label htmlFor="source-filter" className="text-sm font-medium mb-1 flex items-center">
                  <FilterIcon className="h-4 w-4 mr-1 text-purple-500" /> Source Traffic
                </label>
                <Select
                  value={filters.source || "all"}
                  onValueChange={(value) => updateFilter("source", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full h-10 dark:bg-black">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {sourceTrafficOptions.map((src) => (
                      <SelectItem key={src} value={src}>
                        {src}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agent filter */}
              <div className="relative">
                <label htmlFor="agent-filter" className="text-sm font-medium mb-1 flex items-center">
                  <Info className="h-4 w-4 mr-1 text-orange-500" /> Agent
                </label>
                <Select
                  value={filters.agent || "all"}
                  onValueChange={(value) => updateFilter("agent", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full h-10 dark:bg-black">
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent} value={agent}>
                        {agent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date range */}
              <div className="relative">
                <label className="text-sm font-medium mb-1 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-red-500" /> Date Range
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4 text-red-500" />
                      {filters.startDate || filters.endDate ? (
                        <>
                          {filters.startDate ? format(new Date(filters.startDate), "PP") : "Start"} -{" "}
                          {filters.endDate ? format(new Date(filters.endDate), "PP") : "End"}
                        </>
                      ) : (
                        "Select date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: filters.startDate ? new Date(filters.startDate) : undefined,
                        to: filters.endDate ? new Date(filters.endDate) : undefined,
                      }}
                      onSelect={(range) => {
                        handleDateRangeChange(range?.from, range?.to)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Reset filters button */}
              <div className="col-span-full">
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="w-full sm:w-auto">
                  <XCircleIcon className="mr-1 text-mainColor h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div
        id="orders-table"
        className="flex bg-white border m-auto max-h-[500px] md:max-w-[75vw] dark:bg-zinc-900 rounded-md overflow-auto shadow-sm"
      >
        <Table>
          <TableHeader className="bg-zinc-100 w-full sticky top-0 z-20 dark:bg-zinc-950">
            <TableRow>
              {visibleColumns["Order date"] && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("Order date")}
                  role="columnheader"
                  aria-sort={sortField === "Order date" ? sortDirection : "none"}
                >
                  <div className="flex justify-center items-center">
                    <span className={sortField === "Order date" ? "text-green-600 font-medium" : ""}>Date</span>
                    {sortField === "Order date" &&
                      (sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
              )}
              {visibleColumns["Order ID"] && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("Order ID")}
                  role="columnheader"
                  aria-sort={sortField === "Order ID" ? sortDirection : "none"}
                >
                  <div className="flex justify-center items-center">
                    <span className={sortField === "Order ID" ? "text-green-600 font-medium" : ""}>Order ID</span>
                    {sortField === "Order ID" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
              {visibleColumns["sku number"] && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("sku number")}
                  role="columnheader"
                  aria-sort={sortField === "sku number" ? sortDirection : "none"}
                >
                  <div className="flex justify-center items-center">
                    <span className={sortField === "sku number" ? "text-green-600 font-medium" : ""}>SKU</span>
                    {sortField === "sku number" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
              {visibleColumns["Cod Amount"] && (
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => handleSort("Cod Amount")}
                  role="columnheader"
                  aria-sort={sortField === "Cod Amount" ? sortDirection : "none"}
                >
                  <div className="flex justify-center items-center">
                    <span className={sortField === "Cod Amount" ? "text-green-600 font-medium" : ""}>Amount</span>
                    {sortField === "Cod Amount" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
              {visibleColumns["Quantity"] && (
                <TableHead
                  className="cursor-pointer select-none text-center"
                  onClick={() => handleSort("Quantity")}
                  role="columnheader"
                  aria-sort={sortField === "Quantity" ? sortDirection : "none"}
                >
                  <div className="flex justify-center items-center">
                    <span className={sortField === "Quantity" ? "text-green-600 font-medium" : ""}>Qty</span>
                    {sortField === "Quantity" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
              {visibleColumns["City"] && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("City")}
                  role="columnheader"
                  aria-sort={sortField === "City" ? sortDirection : "none"}
                >
                  <div className="flex justify-center items-center">
                    <span className={sortField === "City" ? "text-green-600 font-medium" : ""}>City</span>
                    {sortField === "City" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
              {visibleColumns["Country"] && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("Country")}
                  role="columnheader"
                  aria-sort={sortField === "Country" ? sortDirection : "none"}
                >
                  <div className="flex justify-center items-center">
                    <span className={sortField === "Country" ? "text-green-600 font-medium" : ""}>Country</span>
                    {sortField === "Country" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
              {visibleColumns["Source Traffic"] && (
                <TableHead
                  className="cursor-pointer text-center select-none"
                  onClick={() => handleSort("Source Traffic")}
                  role="columnheader"
                  aria-sort={sortField === "Source Traffic" ? sortDirection : "none"}
                >
                  <div className="flex justify-center items-center">
                    <span className={sortField === "Source Traffic" ? "text-green-600 font-medium" : ""}>
                      Source Traffic
                    </span>
                    {sortField === "Source Traffic" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
              {visibleColumns["STATUS"] && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("STATUS")}
                  role="columnheader"
                  aria-sort={sortField === "STATUS" ? sortDirection : "none"}
                >
                  <div className="flex justify-center items-center">
                    <span className={sortField === "STATUS" ? "text-green-600 font-medium" : ""}>Status</span>
                    {sortField === "STATUS" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
              {visibleColumns["Agent"] && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("Agent")}
                  role="columnheader"
                  aria-sort={sortField === "Agent" ? sortDirection : "none"}
                >
                  <div className="flex justify-center items-center">
                    <span className={sortField === "Agent" ? "text-green-600 font-medium" : ""}>Agent</span>
                    {sortField === "Agent" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              renderSkeletonRows()
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-8">
                    <PackageIcon className="h-12 w-12 mb-4 opacity-40" />
                    <p className="text-lg font-medium mb-1">No orders found</p>
                    <p className="text-sm max-w-sm text-center">
                      {filters.status || filters.country || filters.startDate || filters.endDate || filters.city || filters.source
                        ? "Try adjusting your filters to see more results."
                        : "There are no orders to display. Try refreshing or check back later."}
                    </p>
                    {(filters.status || filters.country || filters.startDate || filters.endDate || filters.city || filters.source) && (
                      <Button variant="outline" className="mt-3" onClick={handleResetFilters}>
                        <XCircleIcon className="mr-1 h-4 w-4" />
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order, index) => (
                <TableRow
                  key={`${order["Order ID"]}-${index}`}
                  className="hover:bg-muted/50 cursor-pointer "
                  onClick={() => viewOrderDetails(order)}
                >
                  {visibleColumns["Order date"] && (
                    <TableCell className="text-center font-medium">{order["Order date"]}</TableCell>
                  )}
                  {visibleColumns["Order ID"] && <TableCell className="text-center">{order["Order ID"]}</TableCell>}
                  {visibleColumns["sku number"] && (
                    <TableCell className="text-center">
                      <div className="max-w-[150px] truncate" title={order["sku number"] || "N/A"}>
                        {order["sku number"] || "N/A"}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns["Cod Amount"] && (
                    <TableCell className="text-center">
                      {formatOrderCurrency(order["Cod Amount"], order["Country"])}
                    </TableCell>
                  )}
                  {visibleColumns["Quantity"] && (
                    <TableCell className="text-center">{order["Quantity"] || "N/A"}</TableCell>
                  )}
                  {visibleColumns["City"] && (
                    <TableCell className="text-center">
                      <div className="max-w-[120px] truncate" title={order["City"]}>
                        {order["City"]}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns["Country"] && (
                    <TableCell className="text-center">{order["Country"]}</TableCell>
                  )}
                  {visibleColumns["Source Traffic"] && (
                    <TableCell className="text-center">
                      {order["Source Traffic"] || "—"}
                    </TableCell>
                  )}
                  {visibleColumns["STATUS"] && (
                    <TableCell className="text-center">{getStatusBadge(order["STATUS"])}</TableCell>
                  )}
                  {visibleColumns["Agent"] && (
                    <TableCell className="text-center">
                      {order["Agent"] || "—"}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1} className="h-8">
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="hidden sm:flex gap-1">{renderPaginationButtons()}</div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="h-8"
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[130px] h-8 border dark:bg-black text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Complete information about order #{selectedOrder?.["Order ID"]}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4 py-4">
              {Object.entries(selectedOrder).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 items-center gap-4">
                  <div className="text-sm font-medium">{key}</div>
                  <div className="col-span-2 text-sm">
                    {key === "STATUS"
                      ? getStatusBadge(value)
                      : key === "Cod Amount"
                        ? formatOrderCurrency(value, selectedOrder["Country"])
                        : value || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowOrderDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
