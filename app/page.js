"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format } from "date-fns"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, FilterIcon, RefreshCwIcon, XCircleIcon } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { useStatusConfig } from "@/contexts/status-config-context"
import { matchesStatus } from "@/lib/status-config"

export default function Page() {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const isMobile = useMobile()

  // Get status configuration from context
  const { statusConfig } = useStatusConfig()

  // Filter states
  const [statusFilter, setStatusFilter] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [productFilter, setProductFilter] = useState("") // New product filter
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

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
        setFilteredOrders(result)
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

  // Effect for responsive design
  useEffect(() => {
    if (isMobile) {
      setShowFilters(false)
    }
  }, [isMobile])

  // Memoized derivations
  const countries = useMemo(() => {
    if (!orders.length) return []
    const uniqueCountries = [...new Set(orders.map((order) => order["Receier Country*"]).filter(Boolean))]
    return uniqueCountries.sort()
  }, [orders])

  const statuses = useMemo(() => {
    if (!orders.length) return []
    const uniqueStatuses = [...new Set(orders.map((order) => order["STATUS"]).filter(Boolean))]
    return uniqueStatuses.sort()
  }, [orders])

  // Extract all unique SKU numbers
  const products = useMemo(() => {
    if (!orders.length) return []
    const uniqueProducts = [...new Set(orders.map((order) => order["sku number"]).filter(Boolean))]
    return uniqueProducts.sort()
  }, [orders])

  // Apply filters to the data
  const applyFilters = useCallback(() => {
    if (!orders.length) return

    const filtered = orders.filter((order) => {
      const matchesStatus = !statusFilter || order["STATUS"] === statusFilter
      const matchesCountry = !countryFilter || order["Receier Country*"] === countryFilter
      const matchesProduct = !productFilter || order["sku number"] === productFilter

      let matchesDateRange = true
      if (startDate || endDate) {
        const orderDate = new Date(order["Order date"])
        if (startDate && orderDate < startDate) {
          matchesDateRange = false
        }
        if (endDate) {
          const endDatePlusOne = new Date(endDate)
          endDatePlusOne.setDate(endDatePlusOne.getDate() + 1)
          if (orderDate >= endDatePlusOne) {
            matchesDateRange = false
          }
        }
      }

      return matchesStatus && matchesCountry && matchesProduct && matchesDateRange
    })

    setFilteredOrders(filtered)
  }, [orders, statusFilter, countryFilter, productFilter, startDate, endDate])

  // Reset filters
  const resetFilters = useCallback(() => {
    setStatusFilter("")
    setCountryFilter("")
    setProductFilter("")
    setStartDate(null)
    setEndDate(null)
    setFilteredOrders(orders)
  }, [orders])

  // Generate status chart data
  const statusChartData = useMemo(() => {
    if (!filteredOrders.length) return []

    const statusCounts = filteredOrders.reduce((acc, order) => {
      const status = order["STATUS"] || "Unknown"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      percentage: (value / filteredOrders.length) * 100,
    }))
  }, [filteredOrders])

  // Generate country chart data
  const countryChartData = useMemo(() => {
    if (!filteredOrders.length) return []

    const countryCounts = filteredOrders.reduce((acc, order) => {
      const country = order["Receier Country*"] || "Unknown"
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {})

    return Object.entries(countryCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / filteredOrders.length) * 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 countries
  }, [filteredOrders])

  // Calculate key metrics based on the configurable status definitions
  const metrics = useMemo(() => {
    if (!filteredOrders.length)
      return {
        totalLeads: 0,
        confirmation: 0,
        confirmationRate: 0,
        delivery: 0,
        deliveryRate: 0,
        returned: 0,
        returnRate: 0,
        inProcess: 0,
        inProcessRate: 0,
      }

    const totalLeads = filteredOrders.length

    // Use the status configuration to determine counts
    const confirmation = filteredOrders.filter((order) =>
      matchesStatus(order["STATUS"], statusConfig.confirmation),
    ).length

    const delivery = filteredOrders.filter((order) => matchesStatus(order["STATUS"], statusConfig.delivery)).length

    const returned = filteredOrders.filter((order) => matchesStatus(order["STATUS"], statusConfig.returned)).length

    const inProcess = filteredOrders.filter((order) => matchesStatus(order["STATUS"], statusConfig.inProcess)).length

    // Calculate rates
    const confirmationRate = totalLeads > 0 ? (confirmation / totalLeads) * 100 : 0
    const deliveryRate = confirmation > 0 ? (delivery / confirmation) * 100 : 0
    const returnRate = confirmation > 0 ? (returned / confirmation) * 100 : 0
    const inProcessRate = totalLeads > 0 ? (inProcess / totalLeads) * 100 : 0

    return {
      totalLeads,
      confirmation,
      confirmationRate: Number.parseFloat(confirmationRate.toFixed(2)),
      delivery,
      deliveryRate: Number.parseFloat(deliveryRate.toFixed(2)),
      returned,
      returnRate: Number.parseFloat(returnRate.toFixed(2)),
      inProcess,
      inProcessRate: Number.parseFloat(inProcessRate.toFixed(2)),
    }
  }, [filteredOrders, statusConfig])

  const COLORS = ["#4CAF50", "#F44336", "#2196F3", "#FF9800", "#9C27B0", "#607D8B"]

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "—"

    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Render loading skeletons
  if (loading) {
    return (
      <main className="p-2 md:p-5">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-3">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-12 w-1/2" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="p-4">
            <Skeleton className="h-8 w-1/3 mx-auto mb-4" />
            <Skeleton className="h-[300px] w-full rounded-md" />
          </Card>
          <Card className="p-4">
            <Skeleton className="h-8 w-1/3 mx-auto mb-4" />
            <Skeleton className="h-[300px] w-full rounded-md" />
          </Card>
        </div>
      </main>
    )
  }

  // Render error state
  if (error) {
    return (
      <main className="p-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-white dark:bg-zinc-900 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-red-600">Error Loading Data</h2>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t load your dashboard data. Please try again.
            </p>
          </div>
          <div className="mb-4 text-sm text-muted-foreground">{error}</div>
          <Button className="w-full" onClick={() => window.location.reload()}>
            <RefreshCwIcon className="mr-2 h-4 w-4" /> Refresh Page
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold">Overview</h1>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setShowFilters((prev) => !prev)}>
            <FilterIcon className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={resetFilters}>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-6 p-3 bg-muted/30 shadow-md border rounded-lg">
          {/* Product Filter */}
          <div>
            <label htmlFor="product-filter" className="block text-sm font-medium mb-1">
              Product
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
            <label htmlFor="status-filter" className="block text-sm font-medium mb-1">
              Status
            </label>
            <select
              id="status-filter"
              className="border rounded-md px-3 py-2 dark:bg-black w-full h-10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="country-filter" className="block text-sm font-medium mb-1">
              Country
            </label>
            <select
              id="country-filter"
              className="border rounded-md px-3 py-2 dark:bg-black w-full h-10"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
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

          <div className="sm:col-span-2 md:col-span-3 lg:col-span-5 flex justify-between">
            <Button variant="outline" size="sm" onClick={resetFilters} className="h-9">
              <XCircleIcon className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </div>
      )}

      {/* Key Metrics Cards - Matching the image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-5">
        {/* Total Leads Card */}
        <Card className="overflow-hidden border-orange-500">
          <div className="bg-orange-500 text-white p-2 pt-3">
            <h3 className="text-md font-bold uppercase">Total Leads</h3>
          </div>
          <CardContent className="p-4 pt-6 flex justify-center items-center">
            <p className="text-3xl font-bold">{metrics.totalLeads}</p>
          </CardContent>
        </Card>

        {/* Confirmation Rate Card */}
        <Card className="overflow-hidden border-blue-600 ">
          <div className="bg-blue-600 text-white p-2 pt-3">
            <h3 className="text-md font-bold uppercase">Confirmation Rate</h3>
          </div>
          <CardContent className="p-4 pt-6 flex justify-center items-center gap-4">
            <p className="text-2xl font-bold">{metrics.confirmation}</p>
            <p className="text-xl font-bold">{metrics.confirmationRate}%</p>
          </CardContent>
        </Card>

        {/* Delivery Rate Card */}
        <Card className="overflow-hidden border-green-500">
          <div className="bg-green-500 text-white p-2 pt-3">
            <h3 className="text-md font-bold uppercase">Delivery Rate</h3>
          </div>
          <CardContent className="p-4 pt-6 flex justify-center items-center gap-4">
            <p className="text-2xl font-bold">{metrics.delivery}</p>
            <p className="text-xl font-bold">{metrics.deliveryRate}%</p>
          </CardContent>
        </Card>

        {/* Return Rate Card */}
        <Card className="overflow-hidden border-red-600">
          <div className="bg-red-600 text-white p-2 pt-3">
            <h3 className="text-md font-bold uppercase">Return Rate</h3>
          </div>
          <CardContent className="p-4 pt-6 flex justify-center items-center gap-4">
            <p className="text-2xl font-bold">{metrics.returned}</p>
            <p className="text-xl font-bold">{metrics.returnRate}%</p>
          </CardContent>
        </Card>

        {/* In Process Rate Card */}
        <Card className="overflow-hidden border-purple-600 ">
          <div className="bg-purple-600 text-white p-2 pt-3">
            <h3 className="text-md font-bold uppercase">In Process Rate</h3>
          </div>
          <CardContent className="p-4 pt-6 flex justify-center items-center gap-4">
            <p className="text-2xl font-bold">{metrics.inProcess}</p>
            <p className="text-xl font-bold">{metrics.inProcessRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <h4 className="text-md mt-5 font-semibold mb-3">Visual Data Representations</h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Status Distribution Chart */}
        <Card className="p-3">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl text-center">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} orders (${((value / metrics.totalLeads) * 100).toFixed(1)}%)`,
                      name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Countries Chart */}
        <Card className="p-3">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl text-center">Top Countries by Order Volume</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length && countryChartData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} orders (${props.payload.percentage.toFixed(1)}%)`,
                      "Orders",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Orders" fill="#8884d8">
                    {countryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Column Chart */}
      <div className="mb-5">
        <Card className="p-3">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl text-center">Order Status Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={statusChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} />
                  <YAxis label={{ value: "Number of Orders", angle: -90, position: "insideLeft" }} />
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} orders (${props.payload.percentage.toFixed(1)}%)`,
                      "Count",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Order Count" fill="#8884d8">
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          <strong>Metrics Calculation:</strong>
        </p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>
            <strong>Confirmation:</strong> Orders with status {statusConfig.confirmation.join(", ")}
          </li>
          <li>
            <strong>Delivery:</strong> Orders with status {statusConfig.delivery.join(", ")}
          </li>
          <li>
            <strong>Returned:</strong> Orders with status {statusConfig.returned.join(", ")}
          </li>
          <li>
            <strong>In Process:</strong> Orders with status {statusConfig.inProcess.join(", ")}
          </li>
        </ul>
        {filteredOrders.length !== orders.length && (
          <p className="mt-2">
            <strong>Filtered Data:</strong> Showing statistics for {filteredOrders.length} of {orders.length} total
            orders.
            {productFilter && (
              <span>
                {" "}
                Product: <strong>{productFilter}</strong>
              </span>
            )}
            {statusFilter && (
              <span>
                {" "}
                Status: <strong>{statusFilter}</strong>
              </span>
            )}
            {countryFilter && (
              <span>
                {" "}
                Country: <strong>{countryFilter}</strong>
              </span>
            )}
            {(startDate || endDate) && (
              <span>
                {" "}
                Date range: <strong>{startDate ? format(startDate, "PP") : "Any"}</strong> to{" "}
                <strong>{endDate ? format(endDate, "PP") : "Any"}</strong>
              </span>
            )}
          </p>
        )}
      </div>
    </main>
  )
}
