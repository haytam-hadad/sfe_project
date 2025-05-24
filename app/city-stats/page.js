"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  LoaderCircle,
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
import { matchesStatus } from "@/lib/constants"
import { BarChart3, MapPin, Globe } from "lucide-react"

export default function CityStatsPage() {
  const [showFilters, setShowFilters] = useState(false)
  const isMobile = useMobile()
  const { token } = useAuth()
  const { statusConfig } = useStatusConfig()
  const { filters, updateFilter, resetFilters } = useFilters()
  const { sheetData: orders, loadingSheetData: loading, errorSheetData: error, refreshSheetData } = useSheetData()

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

  // Extract unique countries (from all orders, not filtered)
  const countries = useMemo(() => {
    if (!orders.length) return []
    const uniqueCountries = [...new Set(orders.map((order) => order["Receier Country"]).filter(Boolean))]
    return uniqueCountries.sort()
  }, [orders])

  // Extract unique cities (from all orders, not filtered)
  const cities = useMemo(() => {
    if (!orders.length) return []
    const uniqueCities = [...new Set(orders.map((order) => order["City"]).filter(Boolean))]
    return uniqueCities.sort()
  }, [orders])

  // Extract unique source traffic (from all orders, not filtered)
  const sources = useMemo(() => {
    if (!orders.length) return []
    const uniqueSources = [...new Set(orders.map((order) => order["Source Traffic"]).filter(Boolean))]
    return uniqueSources.sort()
  }, [orders])

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [sortField, setSortField] = useState("totalLeads")
  const [sortDirection, setSortDirection] = useState("desc")

  // Apply filters to the data (match logic from orders page)
  const filteredOrders = useMemo(() => {
    if (!orders.length) return []

    return orders.filter((order) => {
      // Product filter
      if (filters.product && order["sku number"] !== filters.product) {
        return false
      }

      // City filter
      if (filters.city && order["City"] !== filters.city) {
        return false
      }

      // Country filter
      if (filters.country && order["Receier Country"] !== filters.country) {
        return false
      }

      // Source Traffic filter
      if (filters.source && order["Source Traffic"] !== filters.source) {
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

  // Calculate statistics for each city using the configurable status definitions
  const cityStats = useMemo(() => {
    if (!filteredOrders.length) return []

    const stats = {}

    // Initialize stats for each city
    cities.forEach((city) => {
      stats[city] = {
        totalLeads: 0,
        confirmation: 0,
        delivery: 0,
        returned: 0,
        inProcess: 0,
      }
    })

    // Process each order
    filteredOrders.forEach((order) => {
      const city = order["City"]
      if (!city || !stats[city]) return

      // Count total leads for this city
      stats[city].totalLeads++

      // Count by status using the configurable status definitions
      const status = order["STATUS"]
      if (!status) return

      // Use the status configuration to determine counts
      if (matchesStatus(status, statusConfig.confirmation)) {
        stats[city].confirmation++
      }

      if (matchesStatus(status, statusConfig.delivery)) {
        stats[city].delivery++
      }

      if (matchesStatus(status, statusConfig.returned)) {
        stats[city].returned++
      }

      if (matchesStatus(status, statusConfig.inProcess)) {
        stats[city].inProcess++
      }
    })

    // Convert to array and calculate percentages
    return Object.entries(stats)
      .map(([city, data]) => {
        const confirmationPercent = data.totalLeads > 0 ? (data.confirmation / data.totalLeads) * 100 : 0
        const deliveryPercent = data.confirmation > 0 ? (data.delivery / data.confirmation) * 100 : 0
        const returnedPercent = data.confirmation > 0 ? (data.returned / data.confirmation) * 100 : 0
        const inProcessPercent = data.totalLeads > 0 ? (data.inProcess / data.totalLeads) * 100 : 0

        return {
          city,
          totalLeads: data.totalLeads,
          confirmation: data.confirmation,
          confirmationPercent: Number.parseFloat(confirmationPercent.toFixed(2)),
          delivery: data.delivery,
          deliveryPercent: Number.parseFloat(deliveryPercent.toFixed(2)),
          returned: data.returned,
          returnedPercent: Number.parseFloat(returnedPercent.toFixed(2)),
          inProcess: data.inProcess,
          inProcessPercent: Number.parseFloat(inProcessPercent.toFixed(2)),
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
  }, [filteredOrders, cities, sortField, sortDirection, statusConfig])

  // Calculate totals
  const totals = useMemo(() => {
    if (!cityStats.length)
      return {
        totalLeads: 0,
        confirmation: 0,
        confirmationPercent: 0,
        delivery: 0,
        deliveryPercent: 0,
        returned: 0,
        returnedPercent: 0,
        inProcess: 0,
        inProcessPercent: 0,
      }

    const totalLeads = cityStats.reduce((sum, item) => sum + item.totalLeads, 0)
    const confirmation = cityStats.reduce((sum, item) => sum + item.confirmation, 0)
    const delivery = cityStats.reduce((sum, item) => sum + item.delivery, 0)
    const returned = cityStats.reduce((sum, item) => sum + item.returned, 0)
    const inProcess = cityStats.reduce((sum, item) => sum + item.inProcess, 0)

    const confirmationPercent = totalLeads > 0 ? (confirmation / totalLeads) * 100 : 0
    const deliveryPercent = confirmation > 0 ? (delivery / confirmation) * 100 : 0
    const returnedPercent = confirmation > 0 ? (returned / confirmation) * 100 : 0
    const inProcessPercent = totalLeads > 0 ? (inProcess / totalLeads) * 100 : 0

    return {
      totalLeads,
      confirmation,
      confirmationPercent: Number.parseFloat(confirmationPercent.toFixed(2)),
      delivery,
      deliveryPercent: Number.parseFloat(deliveryPercent.toFixed(2)),
      returned,
      returnedPercent: Number.parseFloat(returnedPercent.toFixed(2)),
      inProcess,
      inProcessPercent: Number.parseFloat(inProcessPercent.toFixed(2)),
    }
  }, [cityStats])

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
    if (!cityStats.length) return

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Add headers
    csvContent +=
      "City,Total Leads,Confirmation,Confirmation %,Delivery,Delivery %,Returned,Returned %,In Process,In Process %\n"

    // Add total row
    csvContent += `TOTAL,${totals.totalLeads},${totals.confirmation},${totals.confirmationPercent}%,${totals.delivery},${totals.deliveryPercent}%,${totals.returned},${totals.returnedPercent}%,${totals.inProcess},${totals.inProcessPercent}%\n`

    // Add city rows
    cityStats.forEach((item) => {
      csvContent += `${item.city},${item.totalLeads},${item.confirmation},${item.confirmationPercent}%,${item.delivery},${item.deliveryPercent}%,${item.returned},${item.returnedPercent}%,${item.inProcess},${item.inProcessPercent}%\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `city-stats-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)

    // Trigger download
    link.click()
    document.body.removeChild(link)
  }

  // Calculate pagination
  const indexOfLastItem = currentPage * rowsPerPage
  const indexOfFirstItem = indexOfLastItem - rowsPerPage
  const currentItems = cityStats.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(cityStats.length / rowsPerPage)

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
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">City Statistics</h1>
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
          <h1 className="text-3xl font-bold">City Statistics</h1>
          <p className="text-sm md:text-md p-1 opacity-70">View your city statistics and export them to a CSV file.</p>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setShowFilters((prev) => !prev)}>
            <FilterIcon className="mr-1 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport} disabled={!cityStats.length}>
            <DownloadIcon className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card className="mb-6 shadow-sm dark:bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <FilterIcon className="mr-1 h-5 w-5 text-mainColor" />
              Filters
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={resetFilters} // <-- use resetFilters from context
                disabled={
                  !filters.city && !filters.product && !filters.startDate && !filters.endDate && !filters.country && !filters.source
                }
              >
                <XCircleIcon className="mr-1 text-mainColor h-4 w-4" />
                Clear Filters
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
              {/* Product Filter */}
              <div>
                <label htmlFor="product-filter" className="block text-sm font-medium mb-1 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" /> Product
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

              {/* City Filter */}
              <div>
                <label htmlFor="city-filter" className="block text-sm font-medium mb-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" /> City
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

              {/* Country Filter */}
              <div>
                <label htmlFor="country-filter" className="block text-sm font-medium mb-1 flex items-center">
                  <Globe className="h-4 w-4 mr-1" /> Country
                </label>
                <select
                  id="country-filter"
                  className="border rounded-md px-3 py-2 dark:bg-black w-full h-10"
                  value={filters.country || ""}
                  onChange={(e) => updateFilter("country", e.target.value)}
                >
                  <option value="">All Countries</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Traffic Filter */}
              <div>
                <label htmlFor="source-filter" className="block text-sm font-medium mb-1 flex items-center">
                  <FilterIcon className="h-4 w-4 mr-1" /> Source Traffic
                </label>
                <select
                  id="source-filter"
                  className="border rounded-md px-3 py-2 dark:bg-black w-full h-10"
                  value={filters.source || ""}
                  onChange={(e) => updateFilter("source", e.target.value)}
                >
                  <option value="">All Sources</option>
                  {sources.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter (single input for range) */}
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" /> Date Range
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start dark:bg-black text-left font-normal w-full">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {filters.startDate || filters.endDate
                        ? `${filters.startDate ? format(new Date(filters.startDate), "PPP") : "Start"} - ${filters.endDate ? format(new Date(filters.endDate), "PPP") : "End"}`
                        : "Select date range"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="range"
                      selected={{
                        from: filters.startDate ? new Date(filters.startDate) : undefined,
                        to: filters.endDate ? new Date(filters.endDate) : undefined,
                      }}
                      onSelect={(range) => {
                        updateFilter("startDate", range?.from ? range.from.toISOString() : null)
                        updateFilter("endDate", range?.to ? range.toISOString() : null)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Container */}
      <div className="max-w-full md:max-w-[65vw] lg:max-w-[70vw] m-auto shadow-sm border rounded-sm">
        <div className="p-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="text-md font-medium">City Performance Statistics</div>
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
                  className="bg-gradient-to-r from-blue-700 to-blue-600 text-white text-center p-2 md:p-3  font-bold cursor-pointer"
                  style={{ minWidth: "100px" }}
                  onClick={() => handleSort("city")}
                >
                  CITY
                </th>
                <th
                  className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-center p-2 md:p-3  font-bold cursor-pointer"
                  colSpan={isMobile ? 1 : 1}
                  onClick={() => handleSort("totalLeads")}
                >
                  TOTAL LEADS
                </th>
                <th
                  className="bg-gradient-to-r from-blue-700 to-blue-600 text-white text-center p-2 md:p-3  font-bold cursor-pointer"
                  colSpan={isMobile ? 1 : 2}
                  onClick={() => handleSort("confirmation")}
                >
                  CONFIRMATION
                </th>
                <th
                  className="bg-gradient-to-r from-green-600 to-green-500 text-white text-center p-2 md:p-3  font-bold cursor-pointer"
                  colSpan={isMobile ? 1 : 2}
                  onClick={() => handleSort("delivery")}
                >
                  DELIVERY
                </th>
                <th
                  className="bg-gradient-to-r from-red-700 to-red-600 text-white text-center p-2 md:p-3  font-bold cursor-pointer"
                  colSpan={isMobile ? 1 : 2}
                  onClick={() => handleSort("returned")}
                >
                  RETURNED
                </th>
                <th
                  className="bg-gradient-to-r from-purple-700 to-purple-600 text-white text-center p-2 md:p-3  font-bold cursor-pointer"
                  colSpan={isMobile ? 1 : 2}
                  onClick={() => handleSort("inProcess")}
                >
                  IN PROCESS
                </th>
              </tr>
              {!isMobile && (
                <tr>
                  <th className="bg-blue-600 text-white p-2 left-0 z-20"></th>
                  <th className="bg-orange-500 text-white p-2"></th>
                  <th className="bg-blue-500 text-white p-2  w-20">COUNT</th>
                  <th className="bg-blue-500 text-white p-2  w-20">%</th>
                  <th className="bg-green-400 text-white p-2  w-20">COUNT</th>
                  <th className="bg-green-400 text-white p-2  w-20">%</th>
                  <th className="bg-red-500 text-white p-2  w-20">COUNT</th>
                  <th className="bg-red-500 text-white p-2  w-20">%</th>
                  <th className="bg-purple-500 text-white p-2  w-20">COUNT</th>
                  <th className="bg-purple-500 text-white p-2  w-20">%</th>
                </tr>
              )}
            </thead>

            {/* Table Body */}
            <tbody>
              {/* Total Row */}
              <tr className="font-bold hover:bg-gray-100 dark:hover:bg-gray-800">
                <td className="p-2  bg-gray-100 dark:bg-gray-800">TOTAL</td>
                <td className="p-2  text-center bg-orange-100 dark:bg-orange-950">{totals.totalLeads}</td>
                {!isMobile ? (
                  <>
                    <td className="p-2  text-center bg-blue-100 dark:bg-blue-950">{totals.confirmation}</td>
                    <td className="p-2  text-center bg-blue-100 dark:bg-blue-950">{totals.confirmationPercent}%</td>
                    <td className="p-2  text-center bg-green-100 dark:bg-green-950">{totals.delivery}</td>
                    <td className="p-2  text-center bg-green-100 dark:bg-green-950">{totals.deliveryPercent}%</td>
                    <td className="p-2  text-center bg-red-100 dark:bg-red-950">{totals.returned}</td>
                    <td className="p-2  text-center bg-red-100 dark:bg-red-950">{totals.returnedPercent}%</td>
                    <td className="p-2  text-center bg-purple-100 dark:bg-purple-950">{totals.inProcess}</td>
                    <td className="p-2  text-center bg-purple-100 dark:bg-purple-950">{totals.inProcessPercent}%</td>
                  </>
                ) : (
                  <>
                    <td className="p-2  text-center bg-blue-100 dark:bg-blue-950">
                      {totals.confirmation} ({totals.confirmationPercent}%)
                    </td>
                    <td className="p-2  text-center bg-green-100 dark:bg-green-950">
                      {totals.delivery} ({totals.deliveryPercent}%)
                    </td>
                    <td className="p-2  text-center bg-red-100 dark:bg-red-950">
                      {totals.returned} ({totals.returnedPercent}%)
                    </td>
                    <td className="p-2  text-center bg-purple-100 dark:bg-purple-950">
                      {totals.inProcess} ({totals.inProcessPercent}%)
                    </td>
                  </>
                )}
              </tr>

              {/* City Rows */}
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : ""
                    } hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                  >
                    <td
                      className={`p-2  font-medium ${
                        index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-gray-950"
                      }`}
                    >
                      {item.city}
                    </td>
                    <td className="p-2  text-center bg-orange-50 dark:bg-orange-950/30">{item.totalLeads}</td>
                    {!isMobile ? (
                      <>
                        <td className="p-2  text-center bg-blue-50 dark:bg-blue-950/30">{item.confirmation}</td>
                        <td className="p-2  text-center bg-blue-50 dark:bg-blue-950/30">{item.confirmationPercent}%</td>
                        <td className="p-2  text-center bg-green-50 dark:bg-green-950/30">{item.delivery}</td>
                        <td className="p-2  text-center bg-green-50 dark:bg-green-950/30">{item.deliveryPercent}%</td>
                        <td className="p-2  text-center bg-red-50 dark:bg-red-950/30">{item.returned}</td>
                        <td className="p-2  text-center bg-red-50 dark:bg-red-950/30">{item.returnedPercent}%</td>
                        <td className="p-2  text-center bg-purple-50 dark:bg-purple-950/30">{item.inProcess}</td>
                        <td className="p-2  text-center bg-purple-50 dark:bg-purple-950/30">
                          {item.inProcessPercent}%
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2  text-center bg-blue-50 dark:bg-blue-950/30">
                          {item.confirmation} ({item.confirmationPercent}%)
                        </td>
                        <td className="p-2  text-center bg-green-50 dark:bg-green-950/30">
                          {item.delivery} ({item.deliveryPercent}%)
                        </td>
                        <td className="p-2  text-center bg-red-50 dark:bg-red-950/30">
                          {item.returned} ({item.returnedPercent}%)
                        </td>
                        <td className="p-2  text-center bg-purple-50 dark:bg-purple-950/30">
                          {item.inProcess} ({item.inProcessPercent}%)
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isMobile ? 6 : 10} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-medium mb-2">No data available</p>
                      <p className="text-sm max-w-md">
                        {filters.city || filters.product || filters.startDate || filters.endDate || filters.country || filters.source
                          ? "Try adjusting your filters to see more results."
                          : "There are no city statistics to display. Try refreshing or check back later."}
                      </p>
                      {(filters.city || filters.product || filters.startDate || filters.endDate || filters.country || filters.source) && (
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
        {cityStats.length > 0 && (
          <div className="p-2 border-t flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-1 sm:mb-0">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, cityStats.length)} of {cityStats.length}{" "}
              entries
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
