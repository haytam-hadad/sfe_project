"use client"

import { useState, useEffect, useMemo } from "react"
import { useApp, useSheetData, useFilters, useStatusConfig } from "@/contexts/app-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  LoaderCircle,
  Search,
  DollarSign,
  TrendingUp,
  BarChart3,
  CalendarIcon,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  AlertCircle,
  MapPin,
  Globe,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { matchesStatus } from "@/lib/constants"

export default function AdsStatsPage() {
  const { toast } = useToast()
  const { token } = useAuth()
  const { sheetData, loadingSheetData, errorSheetData, refreshSheetData } = useSheetData()
  const { filters, updateFilter, resetFilters } = useFilters()
  const { formatCurrency } = useApp()
  const { statusConfig } = useStatusConfig()

  const [searchTerm, setSearchTerm] = useState("")
  const [productCosts, setProductCosts] = useState({}) // Cost price - stored in localStorage

  // Ad costs for different platforms
  const [adFbCosts, setAdFbCosts] = useState({})
  const [adTtCosts, setAdTtCosts] = useState({})
  const [adGoogleCosts, setAdGoogleCosts] = useState({})
  const [adXCosts, setAdXCosts] = useState({})
  const [adSnapCosts, setAdSnapCosts] = useState({})

  const [sortField, setSortField] = useState("totalOrders")
  const [sortDirection, setSortDirection] = useState("desc")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Local filters for this page
  const [localFilters, setLocalFilters] = useState({
    minAmount: "",
    maxAmount: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  // Available countries and cities for filtering
  const [availableCountries, setAvailableCountries] = useState([])
  const [availableCities, setAvailableCities] = useState([])

  // Load saved costs from localStorage on component mount
  useEffect(() => {
    try {
      const savedCosts = localStorage.getItem("productCosts")
      if (savedCosts) {
        const parsedCosts = JSON.parse(savedCosts)
        setProductCosts(parsedCosts)
      }

      // Load ad costs from localStorage
      const savedAdFbCosts = localStorage.getItem("adFbCosts")
      if (savedAdFbCosts) {
        setAdFbCosts(JSON.parse(savedAdFbCosts))
      }

      const savedAdTtCosts = localStorage.getItem("adTtCosts")
      if (savedAdTtCosts) {
        setAdTtCosts(JSON.parse(savedAdTtCosts))
      }

      const savedAdGoogleCosts = localStorage.getItem("adGoogleCosts")
      if (savedAdGoogleCosts) {
        setAdGoogleCosts(JSON.parse(savedAdGoogleCosts))
      }

      const savedAdXCosts = localStorage.getItem("adXCosts")
      if (savedAdXCosts) {
        setAdXCosts(JSON.parse(savedAdXCosts))
      }

      const savedAdSnapCosts = localStorage.getItem("adSnapCosts")
      if (savedAdSnapCosts) {
        setAdSnapCosts(JSON.parse(savedAdSnapCosts))
      }
    } catch (error) {
      console.error("Error loading saved costs:", error)
    }
  }, [])

  // Extract amount from an order with various possible field names
  const extractAmount = (order) => {
    const amountFields = ["Cod Amount", "Order Value", "Price", "Total", "Amount", "Value", "Revenue"]

    for (const field of amountFields) {
      const value = order[field]
      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "number") {
          return value
        } else if (typeof value === "string") {
          // Remove any non-numeric characters except for decimal points
          const cleanedValue = value.replace(/[^0-9.]/g, "")
          const numValue = Number.parseFloat(cleanedValue)
          if (!isNaN(numValue)) {
            return numValue
          }
        }
      }
    }
    return 0
  }

  // Extract quantity from an order
  const extractQuantity = (order) => {
    const qtyFields = ["Quantity", "Qty", "Count", "Units"]

    for (const field of qtyFields) {
      const value = order[field]
      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "number") {
          return value
        } else if (typeof value === "string") {
          const cleanedValue = value.replace(/[^0-9]/g, "")
          const numValue = Number.parseInt(cleanedValue)
          if (!isNaN(numValue)) {
            return numValue
          }
        }
      }
    }
    return 1 // Default to 1 if no quantity found
  }

  // Fetch data if not already loaded
  useEffect(() => {
    if (token && (!sheetData || sheetData.length === 0) && !loadingSheetData) {
      refreshSheetData(token)
    }
  }, [token, sheetData, loadingSheetData, refreshSheetData])

  // Extract only delivered orders from sheet data
  const deliveredOrders = useMemo(() => {
    if (!sheetData || !sheetData.length) return []

    return sheetData.filter((order) => {
      const status = order["STATUS"] || ""
      return matchesStatus(status, statusConfig.delivery)
    })
  }, [sheetData, statusConfig])

  // Extract available countries and cities from delivered orders
  useEffect(() => {
    if (deliveredOrders.length > 0) {
      const countries = new Set()
      const cities = new Set()

      deliveredOrders.forEach((order) => {
        const country = order["Receiver Country"]
        const city = order["City"]

        if (country) countries.add(country)
        if (city) cities.add(city)
      })

      setAvailableCountries(Array.from(countries).sort())
      setAvailableCities(Array.from(cities).sort())
    }
  }, [deliveredOrders])

  // Process data with only delivered orders
  const processedData = useMemo(() => {
    if (!deliveredOrders.length) return []

    const productMap = new Map()

    deliveredOrders.forEach((order) => {
      const product = order["Product Name"] || order["sku number"] || order["product"]
      if (!product) return

      const orderDate = order["Order date"] ? new Date(order["Order date"]) : null
      const country = order["Receiver Country"] || ""
      const city = order["City"] || ""

      // Apply date filters
      if (filters.startDate && orderDate && orderDate < new Date(filters.startDate)) {
        return
      }
      if (filters.endDate) {
        const endDatePlusOne = new Date(filters.endDate)
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1)
        if (orderDate && orderDate >= endDatePlusOne) {
          return
        }
      }

      // Apply product filter
      if (filters.product && product !== filters.product) {
        return
      }

      // Apply city filter
      if (filters.city && city && city !== filters.city) {
        return
      }

      // Apply country filter
      if (filters.country && country && country !== filters.country) {
        return
      }

      if (!productMap.has(product)) {
        productMap.set(product, {
          productName: product,
          totalOrders: 0,
          totalAmount: 0,
          orderAmounts: [], // Track all order amounts to calculate average
          totalQuantity: 0,
        })
      }

      const productData = productMap.get(product)
      productData.totalOrders++

      // Get quantity
      const quantity = extractQuantity(order)
      productData.totalQuantity += quantity

      // Try to find amount in various possible field names
      const amount = extractAmount(order)
      if (amount) {
        productData.totalAmount += amount
        // Add this order's amount to the array for averaging later
        productData.orderAmounts.push(amount)
      }
    })

    // Calculate average selling price for each product
    productMap.forEach((product) => {
      if (product.orderAmounts.length > 0) {
        // Calculate average selling price from delivered orders
        product.sellingPrice =
          product.orderAmounts.reduce((sum, amount) => sum + amount, 0) / product.orderAmounts.length
      } else {
        product.sellingPrice = 0
      }
      // Remove the orderAmounts array as it's no longer needed
      delete product.orderAmounts
    })

    let result = Array.from(productMap.values())

    // Apply local numeric filters
    if (localFilters.minAmount) {
      result = result.filter((item) => item.totalAmount >= Number(localFilters.minAmount))
    }
    if (localFilters.maxAmount) {
      result = result.filter((item) => item.totalAmount <= Number(localFilters.maxAmount))
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter((item) => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Sort data
    result.sort((a, b) => {
      let fieldA, fieldB

      if (sortField === "productName") {
        fieldA = a.productName
        fieldB = b.productName
        return sortDirection === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
      } else if (sortField === "sellingPrice") {
        fieldA = a.sellingPrice
        fieldB = b.sellingPrice
      } else {
        fieldA = a[sortField]
        fieldB = b[sortField]
      }
      return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA
    })

    return result
  }, [deliveredOrders, searchTerm, filters, localFilters, sortField, sortDirection])

  // Save costs to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("productCosts", JSON.stringify(productCosts))
      localStorage.setItem("adFbCosts", JSON.stringify(adFbCosts))
      localStorage.setItem("adTtCosts", JSON.stringify(adTtCosts))
      localStorage.setItem("adGoogleCosts", JSON.stringify(adGoogleCosts))
      localStorage.setItem("adXCosts", JSON.stringify(adXCosts))
      localStorage.setItem("adSnapCosts", JSON.stringify(adSnapCosts))
    } catch (error) {
      console.error("Error saving costs:", error)
    }
  }, [productCosts, adFbCosts, adTtCosts, adGoogleCosts, adXCosts, adSnapCosts])

  const handleCostChange = (productName, value) => {
    setProductCosts((prev) => ({
      ...prev,
      [productName]: value,
    }))
  }

  const handleAdCostChange = (platform, productName, value) => {
    switch (platform) {
      case "fb":
        setAdFbCosts((prev) => ({ ...prev, [productName]: value }))
        break
      case "tt":
        setAdTtCosts((prev) => ({ ...prev, [productName]: value }))
        break
      case "google":
        setAdGoogleCosts((prev) => ({ ...prev, [productName]: value }))
        break
      case "x":
        setAdXCosts((prev) => ({ ...prev, [productName]: value }))
        break
      case "snap":
        setAdSnapCosts((prev) => ({ ...prev, [productName]: value }))
        break
    }
  }

  // Calculate total ad cost for a product
  const calculateTotalAdCost = (productName) => {
    const fbCost = Number.parseFloat(adFbCosts[productName] || 0)
    const ttCost = Number.parseFloat(adTtCosts[productName] || 0)
    const googleCost = Number.parseFloat(adGoogleCosts[productName] || 0)
    const xCost = Number.parseFloat(adXCosts[productName] || 0)
    const snapCost = Number.parseFloat(adSnapCosts[productName] || 0)

    return fbCost + ttCost + googleCost + xCost + snapCost
  }

  // Calculate average cost per order
  const calculateAverageCost = (product) => {
    const totalAdCost = calculateTotalAdCost(product.productName)
    return product.totalOrders > 0 ? totalAdCost / product.totalOrders : 0
  }

  // Calculate total cost with new formula
  const calculateTotalCost = (product) => {
    const costPrice = Number.parseFloat(productCosts[product.productName] || 0)
    const avgCost = calculateAverageCost(product)

    // New formula: (avg cost * total orders) + (cost price * total qty)
    return avgCost * product.totalOrders + costPrice * product.totalQuantity
  }

  // Updated export function with new columns
  const handleExport = () => {
    if (!processedData.length) return

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Add headers with new columns
    csvContent +=
      "Product Name,Total Orders,Total Quantity,Selling Price,Total Amount,AD FB,AD TT,AD GOOGLE,AD X,AD SNAP,Cost Price,Average Cost,Total Cost\n"

    // Add data rows with new columns
    processedData.forEach((product) => {
      const fbCost = Number.parseFloat(adFbCosts[product.productName] || 0)
      const ttCost = Number.parseFloat(adTtCosts[product.productName] || 0)
      const googleCost = Number.parseFloat(adGoogleCosts[product.productName] || 0)
      const xCost = Number.parseFloat(adXCosts[product.productName] || 0)
      const snapCost = Number.parseFloat(adSnapCosts[product.productName] || 0)
      const costPrice = Number.parseFloat(productCosts[product.productName] || 0)
      const avgCost = calculateAverageCost(product)
      const totalCost = calculateTotalCost(product)

      csvContent += `"${product.productName}",${product.totalOrders},${product.totalQuantity},${product.sellingPrice.toFixed(2)},${product.totalAmount.toFixed(2)},${fbCost.toFixed(2)},${ttCost.toFixed(2)},${googleCost.toFixed(2)},${xCost.toFixed(2)},${snapCost.toFixed(2)},${costPrice.toFixed(2)},${avgCost.toFixed(2)},${totalCost.toFixed(2)}\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `delivered-products-analysis-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)

    // Trigger download
    link.click()
    document.body.removeChild(link)
  }

  // Update the resetLocalFilters function to use the shared resetAllFilters
  const resetLocalFilters = () => {
    setLocalFilters({
      minAmount: "",
      maxAmount: "",
    })

    // Save the reset state to localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("localFilters")
    }
  }

  // Update the handleResetAllFilters function to use the shared resetAllFilters
  const handleResetAllFilters = () => {
    resetFilters()
    resetLocalFilters()
    setSearchTerm("")

    // Save the reset state to localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("searchTerm")
    }
  }

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Calculate pagination
  const indexOfLastItem = currentPage * rowsPerPage
  const indexOfFirstItem = indexOfLastItem - rowsPerPage
  const currentItems = processedData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(processedData.length / rowsPerPage)

  // Calculate totals with updated metrics
  const totals = useMemo(() => {
    if (!processedData.length)
      return {
        totalOrders: 0,
        totalAmount: 0,
        totalAdCost: 0,
        totalCost: 0,
        totalQuantity: 0,
      }

    const totalOrders = processedData.reduce((sum, product) => sum + product.totalOrders, 0)
    const totalAmount = processedData.reduce((sum, product) => sum + product.totalAmount, 0)
    const totalQuantity = processedData.reduce((sum, product) => sum + product.totalQuantity, 0)

    let totalFbCost = 0
    let totalTtCost = 0
    let totalGoogleCost = 0
    let totalXCost = 0
    let totalSnapCost = 0
    let totalCost = 0

    processedData.forEach((product) => {
      const fbCost = Number.parseFloat(adFbCosts[product.productName] || 0)
      const ttCost = Number.parseFloat(adTtCosts[product.productName] || 0)
      const googleCost = Number.parseFloat(adGoogleCosts[product.productName] || 0)
      const xCost = Number.parseFloat(adXCosts[product.productName] || 0)
      const snapCost = Number.parseFloat(adSnapCosts[product.productName] || 0)

      totalFbCost += fbCost
      totalTtCost += ttCost
      totalGoogleCost += googleCost
      totalXCost += xCost
      totalSnapCost += snapCost

      const cost = calculateTotalCost(product)
      totalCost += cost
    })

    const totalAdCost = totalFbCost + totalTtCost + totalGoogleCost + totalXCost + totalSnapCost

    return {
      totalOrders,
      totalAmount,
      totalAdCost,
      totalFbCost,
      totalTtCost,
      totalGoogleCost,
      totalXCost,
      totalSnapCost,
      totalCost,
      totalQuantity,
    }
  }, [processedData, adFbCosts, adTtCosts, adGoogleCosts, adXCosts, adSnapCosts, productCosts])

  // Handle refresh data
  const handleRefreshData = () => {
    if (token) {
      refreshSheetData(token)
      toast({
        title: "Refreshing data",
        description: "Fetching the latest data from your sheet.",
      })
    }
  }

  const formatNumber = (value) => {
    return `$${Number(value).toFixed(2)}`
  }

  if (loadingSheetData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (errorSheetData) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Delivered Products Analysis</h1>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-1">Error loading data: {errorSheetData}</AlertDescription>
        </Alert>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Button onClick={handleRefreshData}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Delivered Products Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Analyze delivered products performance and calculate costs
            {filters.country && <span> - {filters.country}</span>}
            {filters.city && <span> - {filters.city}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-1 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!processedData.length}>
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <h3 className="text-2xl font-bold">{processedData.length}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full dark:bg-blue-900">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Delivered Orders</p>
                <h3 className="text-2xl font-bold">{totals.totalOrders}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full dark:bg-green-900">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-yellow-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Delivered Revenue</p>
                <h3 className="text-2xl font-bold">{formatNumber(totals.totalAmount)}</h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full dark:bg-yellow-900">
                <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <h3 className="text-2xl font-bold">{formatNumber(totals.totalCost)}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full dark:bg-purple-900">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="mb-">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-md flex items-center">
                <Filter className="h-5 w-5 mr-1 text-mainColor" /> Filters
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleResetAllFilters}>
                <X className="h-4 w-4 mr-1 text-mainColor" />
                Clear All Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* All filters in one row */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Country Filter */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm font-medium flex items-center mb-1">
                  <Globe className="h-4 w-4 mr-1" /> Country
                </label>
                <Select
                  value={filters.country || ""}
                  onValueChange={(value) => updateFilter("country", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {[...new Set(
                      (sheetData || [])
                        .map((order) => order["Receiver Country"] || order["Receier Country"] || order["Country"])
                        .filter(Boolean)
                    )]
                      .sort((a, b) => a.localeCompare(b))
                      .map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm font-medium flex items-center mb-1">
                  <MapPin className="h-4 w-4 mr-1" /> City
                </label>
                <Select
                  value={filters.city || ""}
                  onValueChange={(value) => updateFilter("city", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {[...new Set(
                      (sheetData || [])
                        .map((order) => order["City"])
                        .filter(Boolean)
                    )]
                      .sort((a, b) => a.localeCompare(b))
                      .map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Filter */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm font-medium flex items-center mb-1">
                  <BarChart3 className="h-4 w-4 mr-1" /> Product
                </label>
                <Select
                  value={filters.product || ""}
                  onValueChange={(value) => updateFilter("product", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {[...new Set(
                      (sheetData || [])
                        .map((order) => order["Product Name"] || order["sku number"] || order["product"])
                        .filter(Boolean)
                    )]
                      .sort((a, b) => a.localeCompare(b))
                      .map((product) => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter (single input for range) */}
              <div className="flex-1 min-w-[220px]">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                        updateFilter("endDate", range?.to ? range.to.toISOString() : null)
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

      <Card className="border-t-4 border-t-blue-700">
        <CardHeader>
          <CardDescription>
            Analysis of delivered products only. Enter product costs to calculate profitability.
          </CardDescription>
          <div className="flex items-center space-x-2 mt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border border-b-2 border-b-mainColor"
              />
            </div>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 rows</SelectItem>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="20">20 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {deliveredOrders.length === 0 ? (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-1">
                No delivered orders found. This page only shows data for delivered orders.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Wrap table in a div with overflow-x-auto to make it horizontally scrollable */}
              <div className="max-w-full md:max-w-[65vw] lg:max-w-[70vw] m-auto shadow-sm border rounded-sm overflow-x-auto">
                <Table className="bg-gray-100 dark:bg-gray-900 w-full text-center">
                  <TableHeader className="sticky top-0 z-30 bg-gray-100 dark:bg-gray-900">
                    <TableRow className="cursor-pointer text-center">
                      <TableHead
                        className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 text-center min-w-[110px] border-r border-gray-300 dark:border-zinc-800 sticky left-0 z-20 bg-gray-100 dark:bg-gray-900"
                        onClick={() => handleSort("productName")}
                      >
                        Product Name
                        {sortField === "productName" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 text-center min-w-[100px]"
                        onClick={() => handleSort("totalOrders")}
                      >
                        Orders
                        {sortField === "totalOrders" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 text-center min-w-[100px]"
                        onClick={() => handleSort("totalQuantity")}
                      >
                        Total Qty
                        {sortField === "totalQuantity" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 text-center min-w-[140px]"
                        onClick={() => handleSort("sellingPrice")}
                      >
                        Avg Selling Price
                        {sortField === "sellingPrice" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 text-center min-w-[140px]"
                        onClick={() => handleSort("totalAmount")}
                      >
                        Total Amount
                        {sortField === "totalAmount" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center min-w-[140px]">
                        AD FB
                      </TableHead>
                      <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center min-w-[140px]">
                        AD TT
                      </TableHead>
                      <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center min-w-[140px]">
                        AD GOOGLE
                      </TableHead>
                      <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center min-w-[140px]">
                        AD X
                      </TableHead>
                      <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center min-w-[140px]">
                        AD SNAP
                      </TableHead>
                      <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center min-w-[140px]">
                        Cost Price
                      </TableHead>
                      <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center min-w-[140px]">
                        Average Cost
                      </TableHead>
                      <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center min-w-[140px]">
                        Total Cost
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.length > 0 ? (
                      currentItems.map((product) => {
                        const fbCost = Number.parseFloat(adFbCosts[product.productName] || 0)
                        const ttCost = Number.parseFloat(adTtCosts[product.productName] || 0)
                        const googleCost = Number.parseFloat(adGoogleCosts[product.productName] || 0)
                        const xCost = Number.parseFloat(adXCosts[product.productName] || 0)
                        const snapCost = Number.parseFloat(adSnapCosts[product.productName] || 0)
                        const costPrice = Number.parseFloat(productCosts[product.productName] || 0)
                        const avgCost = calculateAverageCost(product)
                        const totalCost = calculateTotalCost(product)

                        return (
                          <TableRow key={product.productName} className="text-center">
                            <TableCell className="font-medium min-w-[110px] border-r border-gray-300 dark:border-zinc-800 text-center sticky left-0 z-10 bg-gray-100 dark:bg-gray-900">
                              {product.productName}
                            </TableCell>
                            <TableCell className="text-center">{product.totalOrders}</TableCell>
                            <TableCell className="text-center">{product.totalQuantity}</TableCell>
                            <TableCell className="text-center">{formatNumber(product.sellingPrice)}</TableCell>
                            <TableCell className="text-center">{formatNumber(product.totalAmount)}</TableCell>
                            <TableCell className="text-center">
                              <div className="relative flex justify-center">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={adFbCosts[product.productName] || ""}
                                  onChange={(e) => handleAdCostChange("fb", product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-black dark:border-b-white text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={adTtCosts[product.productName] || ""}
                                  onChange={(e) => handleAdCostChange("tt", product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-black dark:border-b-white text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={adGoogleCosts[product.productName] || ""}
                                  onChange={(e) => handleAdCostChange("google", product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-black dark:border-b-white text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={adXCosts[product.productName] || ""}
                                  onChange={(e) => handleAdCostChange("x", product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-black dark:border-b-white text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={adSnapCosts[product.productName] || ""}
                                  onChange={(e) => handleAdCostChange("snap", product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-black dark:border-b-white text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={productCosts[product.productName] || ""}
                                  onChange={(e) => handleCostChange(product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-black dark:border-b-white text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{formatNumber(avgCost)}</TableCell>
                            <TableCell className="text-center">{formatNumber(totalCost)}</TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={14} className="h-24 text-center">
                          {processedData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center">
                              <p className="text-muted-foreground">No delivered products found</p>
                              {(searchTerm ||
                                Object.values(localFilters).some((v) => v) ||
                                filters.startDate ||
                                filters.endDate ||
                                filters.product ||
                                filters.city ||
                                filters.country) && (
                                <Button variant="ghost" size="sm" onClick={handleResetAllFilters} className="mt-2">
                                  Clear all filters
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Totals row */}
                    {currentItems.length > 0 && (
                      <TableRow className="bg-muted/50 font-medium text-center">
                        <TableCell className="text-mainColor font-bold min-w-[110px] border-r border-gray-300 dark:border-zinc-800 text-center sticky left-0 z-10 bg-muted/50">
                          TOTALS
                        </TableCell>
                        <TableCell className="text-center">{totals.totalOrders}</TableCell>
                        <TableCell className="text-center">{totals.totalQuantity}</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">{formatNumber(totals.totalAmount)}</TableCell>
                        <TableCell className="text-center">{formatNumber(totals.totalFbCost)}</TableCell>
                        <TableCell className="text-center">{formatNumber(totals.totalTtCost)}</TableCell>
                        <TableCell className="text-center">{formatNumber(totals.totalGoogleCost)}</TableCell>
                        <TableCell className="text-center">{formatNumber(totals.totalXCost)}</TableCell>
                        <TableCell className="text-center">{formatNumber(totals.totalSnapCost)}</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">{formatNumber(totals.totalCost)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {processedData.length > rowsPerPage && (
                <div className="flex items-center justify-between space-x-1 py-2 mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, processedData.length)} of{" "}
                    {processedData.length} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-3 py-1 border rounded">
                      {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
