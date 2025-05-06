"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format, subDays } from "date-fns"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CalendarIcon,
  FilterIcon,
  RefreshCwIcon,
  XCircleIcon,
  BarChart3Icon,
  LineChartIcon,
  MapPinIcon,
  PackageIcon,
  DownloadIcon,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { useStatusConfig } from "@/contexts/status-config-context"
import { matchesStatus } from "@/lib/status-config"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function Page() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const isMobile = useMobile()

  // Get status configuration from context
  const { statusConfig } = useStatusConfig()

  // Filter states
  const [statusFilter, setStatusFilter] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [cityFilter, setCityFilter] = useState("")
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

  // Extract unique values for filters
  const uniqueValues = useMemo(() => {
    if (!orders.length) return { statuses: [], products: [], cities: [], countries: [] }

    const statuses = [...new Set(orders.map((order) => order["STATUS"]).filter(Boolean))].sort()
    const products = [...new Set(orders.map((order) => order["sku number"]).filter(Boolean))].sort()
    const cities = [...new Set(orders.map((order) => order["City"]).filter(Boolean))].sort()
    const countries = [...new Set(orders.map((order) => order["Receier Country*"]).filter(Boolean))].sort()

    return { statuses, products, cities, countries }
  }, [orders])

  // Apply time range filter
  const applyTimeRangeFilter = useCallback(
    (range) => {
      setTimeRange(range)
      const today = new Date()

      switch (range) {
        case "7days":
          setStartDate(subDays(today, 7))
          setEndDate(today)
          break
        case "30days":
          setStartDate(subDays(today, 30))
          setEndDate(today)
          break
        case "90days":
          setStartDate(subDays(today, 90))
          setEndDate(today)
          break
        case "custom":
          // Keep current custom dates
          break
        default:
          // "all"
          setStartDate(null)
          setEndDate(null)
          break
      }
    },
    [setTimeRange, setStartDate, setEndDate],
  )

  // Reset all filters
  const resetFilters = useCallback(() => {
    setTimeRange("all")
    setStartDate(null)
    setEndDate(null)
    setStatusFilter("")
    setProductFilter("")
    setCityFilter("")
    setCountryFilter("")
  }, [])

  // Apply filters to orders
  const filteredOrders = useMemo(() => {
    if (!orders.length) return []

    return orders.filter((order) => {
      // Date filter
      if (startDate || endDate) {
        const orderDate = new Date(order["Order date"])
        if (startDate && orderDate < startDate) return false
        if (endDate) {
          const endDatePlusOne = new Date(endDate)
          endDatePlusOne.setDate(endDatePlusOne.getDate() + 1)
          if (orderDate >= endDatePlusOne) return false
        }
      }

      // Status filter
      if (statusFilter && order["STATUS"] !== statusFilter) return false

      // Product filter
      if (productFilter && order["sku number"] !== productFilter) return false

      // City filter
      if (cityFilter && order["City"] !== cityFilter) return false

      // Country filter
      if (countryFilter && order["Receier Country*"] !== countryFilter) return false

      return true
    })
  }, [orders, startDate, endDate, statusFilter, productFilter, cityFilter, countryFilter])

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
        totalRevenue: 0,
        avgOrderValue: 0,
        totalQuantity: 0,
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

    // Calculate revenue metrics
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      const amount = Number.parseFloat(order["Cod Amount"]) || 0
      return sum + amount
    }, 0)

    const totalQuantity = filteredOrders.reduce((sum, order) => {
      const qty = Number.parseFloat(order["Quantity"]) || 0
      return sum + qty
    }, 0)

    const avgOrderValue = totalLeads > 0 ? totalRevenue / totalLeads : 0

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
      totalRevenue,
      avgOrderValue,
      totalQuantity,
    }
  }, [filteredOrders, statusConfig])

  // Prepare data for charts
  const chartData = useMemo(() => {
    if (!filteredOrders.length) return {}

    // Status distribution data
    const statusCounts = filteredOrders.reduce((acc, order) => {
      const status = order["STATUS"] || "Unknown"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      percentage: (value / filteredOrders.length) * 100,
    }))

    // City distribution data
    const cityCounts = filteredOrders.reduce((acc, order) => {
      const city = order["City"] || "Unknown"
      acc[city] = (acc[city] || 0) + 1
      return acc
    }, {})

    const cityData = Object.entries(cityCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / filteredOrders.length) * 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 cities

    // Country distribution data
    const countryCounts = filteredOrders.reduce((acc, order) => {
      const country = order["Receier Country*"] || "Unknown"
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {})

    const countryData = Object.entries(countryCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / filteredOrders.length) * 100,
      }))
      .sort((a, b) => b.value - a.value)

    // Product distribution data
    const productCounts = filteredOrders.reduce((acc, order) => {
      const product = order["sku number"] || "Unknown"
      acc[product] = (acc[product] || 0) + 1
      return acc
    }, {})

    const productData = Object.entries(productCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / filteredOrders.length) * 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 products

    // Time series data (orders by date)
    const ordersByDate = filteredOrders.reduce((acc, order) => {
      const date = order["Order date"] ? order["Order date"].split("T")[0] : "Unknown"
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          revenue: 0,
          quantity: 0,
        }
      }
      acc[date].count += 1
      acc[date].revenue += Number.parseFloat(order["Cod Amount"]) || 0
      acc[date].quantity += Number.parseFloat(order["Quantity"]) || 0
      return acc
    }, {})

    // Convert to array and sort by date
    const timeSeriesData = Object.values(ordersByDate)
      .filter((item) => item.date !== "Unknown")
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    // Calculate cumulative data
    let cumulativeOrders = 0
    let cumulativeRevenue = 0
    const cumulativeData = timeSeriesData.map((item) => {
      cumulativeOrders += item.count
      cumulativeRevenue += item.revenue
      return {
        ...item,
        cumulativeOrders,
        cumulativeRevenue,
      }
    })

    // Product performance data (combining quantity, revenue, and order count)
    const productPerformance = Object.entries(productCounts).map(([product, orderCount]) => {
      const productOrders = filteredOrders.filter((order) => order["sku number"] === product)
      const revenue = productOrders.reduce((sum, order) => sum + (Number.parseFloat(order["Cod Amount"]) || 0), 0)
      const quantity = productOrders.reduce((sum, order) => sum + (Number.parseFloat(order["Quantity"]) || 0), 0)
      const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0

      return {
        product,
        orderCount,
        revenue,
        quantity,
        avgOrderValue,
      }
    })

    // Status transition over time
    const statusByMonth = {}
    filteredOrders.forEach((order) => {
      if (!order["Order date"]) return
      const date = new Date(order["Order date"])
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const status = order["STATUS"] || "Unknown"

      if (!statusByMonth[monthYear]) {
        statusByMonth[monthYear] = {
          month: monthYear,
          total: 0,
        }
        // Initialize all statuses to 0
        uniqueValues.statuses.forEach((s) => {
          statusByMonth[monthYear][s] = 0
        })
      }

      statusByMonth[monthYear][status] = (statusByMonth[monthYear][status] || 0) + 1
      statusByMonth[monthYear].total += 1
    })

    // Convert to array and sort by month
    const statusOverTime = Object.values(statusByMonth).sort((a, b) => a.month.localeCompare(b.month))

    // Calculate status percentages for each month
    const statusPercentageOverTime = statusOverTime.map((month) => {
      const result = { month: month.month }
      uniqueValues.statuses.forEach((status) => {
        result[status] = month.total > 0 ? (month[status] / month.total) * 100 : 0
      })
      return result
    })

    // Radar chart data for product metrics
    const topProducts = productPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((product) => ({
        product: product.product,
        revenue: product.revenue,
        quantity: product.quantity,
        orders: product.orderCount,
        avgValue: product.avgOrderValue,
      }))

    return {
      statusData,
      cityData,
      countryData,
      productData,
      timeSeriesData,
      cumulativeData,
      productPerformance,
      statusOverTime,
      statusPercentageOverTime,
      topProducts,
    }
  }, [filteredOrders, uniqueValues.statuses])

  // Chart colors
  const COLORS = [
    "#4CAF50",
    "#F44336",
    "#2196F3",
    "#FF9800",
    "#9C27B0",
    "#607D8B",
    "#E91E63",
    "#3F51B5",
    "#009688",
    "#795548",
  ]

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "—"

    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Export chart data as CSV
  const exportChartData = (data, filename) => {
    if (!data || !data.length) return

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Add headers based on first object keys
    const headers = Object.keys(data[0])
    csvContent += headers.join(",") + "\n"

    // Add rows
    data.forEach((item) => {
      const row = headers.map((header) => {
        const value = item[header]
        // Handle strings with commas by wrapping in quotes
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`
        }
        return value
      })
      csvContent += row.join(",") + "\n"
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)

    // Trigger download
    link.click()
    document.body.removeChild(link)
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
            <RefreshCwIcon className="mr-1 h-4 w-4" /> Refresh Page
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-5 md:items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Analyzing {filteredOrders.length} orders from {startDate ? format(startDate, "MMM d, yyyy") : "all time"} to{" "}
            {endDate ? format(endDate, "MMM d, yyyy") : "present"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Select value={timeRange} onValueChange={applyTimeRangeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9" onClick={() => setShowFilters(!showFilters)}>
            <FilterIcon className="mr-1 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>

          <Button variant="outline" size="sm" className="h-9" onClick={() => window.location.reload()}>
            <RefreshCwIcon className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <FilterIcon className="mr-1 h-4 w-4" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            <CardDescription>Refine your dashboard view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {/* Date Range */}
              {timeRange === "custom" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
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
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          disabled={(date) => (startDate ? date < startDate : false)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueValues.statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {uniqueValues.products.map((product) => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {uniqueValues.cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {uniqueValues.countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={resetFilters} className="mr-1">
                <XCircleIcon className="mr-1 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
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

      {/* Tabs for different dashboard views */}
      <Tabs defaultValue="overview" className="mb-6 w-full" onValueChange={setActiveTab}>
        <div className="overflow-x-auto py-3">
          <TabsList className="w-full inline-flex whitespace-nowrap">
            {[
              { value: "overview", icon: BarChart3Icon, label: "Overview" },
              { value: "trends", icon: LineChartIcon, label: "Trends" },
              { value: "products", icon: PackageIcon, label: "Products" },
              { value: "geography", icon: MapPinIcon, label: "Geography" },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`flex items-center px-4 sm:px-7 ${
                  activeTab === tab.value ? "border-b-2 border-b-mainColor" : ""
                }`}
              >
                <tab.icon className="mr-1 sm:mr-1 h-3 sm:h-4 w-3 sm:w-4" />
                <span className="text-xs sm:text-sm">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Distribution */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Order Status Distribution</CardTitle>
                  <CardDescription>Breakdown of orders by status</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportChartData(chartData.statusData, "status-distribution")}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {chartData.statusData && chartData.statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {chartData.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name, props) => [
                          `${value} orders (${props.payload.percentage.toFixed(1)}%)`,
                          name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Orders Over Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Orders Over Time</CardTitle>
                  <CardDescription>Daily order volume</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportChartData(chartData.timeSeriesData, "orders-over-time")}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {chartData.timeSeriesData && chartData.timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => {
                          try {
                            return format(new Date(date), "MMM d")
                          } catch (e) {
                            return date
                          }
                        }}
                      />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value, name) => [value, name === "count" ? "Orders" : name]}
                        labelFormatter={(label) => {
                          try {
                            return format(new Date(label), "MMM d, yyyy")
                          } catch (e) {
                            return label
                          }
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Orders"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Column Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Order Status Comparison</CardTitle>
                <CardDescription>Number of orders by status</CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => exportChartData(chartData.statusData, "status-comparison")}
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {chartData.statusData && chartData.statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData.statusData} margin={{ top: 10, right: 30, left: 20, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} />
                      <YAxis label={{ value: "Number of Orders", angle: -90, position: "insideLeft" }} />
                      <RechartsTooltip
                        formatter={(value, name, props) => [
                          `${value} orders (${props.payload.percentage.toFixed(1)}%)`,
                          "Count",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Order Count" fill="#8884d8">
                        {chartData.statusData.map((entry, index) => (
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
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
            {/* Revenue and Orders Over Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Revenue and Orders Over Time</CardTitle>
                  <CardDescription>Daily revenue and order count</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportChartData(chartData.timeSeriesData, "revenue-orders-time")}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {chartData.timeSeriesData && chartData.timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={chartData.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => {
                          try {
                            return format(new Date(date), "MMM d")
                          } catch (e) {
                            return date
                          }
                        }}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip
                        formatter={(value, name) => [
                          name === "revenue" ? formatCurrency(value) : value,
                          name === "revenue" ? "Revenue" : "Orders",
                        ]}
                        labelFormatter={(label) => {
                          try {
                            return format(new Date(label), "MMM d, yyyy")
                          } catch (e) {
                            return label
                          }
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" name="Orders" fill="#8884d8" yAxisId="left" barSize={20} fillOpacity={0.8} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#ff7300"
                        yAxisId="right"
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px]">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cumulative Growth */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Cumulative Growth</CardTitle>
                  <CardDescription>Total orders and revenue over time</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportChartData(chartData.cumulativeData, "cumulative-growth")}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {chartData.cumulativeData && chartData.cumulativeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData.cumulativeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => {
                          try {
                            return format(new Date(date), "MMM d")
                          } catch (e) {
                            return date
                          }
                        }}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip
                        formatter={(value, name) => [
                          name === "cumulativeRevenue" ? formatCurrency(value) : value,
                          name === "cumulativeRevenue" ? "Total Revenue" : "Total Orders",
                        ]}
                        labelFormatter={(label) => {
                          try {
                            return format(new Date(label), "MMM d, yyyy")
                          } catch (e) {
                            return label
                          }
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cumulativeOrders"
                        name="Total Orders"
                        stroke="#8884d8"
                        yAxisId="left"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulativeRevenue"
                        name="Total Revenue"
                        stroke="#ff7300"
                        yAxisId="right"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px]">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Top Products</CardTitle>
                  <CardDescription>Most ordered products</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportChartData(chartData.productData, "top-products")}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {chartData.productData && chartData.productData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={chartData.productData.slice(0, 5)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <RechartsTooltip
                        formatter={(value, name, props) => [
                          `${value} orders (${props.payload.percentage.toFixed(1)}%)`,
                          "Orders",
                        ]}
                      />
                      <Bar dataKey="value" name="Orders" fill="#8884d8">
                        {chartData.productData.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Radar Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Top 5 Products Comparison</CardTitle>
                  <CardDescription>Multi-dimensional comparison</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportChartData(chartData.topProducts, "top-products-comparison")}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {chartData.topProducts && chartData.topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart outerRadius={150} data={chartData.topProducts}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="product" />
                      <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
                      <Radar name="Revenue" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name="Quantity" dataKey="quantity" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                      <Radar name="Orders" dataKey="orders" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                      <Legend />
                      <RechartsTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px]">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Country Distribution */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Country Distribution</CardTitle>
                  <CardDescription>Orders by country</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportChartData(chartData.countryData, "country-distribution")}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {chartData.countryData && chartData.countryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={chartData.countryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {chartData.countryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name, props) => [
                          `${value} orders (${props.payload.percentage.toFixed(1)}%)`,
                          name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px]">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* City Distribution */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>City Distribution</CardTitle>
                  <CardDescription>Top 10 cities by order volume</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportChartData(chartData.cityData, "city-distribution")}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export as CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {chartData.cityData && chartData.cityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={chartData.cityData.slice(0, 10)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value, name, props) => [
                          `${value} orders (${props.payload.percentage.toFixed(1)}%)`,
                          "Orders",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Orders" fill="#8884d8">
                        {chartData.cityData.slice(0, 10).map((entry, index) => (
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
        </TabsContent>
      </Tabs>

      {/* Metrics Calculation Info */}
      <div className="mt-4 text-sm border-t p-1 pt-2 text-muted-foreground">
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
            {cityFilter && (
              <span>
                {" "}
                City: <strong>{cityFilter}</strong>
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
