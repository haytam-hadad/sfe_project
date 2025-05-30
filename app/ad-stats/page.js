"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { matchesStatus } from "@/lib/constants"
import { fetchCosts, updateProductCost, updateAdCost, deleteAllProductCosts, deleteAllAdCosts } from "@/lib/api-client"

export default function AdsStatsPage() {
  const { toast } = useToast()
  const { token } = useAuth()
  const { sheetData, loadingSheetData, errorSheetData, refreshSheetData } = useSheetData()
  const { filters, updateFilter, resetFilters } = useFilters()
  const { formatCurrency } = useApp()
  const { statusConfig } = useStatusConfig()

  const [searchTerm, setSearchTerm] = useState("")

  // Cost price - stored simply by product name (NOT date-dependent)
  const [productCosts, setProductCosts] = useState({}) // Structure: { "ProductName": "50.00" }

  // Ad costs for different platforms - stored by date and product (date-dependent)
  // Structure: { "2024-01-15": { "ProductName": { fb: 100, tt: 50, google: 75, x: 25, snap: 30 } } }
  const [adCostsByDate, setAdCostsByDate] = useState({})

  // Loading states for API calls
  const [loadingCosts, setLoadingCosts] = useState(false)
  const [savingCosts, setSavingCosts] = useState(false)
  const [deletingCosts, setDeletingCosts] = useState(false)

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

  // Load costs from backend on component mount
  useEffect(() => {
    if (token) {
      loadCostsFromBackend()
    }
  }, [token])

  // Load costs from backend
  const loadCostsFromBackend = async () => {
    if (!token) return

    setLoadingCosts(true)
    try {
      const data = await fetchCosts(token)
      setProductCosts(data.productCosts || {})
      setAdCostsByDate(data.adCostsByDate || {})
    } catch (error) {
      console.error("Error loading costs:", error)
      toast({
        title: "Error",
        description: "Failed to load cost data from server",
        variant: "destructive",
      })
    } finally {
      setLoadingCosts(false)
    }
  }

  // Debounced save function to avoid too many API calls
  const [saveTimeouts, setSaveTimeouts] = useState({})

  const debouncedSave = (key, saveFunction, delay = 1000) => {
    // Clear existing timeout for this key
    if (saveTimeouts[key]) {
      clearTimeout(saveTimeouts[key])
    }

    // Set new timeout
    const timeoutId = setTimeout(async () => {
      setSavingCosts(true)
      try {
        await saveFunction()
      } catch (error) {
        // Error already handled in saveFunction
      } finally {
        setSavingCosts(false)
      }
    }, delay)

    setSaveTimeouts((prev) => ({
      ...prev,
      [key]: timeoutId,
    }))
  }

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
        const country = order["Country"]
        const city = order["City"]

        if (country) countries.add(country)
        if (city) cities.add(city)
      })

      setAvailableCountries(Array.from(countries).sort())
      setAvailableCities(Array.from(cities).sort())
    }
  }, [deliveredOrders])

  // Calculate total orders for each product (all orders, not just delivered)
  const allOrdersByProduct = useMemo(() => {
    if (!sheetData || !sheetData.length) return {}
    const map = {}
    sheetData.forEach((order) => {
      const product = order["Product Name"] || order["sku number"] || order["product"]
      if (!product) return
      if (!map[product]) map[product] = 0
      map[product] += 1
    })
    return map
  }, [sheetData])

  // Get current date for ad cost inputs (either specific date or today if no date filter)
  const getCurrentDateKey = () => {
    if (filters.startDate && filters.endDate) {
      // If it's a range, we'll handle this differently in the input display
      return null
    } else if (filters.startDate) {
      // Single date
      return format(new Date(filters.startDate), "yyyy-MM-dd")
    } else {
      // No date filter, use today
      return format(new Date(), "yyyy-MM-dd")
    }
  }

  // Get ad cost for a specific product and platform, considering date filters (DATE-DEPENDENT)
  const getAdCost = (productName, platform) => {
    const currentDateKey = getCurrentDateKey()

    if (filters.startDate && filters.endDate && !currentDateKey) {
      // Date range - sum up all costs in the range
      let total = 0
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = format(d, "yyyy-MM-dd")
        if (adCostsByDate[dateKey] && adCostsByDate[dateKey][productName]) {
          total += Number.parseFloat(adCostsByDate[dateKey][productName][platform] || 0)
        }
      }
      return total.toString()
    } else {
      // Single date or today
      const dateKey = currentDateKey || format(new Date(), "yyyy-MM-dd")
      if (adCostsByDate[dateKey] && adCostsByDate[dateKey][productName]) {
        return adCostsByDate[dateKey][productName][platform] || ""
      }
      return ""
    }
  }

  // Set ad cost for a specific product and platform on the current date (DATE-DEPENDENT)
  const setAdCost = (productName, platform, value) => {
    const currentDateKey = getCurrentDateKey()

    if (filters.startDate && filters.endDate && !currentDateKey) {
      // For date ranges, we'll set the value on the end date
      const dateKey = format(new Date(filters.endDate), "yyyy-MM-dd")
      updateAdCostForDate(dateKey, productName, platform, value)
    } else {
      // Single date or today
      const dateKey = currentDateKey || format(new Date(), "yyyy-MM-dd")
      updateAdCostForDate(dateKey, productName, platform, value)
    }
  }

  // Update ad cost for a specific date, product, and platform
  const updateAdCostForDate = (dateKey, productName, platform, value) => {
    setAdCostsByDate((prev) => {
      const newData = { ...prev }
      if (!newData[dateKey]) {
        newData[dateKey] = {}
      }
      if (!newData[dateKey][productName]) {
        newData[dateKey][productName] = {}
      }
      newData[dateKey][productName][platform] = value
      return newData
    })

    // Debounced save to backend
    const saveKey = `ad_${dateKey}_${productName}_${platform}`
    debouncedSave(saveKey, () => updateAdCost(token, dateKey, productName, platform, value))
  }

  // Get cost price for a product (NOT date-dependent - always the same value)
  const getCostPrice = (productName) => {
    return productCosts[productName] || ""
  }

  // Set cost price for a product (NOT date-dependent - simple storage)
  const setCostPrice = (productName, value) => {
    setProductCosts((prev) => ({
      ...prev,
      [productName]: value,
    }))

    // Debounced save to backend
    const saveKey = `product_${productName}`
    debouncedSave(saveKey, () => updateProductCost(token, productName, value))
  }

  // Handle delete all product costs
  const handleDeleteAllProductCosts = async () => {
    const productCount = Object.keys(productCosts).length
    if (productCount === 0) {
      toast({
        title: "No Data",
        description: "No product costs to delete",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ALL product costs? This will remove ${productCount} items.`)) {
      return
    }

    setDeletingCosts(true)
    try {
      await deleteAllProductCosts(token)
      setProductCosts({})
      toast({
        title: "Success",
        description: `All product costs deleted successfully. ${productCount} items removed.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete all product costs",
        variant: "destructive",
      })
    } finally {
      setDeletingCosts(false)
    }
  }

  // Handle delete all ad costs
  const handleDeleteAllAdCosts = async () => {
    let adCount = 0
    Object.keys(adCostsByDate).forEach((date) => {
      Object.keys(adCostsByDate[date]).forEach((product) => {
        adCount += Object.keys(adCostsByDate[date][product]).length
      })
    })

    if (adCount === 0) {
      toast({
        title: "No Data",
        description: "No ad costs to delete",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ALL ad costs? This will remove ${adCount} items.`)) {
      return
    }

    setDeletingCosts(true)
    try {
      await deleteAllAdCosts(token)
      setAdCostsByDate({})
      toast({
        title: "Success",
        description: `All ad costs deleted successfully. ${adCount} items removed.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete all ad costs",
        variant: "destructive",
      })
    } finally {
      setDeletingCosts(false)
    }
  }

  // Extract unique agents from deliveredOrders
  const agents = useMemo(() => {
    if (!deliveredOrders.length) return []
    const uniqueAgents = [...new Set(deliveredOrders.map((order) => order["Agent"]).filter(Boolean))]
    return uniqueAgents.sort()
  }, [deliveredOrders])

  // Process data with only delivered orders
  const processedData = useMemo(() => {
    if (!deliveredOrders.length) return []

    const productMap = new Map()

    deliveredOrders.forEach((order) => {
      const product = order["Product Name"] || order["sku number"] || order["product"]
      if (!product) return

      const orderDate = order["Order date"] ? new Date(order["Order date"]) : null
      const country = order["Country"] || ""
      const city = order["City"] || ""
      const agent = order["Agent"] || ""

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

      // Apply agent filter
      if (filters.agent && order["Agent"] !== filters.agent) {
        return
      }

      if (!productMap.has(product)) {
        productMap.set(product, {
          productName: product,
          totalOrders: 0, // will be replaced below
          totalAmount: 0,
          orderAmounts: [],
          totalQuantity: 0,
        })
      }

      const productData = productMap.get(product)

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

    // Set totalOrders for each product to all orders (not just delivered)
    productMap.forEach((product, productName) => {
      product.totalOrders = allOrdersByProduct[productName] || 0
      // Calculate average selling price for each product
      if (product.orderAmounts.length > 0) {
        // Calculate average selling price from delivered orders
        product.sellingPrice =
          product.orderAmounts.reduce((sum, amount) => sum + amount, 0) / product.orderAmounts.length
      } else {
        product.sellingPrice = 0
      }
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
  }, [deliveredOrders, searchTerm, filters, localFilters, sortField, sortDirection, allOrdersByProduct])

  const handleCostChange = (productName, value) => {
    setCostPrice(productName, value)
  }

  const handleAdCostChange = (platform, productName, value) => {
    setAdCost(productName, platform, value)
  }

  // Calculate total ad cost for a product considering date filters
  const calculateTotalAdCost = (productName) => {
    const fbCost = Number.parseFloat(getAdCost(productName, "fb") || 0)
    const ttCost = Number.parseFloat(getAdCost(productName, "tt") || 0)
    const googleCost = Number.parseFloat(getAdCost(productName, "google") || 0)
    const xCost = Number.parseFloat(getAdCost(productName, "x") || 0)
    const snapCost = Number.parseFloat(getAdCost(productName, "snap") || 0)

    return fbCost + ttCost + googleCost + xCost + snapCost
  }

  // Calculate average cost per order
  const calculateAverageCost = (product) => {
    const totalAdCost = calculateTotalAdCost(product.productName)
    return product.totalOrders > 0 ? totalAdCost / product.totalOrders : 0
  }

  // Calculate total cost with new formula
  const calculateTotalCost = (product) => {
    const costPrice = Number.parseFloat(getCostPrice(product.productName) || 0)
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
      const fbCost = Number.parseFloat(getAdCost(product.productName, "fb") || 0)
      const ttCost = Number.parseFloat(getAdCost(product.productName, "tt") || 0)
      const googleCost = Number.parseFloat(getAdCost(product.productName, "google") || 0)
      const xCost = Number.parseFloat(getAdCost(product.productName, "x") || 0)
      const snapCost = Number.parseFloat(getAdCost(product.productName, "snap") || 0)
      const costPrice = Number.parseFloat(getCostPrice(product.productName) || 0)
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
  }

  // Update the handleResetAllFilters function to use the shared resetAllFilters
  const handleResetAllFilters = () => {
    resetFilters()
    resetLocalFilters()
    setSearchTerm("")
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
    // Use all sheetData for totalOrders, not just delivered
    const totalOrders = sheetData ? sheetData.length : 0

    if (!processedData.length)
      return {
        totalOrders,
        totalAmount: 0,
        totalAdCost: 0,
        totalCost: 0,
        totalQuantity: 0,
      }

    const totalAmount = processedData.reduce((sum, product) => sum + product.totalAmount, 0)
    const totalQuantity = processedData.reduce((sum, product) => sum + product.totalQuantity, 0)

    let totalFbCost = 0
    let totalTtCost = 0
    let totalGoogleCost = 0
    let totalXCost = 0
    let totalSnapCost = 0
    let totalCost = 0

    processedData.forEach((product) => {
      const fbCost = Number.parseFloat(getAdCost(product.productName, "fb") || 0)
      const ttCost = Number.parseFloat(getAdCost(product.productName, "tt") || 0)
      const googleCost = Number.parseFloat(getAdCost(product.productName, "google") || 0)
      const xCost = Number.parseFloat(getAdCost(product.productName, "x") || 0)
      const snapCost = Number.parseFloat(getAdCost(product.productName, "snap") || 0)

      totalFbCost += fbCost
      totalTtCost += ttCost
      totalGoogleCost += googleCost
      totalXCost += xCost
      totalSnapCost += snapCost

      const costPrice = Number.parseFloat(getCostPrice(product.productName) || 0)
      const avgCost = calculateAverageCost(product)
      const productTotalCost = avgCost * product.totalOrders + costPrice * product.totalQuantity

      totalCost += productTotalCost
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
  }, [processedData, adCostsByDate, productCosts, sheetData, filters])

  // Handle refresh data
  const handleRefreshData = () => {
    if (token) {
      refreshSheetData(token)
      loadCostsFromBackend() // Also refresh cost data
      toast({
        title: "Refreshing data",
        description: "Fetching the latest data from your sheet and costs.",
      })
    }
  }

  const formatNumber = (value) => {
    return `$${Number(value).toFixed(2)}`
  }

  // Get date range display text
  const getDateRangeText = () => {
    if (filters.startDate && filters.endDate) {
      return `${format(new Date(filters.startDate), "MMM dd")} - ${format(new Date(filters.endDate), "MMM dd")}`
    } else if (filters.startDate) {
      return format(new Date(filters.startDate), "MMM dd, yyyy")
    } else {
      return "Today"
    }
  }

  // Ref for Delete Actions card
  const bulkDeleteRef = useRef(null)

  // Scroll to Delete Actions card
  const scrollToBulkDelete = () => {
    if (bulkDeleteRef.current) {
      bulkDeleteRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (loadingSheetData || loadingCosts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-2">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {loadingSheetData ? "Loading sheet data..." : "Loading cost data..."}
          </p>
        </div>
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
          <p className="text-sm text-blue-600 mt-1">
            Ad costs for: {getDateRangeText()}
            {filters.startDate && filters.endDate && " (cumulative)"}
          </p>
          {savingCosts && (
            <p className="text-sm text-orange-600 mt-1 flex items-center">
              <LoaderCircle className="h-3 w-3 animate-spin mr-1" />
              Saving changes...
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-1 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button variant="outline" size="sm" onClick={scrollToBulkDelete}>
            Go to Delete Actions
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!processedData.length}>
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
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
                <p className="text-sm text-muted-foreground">Total Orders</p>
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
        <Card className="mb-6">
          <CardHeader className="pb-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
              {/* Country Filter */}
              <div className="min-w-[180px]">
                <label className="text-sm font-medium flex items-center mb-1">
                  <Globe className="h-4 w-4 mr-1 text-green-600" /> Country
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
                    {[...new Set((sheetData || []).map((order) => order["Country"]).filter(Boolean))]
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
              <div className="min-w-[180px]">
                <label className="text-sm font-medium flex items-center mb-1">
                  <MapPin className="h-4 w-4 mr-1 text-blue-600" /> City
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
                    {[...new Set((sheetData || []).map((order) => order["City"]).filter(Boolean))]
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
              <div className="min-w-[180px]">
                <label className="text-sm font-medium flex items-center mb-1">
                  <BarChart3 className="h-4 w-4 mr-1 text-yellow-500" /> Product
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
                    {[...new Set((sheetData || []).map((order) => order["Product Name"] || order["sku number"] || order["product"]).filter(Boolean))]
                      .sort((a, b) => a.localeCompare(b))
                      .map((product) => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agent Filter */}
              <div className="min-w-[180px]">
                <label className="text-sm font-medium flex items-center mb-1">
                  <Filter className="h-4 w-4 mr-1 text-orange-500" /> Agent
                </label>
                <Select
                  value={filters.agent || ""}
                  onValueChange={(value) => updateFilter("agent", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
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

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium flex items-center mb-1">
                  <CalendarIcon className="h-4 w-4 mr-1 text-red-500" /> Date Range
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-1 h-4 w-4 text-red-500" />
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
            <br />
            <span className="text-blue-600 font-medium">
              Cost data is automatically saved to your account. Changes are synced in real-time.
            </span>
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
                <Table className="bg-zinc-100 dark:bg-zinc-900 w-full text-center">
                  <TableHeader className="sticky top-0 z-30 bg-zinc-100 dark:bg-zinc-900">
                    <TableRow className="cursor-pointer text-center">
                      <TableHead
                        className="cursor-pointer hover:bg-zinc-200  duration-200 text-center min-w-[110px] border-r border-zinc-300 dark:border-zinc-800 sticky left-0 z-20 bg-zinc-100 dark:bg-zinc-900"
                        onClick={() => handleSort("productName")}
                      >
                        Product Name
                        {sortField === "productName" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-zinc-200  duration-200 text-center min-w-[100px]"
                        onClick={() => handleSort("totalOrders")}
                      >
                        Orders
                        {sortField === "totalOrders" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-zinc-200  duration-200 text-center min-w-[100px]"
                        onClick={() => handleSort("totalQuantity")}
                      >
                        Total Qty
                        {sortField === "totalQuantity" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-zinc-200  duration-200 text-center min-w-[140px]"
                        onClick={() => handleSort("sellingPrice")}
                      >
                        Avg Selling Price
                        {sortField === "sellingPrice" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-zinc-200  duration-200 text-center min-w-[140px]"
                        onClick={() => handleSort("totalAmount")}
                      >
                        Total Amount
                        {sortField === "totalAmount" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead className="hover:bg-zinc-200  duration-200 text-center min-w-[140px]">
                        AD FB
                        <br />
                        <span className="text-xs text-blue-600">Date-based</span>
                      </TableHead>
                      <TableHead className="hover:bg-zinc-200  duration-200 text-center min-w-[140px]">
                        AD TT
                        <br />
                        <span className="text-xs text-blue-600">Date-based</span>
                      </TableHead>
                      <TableHead className="hover:bg-zinc-200  duration-200 text-center min-w-[140px]">
                        AD GOOGLE
                        <br />
                        <span className="text-xs text-blue-600">Date-based</span>
                      </TableHead>
                      <TableHead className="hover:bg-zinc-200  duration-200 text-center min-w-[140px]">
                        AD X
                        <br />
                        <span className="text-xs text-blue-600">Date-based</span>
                      </TableHead>
                      <TableHead className="hover:bg-zinc-200  duration-200 text-center min-w-[140px]">
                        AD SNAP
                        <br />
                        <span className="text-xs text-blue-600">Date-based</span>
                      </TableHead>
                      <TableHead className="hover:bg-zinc-200  duration-200 text-center min-w-[140px]">
                        Sourcing price
                        <br />
                        <span className="text-xs text-green-600">Fixed per product</span>
                      </TableHead>
                      <TableHead className="hover:bg-zinc-200  duration-200 text-center min-w-[140px]">
                        Average Cost
                      </TableHead>
                      <TableHead className="hover:bg-zinc-200  duration-200 text-center min-w-[140px]">
                        Total Cost
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.length > 0 ? (
                      currentItems.map((product) => {
                        const fbCost = getAdCost(product.productName, "fb")
                        const ttCost = getAdCost(product.productName, "tt")
                        const googleCost = getAdCost(product.productName, "google")
                        const xCost = getAdCost(product.productName, "x")
                        const snapCost = getAdCost(product.productName, "snap")
                        const costPrice = getCostPrice(product.productName)
                        const avgCost = calculateAverageCost(product)
                        const totalCost = calculateTotalCost(product)

                        return (
                          <TableRow key={product.productName} className="text-center">
                            <TableCell className="font-medium min-w-[110px] border-r border-zinc-300 dark:border-zinc-800 text-center sticky left-0 z-10 bg-zinc-100 dark:bg-zinc-900">
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
                                  value={fbCost}
                                  onChange={(e) => handleAdCostChange("fb", product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-blue-500 text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={ttCost}
                                  onChange={(e) => handleAdCostChange("tt", product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-blue-500 text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={googleCost}
                                  onChange={(e) => handleAdCostChange("google", product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-blue-500 text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={xCost}
                                  onChange={(e) => handleAdCostChange("x", product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-blue-500 text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={snapCost}
                                  onChange={(e) => handleAdCostChange("snap", product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-blue-500 text-center"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={costPrice}
                                  onChange={(e) => handleCostChange(product.productName, e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full border border-b border-b-green-500 text-center"
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
                        <TableCell colSpan={13} className="h-24 text-center">
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
                        <TableCell className="text-mainColor font-bold min-w-[110px] border-r border-zinc-300 dark:border-zinc-800 text-center sticky left-0 z-10 bg-muted/50">
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
            {/* Bulk Delete Actions - moved to bottom */}
      <Card className="mt-6 border-red-200mt-5" ref={bulkDeleteRef}>
        <CardHeader className="p-3">
          <CardTitle className="text-lg flex items-center text-red-700">
            <Trash2 className="h-5 w-5 mr-2" />
            Delete Actions
          </CardTitle>
          <CardDescription>Delete all cost data from the database at once. These actions cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAllProductCosts}
            >
              {deletingCosts ? (
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete All Product Costs
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAllAdCosts}
            >
              {deletingCosts ? (
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete All Ad Costs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
