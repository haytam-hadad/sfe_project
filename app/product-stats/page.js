"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RefreshCwIcon, DownloadIcon, FilterIcon, CalendarIcon, XCircleIcon } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

export default function ProductStatsPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMobile = useMobile()
  const [showFilters, setShowFilters] = useState(false)

  // Filter states
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [cityFilter, setCityFilter] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [sortField, setSortField] = useState("totalLeads")
  const [sortDirection, setSortDirection] = useState("desc")

  // Fetch data from the API with retry logic
  useEffect(() => {
    const fetchData = async (retryCount = 0) => {
      setLoading(true)
      try {
        const response = await fetch("/api/sheet")
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`)
        }
        const result = await response.json()
        setOrders(result)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000
          console.log(`Retrying in ${delay}ms...`)
          setTimeout(() => fetchData(retryCount + 1), delay)
        } else {
          setError(err instanceof Error ? err.message : "Unknown error occurred")
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [])

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
      if (cityFilter && order["City"]?.toLowerCase() !== cityFilter.toLowerCase()) {
        return false
      }

      // Product filter
      if (productFilter && order["sku number"] !== productFilter) {
        return false
      }

      // Date range filter
      if (startDate || endDate) {
        const orderDate = new Date(order["Order date"])
        if (startDate && orderDate < startDate) {
          return false
        }
        if (endDate) {
          const endDatePlusOne = new Date(endDate)
          endDatePlusOne.setDate(endDatePlusOne.getDate() + 1)
          if (orderDate >= endDatePlusOne) {
            return false
          }
        }
      }

      return true
    })
  }, [orders, cityFilter, productFilter, startDate, endDate])

  // Reset filters
  const resetFilters = useCallback(() => {
    setCityFilter("")
    setProductFilter("")
    setStartDate(null)
    setEndDate(null)
  }, [])

  // Calculate statistics for each product using the updated calculation logic
  const productStats = useMemo(() => {
    if (!filteredOrders.length) return []

    const stats = {}

    // Initialize stats for each product
    products.forEach((product) => {
      stats[product] = {
        totalLeads: 0,
        confirmation: 0,
        delivery: 0,
        returned: 0,
        inProcess: 0,
      }
    })

    // Process each order
    filteredOrders.forEach((order) => {
      const product = order["sku number"]
      if (!product || !stats[product]) return

      // Count total leads for this product
      stats[product].totalLeads++

      // Count by status using the updated logic from the dashboard
      const status = order["STATUS"]
      if (!status) return

      // Confirmation: Scheduled, Awaiting Dispatch, Delivered, In Transit, Returned, Cancelled
      if (
        status === "Scheduled" ||
        status === "Awaiting Dispatch" ||
        status === "Delivered" ||
        status === "In Transit" ||
        status === "Returned" ||
        status === "Cancelled"
      ) {
        stats[product].confirmation++
      }

      // Delivery: only Delivered status
      if (status === "Delivered") {
        stats[product].delivery++
      }

      // Returned: Returned or Cancelled
      if (status === "Returned" || status === "Cancelled") {
        stats[product].returned++
      }

      // In Process: Scheduled, Awaiting Dispatch, In Transit
      if (status === "Scheduled" || status === "Awaiting Dispatch" || status === "In Transit") {
        stats[product].inProcess++
      }
    })

    // Convert to array and calculate percentages
    return Object.entries(stats)
      .filter(([_, data]) => data.totalLeads > 0) // Only include products with orders
      .map(([product, data]) => {
        const confirmationPercent = data.totalLeads > 0 ? (data.confirmation / data.totalLeads) * 100 : 0
        const deliveryPercent = data.confirmation > 0 ? (data.delivery / data.confirmation) * 100 : 0
        const returnedPercent = data.confirmation > 0 ? (data.returned / data.confirmation) * 100 : 0
        const inProcessPercent = data.totalLeads > 0 ? (data.inProcess / data.totalLeads) * 100 : 0

        return {
          product,
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
  }, [filteredOrders, products, sortField, sortDirection])

  // Calculate totals
  const totals = useMemo(() => {
    if (!productStats.length)
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

    const totalLeads = productStats.reduce((sum, item) => sum + item.totalLeads, 0)
    const confirmation = productStats.reduce((sum, item) => sum + item.confirmation, 0)
    const delivery = productStats.reduce((sum, item) => sum + item.delivery, 0)
    const returned = productStats.reduce((sum, item) => sum + item.returned, 0)
    const inProcess = productStats.reduce((sum, item) => sum + item.inProcess, 0)

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
      "Product,Total Leads,Confirmation,Confirmation %,Delivery,Delivery %,Returned,Returned %,In Process,In Process %\n"

    // Add total row
    csvContent += `TOTAL,${totals.totalLeads},${totals.confirmation},${totals.confirmationPercent}%,${totals.delivery},${totals.deliveryPercent}%,${totals.returned},${totals.returnedPercent}%,${totals.inProcess},${totals.inProcessPercent}%\n`

    // Add product rows
    productStats.forEach((item) => {
      csvContent += `"${item.product}",${item.totalLeads},${item.confirmation},${item.confirmationPercent}%,${item.delivery},${item.deliveryPercent}%,${item.returned},${item.returnedPercent}%,${item.inProcess},${item.inProcessPercent}%\n`
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

  // Render loading state
  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">Product Statistics</h1>
        <Card>
          <CardHeader>
            <CardTitle>Loading data...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Skeleton className="h-[400px] w-full" />
            </div>
          </CardContent>
        </Card>
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
              <RefreshCwIcon className="mr-2 h-4 w-4" /> Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Statistics</h1>
          <p className="text-muted-foreground mt-1">
            Analyzing {totals.totalLeads} orders across {productStats.length} products
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setShowFilters((prev) => !prev)}>
            <FilterIcon className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport} disabled={!productStats.length}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => window.location.reload()}>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filter Options
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
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
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
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
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
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => setStartDate(date)}
                      initialFocus
                      disabled={(date) => (endDate ? date > endDate : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start dark:bg-black text-left font-normal w-full">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => setEndDate(date)}
                      initialFocus
                      disabled={(date) => (startDate ? date < startDate : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="w-full overflow-x-auto">
        <div className="bg-gray-50 dark:bg-gray-900 p-2 overflow-x-auto">
          <div className="text-lg flex items-center justify-between">
            <h4>Product Performance Statistics</h4>
            <span className="text-sm font-normal text-muted-foreground">
              {filteredOrders.length} orders across {productStats.length} products
            </span>
          </div>
        </div>
        <div className="w-full">
          <table className="w-full border-collapse">
            {/* Table Header */}
            <thead>
              <tr>
                <th
                  className="bg-gradient-to-r from-blue-700 to-blue-600 text-white text-center p-3 border border-gray-300 font-bold sticky left-0 z-10"
                  style={{ minWidth: "150px" }}
                >
                  PRODUCT
                </th>
                <th
                  className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-center p-3 border border-gray-300 font-bold"
                  colSpan={isMobile ? 1 : 1}
                >
                  TOTAL LEADS
                </th>
                <th
                  className="bg-gradient-to-r from-blue-700 to-blue-600 text-white text-center p-3 border border-gray-300 font-bold"
                  colSpan={isMobile ? 1 : 2}
                >
                  CONFIRMATION
                </th>
                <th
                  className="bg-gradient-to-r from-green-600 to-green-500 text-white text-center p-3 border border-gray-300 font-bold"
                  colSpan={isMobile ? 1 : 2}
                >
                  DELIVERY
                </th>
                <th
                  className="bg-gradient-to-r from-red-700 to-red-600 text-white text-center p-3 border border-gray-300 font-bold"
                  colSpan={isMobile ? 1 : 2}
                >
                  RETURNED
                </th>
                <th
                  className="bg-gradient-to-r from-purple-700 to-purple-600 text-white text-center p-3 border border-gray-300 font-bold"
                  colSpan={isMobile ? 1 : 2}
                >
                  IN PROCESS
                </th>
              </tr>
              {!isMobile && (
                <tr>
                  <th className="bg-blue-600 text-white p-2 border border-gray-300 sticky left-0 z-10"></th>
                  <th className="bg-orange-500 text-white p-2 border border-gray-300"></th>
                  <th className="bg-blue-500 text-white p-2 border border-gray-300 w-20">COUNT</th>
                  <th className="bg-blue-500 text-white p-2 border border-gray-300 w-20">%</th>
                  <th className="bg-green-400 text-white p-2 border border-gray-300 w-20">COUNT</th>
                  <th className="bg-green-400 text-white p-2 border border-gray-300 w-20">%</th>
                  <th className="bg-red-500 text-white p-2 border border-gray-300 w-20">COUNT</th>
                  <th className="bg-red-500 text-white p-2 border border-gray-300 w-20">%</th>
                  <th className="bg-purple-500 text-white p-2 border border-gray-300 w-20">COUNT</th>
                  <th className="bg-purple-500 text-white p-2 border border-gray-300 w-20">%</th>
                </tr>
              )}
            </thead>

            {/* Table Body */}
            <tbody>
              {/* Total Row */}
              <tr className="font-bold hover:bg-gray-100 dark:hover:bg-gray-800">
                <td className="p-2 border border-gray-300 bg-gray-100 dark:bg-gray-800 sticky left-0 z-10">TOTAL</td>
                <td className="p-2 border border-gray-300 text-center bg-orange-100 dark:bg-orange-950">
                  {totals.totalLeads}
                </td>
                {!isMobile ? (
                  <>
                    <td className="p-2 border border-gray-300 text-center bg-blue-100 dark:bg-blue-950">
                      {totals.confirmation}
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-blue-100 dark:bg-blue-950">
                      {totals.confirmationPercent}%
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-green-100 dark:bg-green-950">
                      {totals.delivery}
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-green-100 dark:bg-green-950">
                      {totals.deliveryPercent}%
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-red-100 dark:bg-red-950">
                      {totals.returned}
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-red-100 dark:bg-red-950">
                      {totals.returnedPercent}%
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-purple-100 dark:bg-purple-950">
                      {totals.inProcess}
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-purple-100 dark:bg-purple-950">
                      {totals.inProcessPercent}%
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border border-gray-300 text-center bg-blue-100 dark:bg-blue-950">
                      {totals.confirmation} ({totals.confirmationPercent}%)
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-green-100 dark:bg-green-950">
                      {totals.delivery} ({totals.deliveryPercent}%)
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-red-100 dark:bg-red-950">
                      {totals.returned} ({totals.returnedPercent}%)
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-purple-100 dark:bg-purple-950">
                      {totals.inProcess} ({totals.inProcessPercent}%)
                    </td>
                  </>
                )}
              </tr>

              {/* Product Rows */}
              {productStats.length > 0 ? (
                productStats.map((item, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : ""} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                  >
                    <td
                      className={`p-2 border border-gray-300 font-medium sticky left-0 z-10 ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-gray-950"}`}
                    >
                      {item.product}
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-orange-50 dark:bg-orange-950/30">
                      {item.totalLeads}
                    </td>
                    {!isMobile ? (
                      <>
                        <td className="p-2 border border-gray-300 text-center bg-blue-50 dark:bg-blue-950/30">
                          {item.confirmation}
                        </td>
                        <td className="p-2 border border-gray-300 text-center bg-blue-50 dark:bg-blue-950/30">
                          {item.confirmationPercent}%
                        </td>
                        <td className="p-2 border border-gray-300 text-center bg-green-50 dark:bg-green-950/30">
                          {item.delivery}
                        </td>
                        <td className="p-2 border border-gray-300 text-center bg-green-50 dark:bg-green-950/30">
                          {item.deliveryPercent}%
                        </td>
                        <td className="p-2 border border-gray-300 text-center bg-red-50 dark:bg-red-950/30">
                          {item.returned}
                        </td>
                        <td className="p-2 border border-gray-300 text-center bg-red-50 dark:bg-red-950/30">
                          {item.returnedPercent}%
                        </td>
                        <td className="p-2 border border-gray-300 text-center bg-purple-50 dark:bg-purple-950/30">
                          {item.inProcess}
                        </td>
                        <td className="p-2 border border-gray-300 text-center bg-purple-50 dark:bg-purple-950/30">
                          {item.inProcessPercent}%
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 border border-gray-300 text-center bg-blue-50 dark:bg-blue-950/30">
                          {item.confirmation} ({item.confirmationPercent}%)
                        </td>
                        <td className="p-2 border border-gray-300 text-center bg-green-50 dark:bg-green-950/30">
                          {item.delivery} ({item.deliveryPercent}%)
                        </td>
                        <td className="p-2 border border-gray-300 text-center bg-red-50 dark:bg-red-950/30">
                          {item.returned} ({item.returnedPercent}%)
                        </td>
                        <td className="p-2 border border-gray-300 text-center bg-purple-50 dark:bg-purple-950/30">
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
                        {cityFilter || productFilter || startDate || endDate
                          ? "Try adjusting your filters to see more results."
                          : "There are no product statistics to display. Try refreshing or check back later."}
                      </p>
                      {(cityFilter || productFilter || startDate || endDate) && (
                        <Button variant="outline" className="mt-4" onClick={resetFilters}>
                          <XCircleIcon className="mr-2 h-4 w-4" />
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
      </div>
    </div>
  )
}
