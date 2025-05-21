"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Loader2,
  RefreshCwIcon,
  DownloadIcon,
  FilterIcon,
  CalendarIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { useStatusConfig, useFilters, useSheetData } from "@/contexts/app-context"
import { useAuth } from "@/contexts/auth-context"
import { matchesStatus } from "@/lib/status-config"
import { fetchMySheetData } from "@/lib/api-client"

export default function ProductStatsPage() {
  const [showFilters, setShowFilters] = useState(false)
  const isMobile = useMobile()
  const { token } = useAuth()
  const { statusConfig } = useStatusConfig()
  const { filters, updateFilter, resetFilters } = useFilters()
  const { sheetData: orders, loadingSheetData: loading, errorSheetData: error, refreshSheetData } = useSheetData()

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [sortField, setSortField] = useState("totalLeads")
  const [sortDirection, setSortDirection] = useState("desc")

  // Effect to show filters when any filter is active
  useEffect(() => {
    const hasActiveFilters = filters.city || filters.product || filters.startDate || filters.endDate
    setShowFilters(hasActiveFilters)
  }, [filters])

  // Fetch data if not already loaded
  useEffect(() => {
    if (token && !orders.length) {
      refreshSheetData(token)
    }
  }, [token, orders.length, refreshSheetData])

  // Extract unique products (SKU numbers)
  const products = useMemo(() => {
    if (!orders.length) return []
    const uniqueProducts = [...new Set(orders.map((order) => order["sku number"]).filter(Boolean))]
    return uniqueProducts.sort()
  }, [orders])

  // Extract unique cities from orders
  const cities = useMemo(() => {
    if (!orders.length) return []
    const uniqueCities = [...new Set(orders.map((order) => order["City"]).filter(Boolean))]
    return uniqueCities.sort()
  }, [orders])

  // Apply filters to the data
  const filteredOrders = useMemo(() => {
    if (!orders.length) return []

    return orders.filter((order) => {
      // City filter
      if (filters.city && order["City"]?.toLowerCase() !== filters.city.toLowerCase()) {
        return false
      }

      // Product filter
      if (filters.product && order["sku number"] !== filters.product) {
        return false
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const orderDate = new Date(order["Order date"])
        if (filters.startDate && orderDate < new Date(filters.startDate)) {
          return false
        }
        if (filters.endDate) {
          const endDatePlusOne = new Date(filters.endDate)
          endDatePlusOne.setDate(endDatePlusOne.getDate() + 1)
          if (orderDate >= endDatePlusOne) {
            return false
          }
        }
      }

      return true
    })
  }, [orders, filters])

  // Reset filters
  const handleResetFilters = useCallback(() => {
    resetFilters()
  }, [resetFilters])

  // Helper function to extract price from an order
  const extractPrice = useCallback((order) => {
    // Check for price in various possible field names
    const priceFields = ["Cod Amount", "Order Value", "Price", "Total", "Amount", "Value", "Revenue"]

    for (const field of priceFields) {
      const value = order[field]
      if (value !== undefined && value !== null && value !== "") {
        // Convert to number if it's a string
        if (typeof value === "number") {
          return value
        } else if (typeof value === "string") {
          // Remove currency symbols, commas, and other non-numeric characters except decimal point
          const cleanedValue = value.replace(/[^0-9.]/g, "")
          const numValue = Number.parseFloat(cleanedValue)
          if (!isNaN(numValue)) {
            return numValue
          }
        }
      }
    }

    // Return 0 if no price found
    return 0
  }, [])

  // Calculate statistics for each product using the configurable status definitions
  const productStats = useMemo(() => {
    if (!filteredOrders.length) return []

    // Group orders by product
    const productGroups = {}

    filteredOrders.forEach((order) => {
      const product = order["sku number"]
      if (!product) return

      if (!productGroups[product]) {
        productGroups[product] = {
          allOrders: [],
          deliveredOrders: [],
        }
      }

      // Add to all orders
      productGroups[product].allOrders.push(order)

      // Check if order is delivered
      const status = order["STATUS"]
      if (status && matchesStatus(status, statusConfig.delivery)) {
        // Extract price
        const price = extractPrice(order)

        // Add to delivered orders with price
        productGroups[product].deliveredOrders.push({
          ...order,
          extractedPrice: price,
        })
      }
    })

    // Calculate stats for each product
    return Object.entries(productGroups)
      .map(([product, data]) => {
        const allOrders = data.allOrders
        const deliveredOrders = data.deliveredOrders

        // Basic counts
        const totalLeads = allOrders.length
        const confirmed = allOrders.filter(
          (order) => order["STATUS"] && matchesStatus(order["STATUS"], statusConfig.confirmation),
        ).length
        const delivered = deliveredOrders.length
        const returned = allOrders.filter(
          (order) => order["STATUS"] && matchesStatus(order["STATUS"], statusConfig.returned),
        ).length
        const inProcess = allOrders.filter(
          (order) => order["STATUS"] && matchesStatus(order["STATUS"], statusConfig.inProcess),
        ).length

        // Calculate percentages
        const confirmationPercent = totalLeads > 0 ? (confirmed / totalLeads) * 100 : 0
        const deliveryPercent = confirmed > 0 ? (delivered / confirmed) * 100 : 0
        const returnedPercent = confirmed > 0 ? (returned / confirmed) * 100 : 0
        const inProcessPercent = totalLeads > 0 ? (inProcess / totalLeads) * 100 : 0

        // Calculate AOV
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.extractedPrice || 0), 0);
        const aov = delivered > 0 ? totalRevenue / delivered : 0;

        // Calculate average quantity per order
        const totalQuantity = allOrders.reduce((sum, order) => sum + Number(order["Quantity"] || 1), 0)
        const avgQuantityPerOrder = totalLeads > 0 ? totalQuantity / totalLeads : 0

        return {
          product,
          totalLeads,
          confirmed,
          delivery: delivered,
          confirmationPercent: Number.parseFloat(confirmationPercent.toFixed(2)),
          deliveryPercent: Number.parseFloat(deliveryPercent.toFixed(2)),
          returned,
          returnedPercent: Number.parseFloat(returnedPercent.toFixed(2)),
          inProcess,
          inProcessPercent: Number.parseFloat(inProcessPercent.toFixed(2)),
          avgQuantityPerOrder: Number.parseFloat(avgQuantityPerOrder.toFixed(2)),
          totalRevenue,
          aov: Number.parseFloat(aov.toFixed(2)),
        }
      })
      .sort((a, b) => {
        // Sort based on the selected field and direction
        const fieldA = a[sortField]
        const fieldB = b[sortField]

        if (sortDirection === "asc") {
          return fieldA - fieldB
        } else {
          return fieldB - fieldA
        }
      })
  }, [filteredOrders, statusConfig, extractPrice, sortField, sortDirection])

  // Calculate totals
  const totals = useMemo(() => {
    if (!productStats.length)
      return {
        totalLeads: 0,
        confirmed: 0,
        confirmationPercent: 0,
        delivery: 0,
        deliveryPercent: 0,
        returned: 0,
        returnedPercent: 0,
        inProcess: 0,
        inProcessPercent: 0,
        totalRevenue: 0,
        aov: 0,
      }

    const totalLeads = productStats.reduce((sum, item) => sum + item.totalLeads, 0)
    const confirmed = productStats.reduce((sum, item) => sum + item.confirmed, 0)
    const delivery = productStats.reduce((sum, item) => sum + item.delivery, 0)
    const returned = productStats.reduce((sum, item) => sum + item.returned, 0)
    const inProcess = productStats.reduce((sum, item) => sum + item.inProcess, 0)
    const totalRevenue = productStats.reduce((sum, item) => sum + item.totalRevenue, 0)

    const confirmationPercent = totalLeads > 0 ? (confirmed / totalLeads) * 100 : 0
    const deliveryPercent = confirmed > 0 ? (delivery / confirmed) * 100 : 0
    const returnedPercent = confirmed > 0 ? (returned / confirmed) * 100 : 0
    const inProcessPercent = totalLeads > 0 ? (inProcess / totalLeads) * 100 : 0
    const aov = delivery > 0 ? totalRevenue / delivery : 0

    return {
      totalLeads,
      confirmed,
      confirmationPercent: Number.parseFloat(confirmationPercent.toFixed(2)),
      delivery,
      deliveryPercent: Number.parseFloat(deliveryPercent.toFixed(2)),
      returned,
      returnedPercent: Number.parseFloat(returnedPercent.toFixed(2)),
      inProcess,
      inProcessPercent: Number.parseFloat(inProcessPercent.toFixed(2)),
      totalRevenue,
      aov: Number.parseFloat(aov.toFixed(2)),
    }
  }, [productStats])

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Handle export
  const handleExport = () => {
    if (!productStats.length) return

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Add headers
    csvContent +=
      "Product,Total Leads,Confirmed,Delivery,Confirmation %,Delivery %,Returned,Returned %,In Process,In Process %,Avg Qty/Order,AOV\n"

    // Add total row
    const avgQuantityPerOrderTotal = productStats.length
      ? (productStats.reduce((sum, item) => sum + item.avgQuantityPerOrder, 0) / productStats.length).toFixed(2)
      : "0"
    csvContent += `TOTAL,${totals.totalLeads},${totals.confirmed},${totals.delivery},${totals.confirmationPercent}%,${totals.deliveryPercent}%,${totals.returned},${totals.returnedPercent}%,${totals.inProcess},${totals.inProcessPercent}%,${avgQuantityPerOrderTotal},${totals.aov.toFixed(2)}\n`

    // Add product rows
    productStats.forEach((item) => {
      csvContent += `"${item.product}",${item.totalLeads},${item.confirmed},${item.delivery},${item.confirmationPercent}%,${item.deliveryPercent}%,${item.returned},${item.returnedPercent}%,${item.inProcess},${item.inProcessPercent}%,${item.avgQuantityPerOrder},${item.aov.toFixed(2)}\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `product-stats-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)

    // Trigger download
    link.click()
    document.body.removeChild(link)
  }

  // Calculate pagination
  const indexOfLastItem = currentPage * rowsPerPage
  const indexOfFirstItem = indexOfLastItem - rowsPerPage
  const currentItems = productStats.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(productStats.length / rowsPerPage)

  // Handle page changes
  const handlePageChange = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)))
  }

  const refreshData = useCallback(async () => {
    if (token) {
      await refreshSheetData(token)
    }
  }, [token, refreshSheetData])

  // Render loading state
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
         </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">Product Statistics</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCwIcon className="mr-1 h-4 w-4" /> Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-2 md:p-4 w-full max-w-[100vw]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Statistics</h1>
          <p className="text-muted-foreground mt-1">
            Analyzing {totals.totalLeads} orders across {productStats.length} products
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setShowFilters((prev) => !prev)}>
            <FilterIcon className="mr-1 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport} disabled={!productStats.length}>
            <DownloadIcon className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card className="mb-6 shadow-sm dark:bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FilterIcon className="mr-1 h-4 w-4" />
              Filter Options
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={resetFilters}
                disabled={!filters.city && !filters.product && !filters.startDate && !filters.endDate}
              >
                <XCircleIcon className="mr-1 text-mainColor h-4 w-4" />
                Clear Filters
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Product Filter */}
              <div>
                <label htmlFor="product-filter" className="block text-sm font-medium mb-1">
                  Filter by Product
                </label>
                <select
                  id="product-filter"
                  className="border rounded-md px-3 py-2 dark:bg-black w-full h-10"
                  value={filters.product || ""}
                  onChange={(e) => updateFilter("product", e.target.value)}
                >
                  <option value="">All Products</option>
                  {products.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="city-filter" className="block text-sm font-medium mb-1">
                  Filter by City
                </label>
                <select
                  id="city-filter"
                  className="border rounded-md px-3 py-2 dark:bg-black w-full h-10"
                  value={filters.city || ""}
                  onChange={(e) => updateFilter("city", e.target.value)}
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start dark:bg-black text-left font-normal w-full">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {filters.startDate ? format(new Date(filters.startDate), "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate ? new Date(filters.startDate) : undefined}
                      onSelect={(date) => updateFilter("startDate", date?.toISOString())}
                      initialFocus
                      disabled={(date) => (filters.endDate ? date > new Date(filters.endDate) : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start dark:bg-black text-left font-normal w-full">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {filters.endDate ? format(new Date(filters.endDate), "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate ? new Date(filters.endDate) : undefined}
                      onSelect={(date) => updateFilter("endDate", date?.toISOString())}
                      initialFocus
                      disabled={(date) => (filters.startDate ? date < new Date(filters.startDate) : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add state for pagination */}
      <div className="max-w-full md:max-w-[65vw] lg:max-w-[70vw] m-auto shadow-sm border rounded-sm">
        <div className="p-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="text-md font-medium">Product Performance Statistics</div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <select
                className="border rounded px-2 py-1 text-sm dark:bg-black"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50, 100].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-auto max-w-full max-h-[500px]">
          <table className="w-full border-collapse">
            {/* Table Header */}
            <thead className="sticky top-0 z-20">
              <tr>
                <th
                  className="bg-gradient-to-r from-blue-700 to-blue-600 text-white text-center p-2 md:p-3 font-bold cursor-pointer"
                  style={{ minWidth: "100px" }}
                  onClick={() => handleSort("product")}
                >
                  PRODUCT
                </th>
                <th
                  className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-center p-2 md:p-3 font-bold cursor-pointer"
                  colSpan={isMobile ? 1 : 1}
                  onClick={() => handleSort("totalLeads")}
                >
                  TOTAL LEADS
                </th>
                <th
                  className="bg-gradient-to-r from-blue-700 to-blue-600 text-white text-center p-2 md:p-3 font-bold cursor-pointer"
                  colSpan={isMobile ? 1 : 2}
                  onClick={() => handleSort("confirmed")}
                >
                  CONFIRMED
                </th>
                <th
                  className="bg-gradient-to-r from-green-600 to-green-500 text-white text-center p-2 md:p-3 font-bold cursor-pointer"
                  colSpan={isMobile ? 1 : 2}
                  onClick={() => handleSort("delivery")}
                >
                  DELIVERED
                </th>
                <th
                  className="bg-gradient-to-r from-red-700 to-red-600 text-white text-center p-2 md:p-3 font-bold cursor-pointer"
                  colSpan={isMobile ? 1 : 2}
                  onClick={() => handleSort("returned")}
                >
                  RETURNED
                </th>
                <th
                  className="bg-gradient-to-r from-purple-700 to-purple-600 text-white text-center p-2 md:p-3 font-bold cursor-pointer"
                  colSpan={isMobile ? 1 : 2}
                  onClick={() => handleSort("inProcess")}
                >
                  IN PROCESS
                </th>
                <th
                  className="bg-gradient-to-r from-teal-700 to-teal-600 text-white text-center p-2 md:p-3 font-bold cursor-pointer"
                  colSpan={1}
                  onClick={() => handleSort("avgQuantityPerOrder")}
                >
                  AVG QTY/ORDER
                </th>
                <th
                  className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-center p-2 md:p-3 font-bold cursor-pointer"
                  colSpan={1}
                  onClick={() => handleSort("aov")}
                >
                  AOV
                </th>
              </tr>
              {!isMobile && (
                <tr>
                  <th className="bg-blue-600 text-white p-2 left-0 z-20"></th>
                  <th className="bg-orange-500 text-white p-2"></th>
                  <th className="bg-blue-500 text-white p-2 w-20">COUNT</th>
                  <th className="bg-blue-500 text-white p-2 w-20">%</th>
                  <th className="bg-green-400 text-white p-2 w-20">COUNT</th>
                  <th className="bg-green-400 text-white p-2 w-20">%</th>
                  <th className="bg-red-500 text-white p-2 w-20">COUNT</th>
                  <th className="bg-red-500 text-white p-2 w-20">%</th>
                  <th className="bg-purple-500 text-white p-2 w-20">COUNT</th>
                  <th className="bg-purple-500 text-white p-2 w-20">%</th>
                  <th className="bg-teal-500 text-white p-2 w-20">QTY</th>
                  <th className="bg-yellow-500 text-white p-2 w-20">$</th>
                </tr>
              )}
            </thead>

            {/* Table Body */}
            <tbody>
              {/* Total Row */}
              <tr className="font-bold hover:bg-gray-100 dark:hover:bg-gray-800">
                <td className="p-2 bg-gray-100 dark:bg-gray-800">TOTAL</td>
                <td className="p-2 text-center bg-orange-100 dark:bg-orange-950">{totals.totalLeads}</td>
                {!isMobile ? (
                  <>
                    <td className="p-2 text-center bg-blue-100 dark:bg-blue-950">{totals.confirmed}</td>
                    <td className="p-2 text-center bg-blue-100 dark:bg-blue-950">{totals.confirmationPercent}%</td>
                    <td className="p-2 text-center bg-green-100 dark:bg-green-950">{totals.delivery}</td>
                    <td className="p-2 text-center bg-green-100 dark:bg-green-950">{totals.deliveryPercent}%</td>
                    <td className="p-2 text-center bg-red-100 dark:bg-red-950">{totals.returned}</td>
                    <td className="p-2 text-center bg-red-100 dark:bg-red-950">{totals.returnedPercent}%</td>
                    <td className="p-2 text-center bg-purple-100 dark:bg-purple-950">{totals.inProcess}</td>
                    <td className="p-2 text-center bg-purple-100 dark:bg-purple-950">{totals.inProcessPercent}%</td>
                    <td className="p-2 text-center bg-teal-100 dark:bg-teal-950">
                      {productStats.length
                        ? (
                            productStats.reduce((sum, item) => sum + item.avgQuantityPerOrder, 0) / productStats.length
                          ).toFixed(2)
                        : "—"}
                    </td>
                    <td className="p-2 text-center bg-yellow-100 dark:bg-yellow-950">{totals.aov.toFixed(2)}</td>
                  </>
                ) : (
                  <>
                    <td className="p-2 text-center bg-blue-100 dark:bg-blue-950">
                      {totals.confirmed} ({totals.confirmationPercent}%)
                    </td>
                    <td className="p-2 text-center bg-green-100 dark:bg-green-950">
                      {totals.delivery} ({totals.deliveryPercent}%)
                    </td>
                    <td className="p-2 text-center bg-red-100 dark:bg-red-950">
                      {totals.returned} ({totals.returnedPercent}%)
                    </td>
                    <td className="p-2 text-center bg-purple-100 dark:bg-purple-950">
                      {totals.inProcess} ({totals.inProcessPercent}%)
                    </td>
                    <td className="p-2 text-center bg-teal-100 dark:bg-teal-950">
                      {productStats.length
                        ? (
                            productStats.reduce((sum, item) => sum + item.avgQuantityPerOrder, 0) / productStats.length
                          ).toFixed(2)
                        : "—"}
                    </td>
                    <td className="p-2 text-center bg-yellow-100 dark:bg-yellow-950">{totals.aov.toFixed(2)}</td>
                  </>
                )}
              </tr>

              {/* Product Rows */}
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : ""} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                  >
                    <td
                      className={`p-2 font-medium ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-gray-950"}`}
                    >
                      {item.product}
                    </td>
                    <td className="p-2 text-center bg-orange-50 dark:bg-orange-950/30">{item.totalLeads}</td>
                    {!isMobile ? (
                      <>
                        <td className="p-2 text-center bg-blue-50 dark:bg-blue-950/30">{item.confirmed}</td>
                        <td className="p-2 text-center bg-blue-50 dark:bg-blue-950/30">{item.confirmationPercent}%</td>
                        <td className="p-2 text-center bg-green-50 dark:bg-green-950/30">{item.delivery}</td>
                        <td className="p-2 text-center bg-green-50 dark:bg-green-950/30">{item.deliveryPercent}%</td>
                        <td className="p-2 text-center bg-red-50 dark:bg-red-950/30">{item.returned}</td>
                        <td className="p-2 text-center bg-red-50 dark:bg-red-950/30">{item.returnedPercent}%</td>
                        <td className="p-2 text-center bg-purple-50 dark:bg-purple-950/30">{item.inProcess}</td>
                        <td className="p-2 text-center bg-purple-50 dark:bg-purple-950/30">{item.inProcessPercent}%</td>
                        <td className="p-2 text-center bg-teal-50 dark:bg-teal-950/30">{item.avgQuantityPerOrder}</td>
                        <td className="p-2 text-center bg-yellow-50 dark:bg-yellow-950/30">{item.aov.toFixed(2)}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 text-center bg-blue-50 dark:bg-blue-950/30">
                          {item.confirmed} ({item.confirmationPercent}%)
                        </td>
                        <td className="p-2 text-center bg-green-50 dark:bg-green-950/30">
                          {item.delivery} ({item.deliveryPercent}%)
                        </td>
                        <td className="p-2 text-center bg-red-50 dark:bg-red-950/30">
                          {item.returned} ({item.returnedPercent}%)
                        </td>
                        <td className="p-2 text-center bg-purple-50 dark:bg-purple-950/30">
                          {item.inProcess} ({item.inProcessPercent}%)
                        </td>
                        <td className="p-2 text-center bg-teal-50 dark:bg-teal-950/30">{item.avgQuantityPerOrder}</td>
                        <td className="p-2 text-center bg-yellow-50 dark:bg-yellow-950/30">{item.aov.toFixed(2)}</td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isMobile ? 7 : 12} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-medium mb-2">No data available</p>
                      <p className="text-sm max-w-md">
                        {filters.city || filters.product || filters.startDate || filters.endDate
                          ? "Try adjusting your filters to see more results."
                          : "There are no product statistics to display. Try refreshing or check back later."}
                      </p>
                      {(filters.city || filters.product || filters.startDate || filters.endDate) && (
                        <Button variant="outline" className="mt-4" onClick={resetFilters}>
                          <XCircleIcon className="mr-1 h-4 w-4" />
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {productStats.length > 0 && (
          <div className="p-2 border-t flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-1 sm:mb-0">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, productStats.length)} of{" "}
              {productStats.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-sm px-3 py-1 border rounded">
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
