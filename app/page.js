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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  FilterIcon,
  RefreshCwIcon,
  PackageIcon,
  DollarSignIcon,
  TruckIcon,
  BarChart3Icon,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

export default function Page() {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const isMobile = useMobile()

  // Filter states
  const [statusFilter, setStatusFilter] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
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

  // Apply filters to the data
  const applyFilters = useCallback(() => {
    if (!orders.length) return

    const filtered = orders.filter((order) => {
      const matchesStatus = !statusFilter || order["STATUS"] === statusFilter
      const matchesCountry = !countryFilter || order["Receier Country*"] === countryFilter

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

      return matchesStatus && matchesCountry && matchesDateRange
    })

    setFilteredOrders(filtered)
  }, [orders, statusFilter, countryFilter, startDate, endDate])

  // Reset filters
  const resetFilters = useCallback(() => {
    setStatusFilter("")
    setCountryFilter("")
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

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!filteredOrders.length)
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        deliveredOrders: 0,
        deliveryRate: 0,
      }

    const totalOrders = filteredOrders.length

    const totalRevenue = filteredOrders.reduce((sum, order) => {
      const amount = Number.parseFloat(order["Cod Amount"]) || 0
      return sum + amount
    }, 0)

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const deliveredOrders = filteredOrders.filter((order) => order["STATUS"] === "Delivered").length
    const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      deliveredOrders,
      deliveryRate,
    }
  }, [filteredOrders])

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
      <main className="p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-12 w-1/2" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        <h1 className="text-3xl font-bold">Orders Dashboard</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
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

          <div className="sm:col-span-2 md:col-span-4 flex justify-end">
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="overflow-hidden">
          <CardHeader className="bg-green-500 text-white p-4 pb-2">
            <CardTitle className="flex items-center text-lg">
              <PackageIcon className="mr-2 h-5 w-5" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-3xl font-bold">{metrics.totalOrders}</p>
            <p className="text-sm text-muted-foreground">
              {filteredOrders.length !== orders.length ? `Filtered from ${orders.length} total orders` : "All orders"}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-blue-500 text-white p-4 pb-2">
            <CardTitle className="flex items-center text-lg">
              <DollarSignIcon className="mr-2 h-5 w-5" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-3xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">Avg. {formatCurrency(metrics.averageOrderValue)} per order</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-purple-500 text-white p-4 pb-2">
            <CardTitle className="flex items-center text-lg">
              <TruckIcon className="mr-2 h-5 w-5" />
              Delivered Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-3xl font-bold">{metrics.deliveredOrders}</p>
            <p className="text-sm text-muted-foreground">{metrics.deliveryRate.toFixed(1)}% delivery rate</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-amber-500 text-white p-4 pb-2">
            <CardTitle className="flex items-center text-lg">
              <BarChart3Icon className="mr-2 h-5 w-5" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex flex-wrap gap-1">
              {statusChartData.slice(0, 3).map((status, index) => (
                <Badge key={status.name} variant="outline" className="bg-muted/30">
                  {status.name}: {status.value}
                </Badge>
              ))}
              {statusChartData.length > 3 && (
                <Badge variant="outline" className="bg-muted/30">
                  +{statusChartData.length - 3} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution Chart */}
        <Card className="p-4">
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
                      `${value} orders (${((value / metrics.totalOrders) * 100).toFixed(1)}%)`,
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
        <Card className="p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl text-center">Top Countries by Order Volume</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length && countryChartData.length ? (
              <ResponsiveContainer width="100%" height={350}>
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
    </main>
  )
}
