"use client"

import { useState, useEffect, useMemo } from "react"
import { useApp, useSheetData, useFilters } from "@/contexts/app-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdsStatsPage() {
  const { toast } = useToast()
  const { token } = useAuth()
  const { sheetData, loadingSheetData, errorSheetData, refreshSheetData } = useSheetData()
  const { filters, updateFilter, resetFilters } = useFilters()
  const { formatCurrency } = useApp()

  const [searchTerm, setSearchTerm] = useState("")
  const [productCosts, setProductCosts] = useState({}) // AD costs - not stored in localStorage
  const [productAvgCosts, setProductAvgCosts] = useState({}) // Average product costs - stored in localStorage
  const [sortField, setSortField] = useState("totalOrders")
  const [sortDirection, setSortDirection] = useState("desc")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  // Local filters for this page
  const [localFilters, setLocalFilters] = useState({
    minAmount: "",
    maxAmount: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  // Load saved costs from localStorage on component mount
  useEffect(() => {
    try {
      const savedAvgCosts = localStorage.getItem("productAvgCosts")
      if (savedAvgCosts) {
        const parsedCosts = JSON.parse(savedAvgCosts)
        setProductAvgCosts(parsedCosts)
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

  // Process data to get unique products and their order counts
  const processedData = useMemo(() => {
    if (!sheetData || !sheetData.length) return []

    const productMap = new Map()

    sheetData.forEach((order) => {
      const product = order["Product Name"] || order["sku number"] || order["product"]
      if (!product) return

      const orderDate = order["Order date"] ? new Date(order["Order date"]) : null

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
      if (filters.city && order["City"] && order["City"] !== filters.city) {
        return
      }

      // Apply country filter
      if (filters.country && order["Receiver Country"] && order["Receiver Country"] !== filters.country) {
        return
      }

      if (!productMap.has(product)) {
        productMap.set(product, {
          productName: product,
          totalOrders: 0,
          totalAmount: 0,
          sellingPrice: 0,
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
        // Set selling price if not already set
        if (productData.sellingPrice === 0) {
          productData.sellingPrice = amount
        }
      }
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
  }, [sheetData, searchTerm, filters, localFilters, sortField, sortDirection])

  // Save average costs to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("productAvgCosts", JSON.stringify(productAvgCosts))
    } catch (error) {
      console.error("Error saving costs:", error)
    }
  }, [productAvgCosts])

  const handleCostChange = (productName, value) => {
    setProductCosts((prev) => ({
      ...prev,
      [productName]: value,
    }))
  }

  const handleAvgCostChange = (productName, value) => {
    setProductAvgCosts((prev) => ({
      ...prev,
      [productName]: value,
    }))
  }

  const calculateTotalCost = (product) => {
    const adCost = Number.parseFloat(productCosts[product.productName] || 0)
    const avgCost = Number.parseFloat(productAvgCosts[product.productName] || 0)
    // AD cost is one-time, average cost is per unit
    return adCost + avgCost * product.totalQuantity
  }

  const calculateProfit = (product) => {
    const totalCost = calculateTotalCost(product)
    return product.totalAmount - totalCost
  }

  const handleExport = () => {
    if (!processedData.length) return

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Add headers
    csvContent +=
      "Product Name,Total Orders,Total Quantity,Selling Price,Total Amount,AD Cost,Average Cost,Total Cost,Profit\n"

    // Add data rows
    processedData.forEach((product) => {
      const adCost = Number.parseFloat(productCosts[product.productName] || 0)
      const avgCost = Number.parseFloat(productAvgCosts[product.productName] || 0)
      const totalCost = calculateTotalCost(product)
      const profit = calculateProfit(product)

      csvContent += `"${product.productName}",${product.totalOrders},${product.totalQuantity},${product.sellingPrice.toFixed(2)},${product.totalAmount.toFixed(2)},${adCost.toFixed(2)},${avgCost.toFixed(2)},${totalCost.toFixed(2)},${profit.toFixed(2)}\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `product-analysis-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)

    // Trigger download
    link.click()
    document.body.removeChild(link)
  }

  // Reset local filters
  const resetLocalFilters = () => {
    setLocalFilters({
      minAmount: "",
      maxAmount: "",
    })
  }

  // Reset all filters
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

  // Calculate totals
  const totals = useMemo(() => {
    if (!processedData.length)
      return {
        totalOrders: 0,
        totalAmount: 0,
        totalAdCost: 0,
        totalCost: 0,
        totalProfit: 0,
        totalQuantity: 0,
      }

    const totalOrders = processedData.reduce((sum, product) => sum + product.totalOrders, 0)
    const totalAmount = processedData.reduce((sum, product) => sum + product.totalAmount, 0)
    const totalQuantity = processedData.reduce((sum, product) => sum + product.totalQuantity, 0)

    let totalAdCost = 0
    let totalCost = 0
    let totalProfit = 0

    processedData.forEach((product) => {
      const adCost = Number.parseFloat(productCosts[product.productName] || 0)
      totalAdCost += adCost

      const cost = calculateTotalCost(product)
      totalCost += cost
      totalProfit += calculateProfit(product)
    })

    return { totalOrders, totalAmount, totalAdCost, totalCost, totalProfit, totalQuantity }
  }, [processedData, productCosts, productAvgCosts])

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
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Product Analysis</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium">Loading data...</p>
            <p className="text-sm text-muted-foreground mt-2">Fetching the latest information from your sheet</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (errorSheetData) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Product Analysis</h1>
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
          <h1 className="text-3xl font-bold">Product Analysis</h1>
          <p className="text-muted-foreground mt-1">Analyze product performance and calculate profitability</p>
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
                <p className="text-sm text-muted-foreground">Total Revenue</p>
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
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <h3 className="text-2xl font-bold">{formatNumber(totals.totalProfit)}</h3>
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
        <Card className="mb-6 border-t-4 border-t-gray-300">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-md flex items-center">
                <Filter className="h-4 w-4 mr-1" /> Filters
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleResetAllFilters}>
                <X className="h-4 w-4 mr-1 text-mainColor" />
                Clear All Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Min Amount</label>
                    <Input
                      type="number"
                      placeholder="Min $"
                      value={localFilters.minAmount}
                      onChange={(e) => setLocalFilters({ ...localFilters, minAmount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Amount</label>
                    <Input
                      type="number"
                      placeholder="Max $"
                      value={localFilters.maxAmount}
                      onChange={(e) => setLocalFilters({ ...localFilters, maxAmount: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          {filters.startDate ? format(new Date(filters.startDate), "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.startDate ? new Date(filters.startDate) : undefined}
                          onSelect={(date) => updateFilter("startDate", date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          {filters.endDate ? format(new Date(filters.endDate), "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.endDate ? new Date(filters.endDate) : undefined}
                          onSelect={(date) => updateFilter("endDate", date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-t-4 border-t-blue-700">
        <CardHeader>
          <CardDescription>Enter product costs to calculate profitability</CardDescription>
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
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-100 dark:bg-gray-900">
                <TableRow className="cursor-pointer text-center">
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 text-center"
                    onClick={() => handleSort("productName")}
                  >
                    Product Name
                    {sortField === "productName" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 text-center"
                    onClick={() => handleSort("totalOrders")}
                  >
                    Total Orders
                    {sortField === "totalOrders" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 text-center"
                    onClick={() => handleSort("totalQuantity")}
                  >
                    Total Qty
                    {sortField === "totalQuantity" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 text-center"
                    onClick={() => handleSort("sellingPrice")}
                  >
                    Selling Price
                    {sortField === "sellingPrice" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-200 transition-colors duration-200 text-center"
                    onClick={() => handleSort("totalAmount")}
                  >
                    Total Amount
                    {sortField === "totalAmount" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </TableHead>
                  <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center">
                    AD Cost
                  </TableHead>
                  <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center">
                    Average Cost
                  </TableHead>
                  <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center">
                    Total Cost
                  </TableHead>
                  <TableHead className="hover:bg-gray-200 transition-colors duration-200 text-center text-mainColor">
                    Profit
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((product) => {
                    const adCost = Number.parseFloat(productCosts[product.productName] || 0)
                    const avgCost = Number.parseFloat(productAvgCosts[product.productName] || 0)
                    const totalCost = calculateTotalCost(product)
                    const profit = calculateProfit(product)

                    return (
                      <TableRow key={product.productName}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell className="text-right">{product.totalOrders}</TableCell>
                        <TableCell className="text-right">{product.totalQuantity}</TableCell>
                        <TableCell className="text-right">{formatNumber(product.sellingPrice)}</TableCell>
                        <TableCell className="text-right">{formatNumber(product.totalAmount)}</TableCell>
                        <TableCell>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={productCosts[product.productName] || ""}
                              onChange={(e) => handleCostChange(product.productName, e.target.value)}
                              placeholder="0.00"
                              className="pl-8 w-full border border-b border-b-black dark:border-b-white"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={productAvgCosts[product.productName] || ""}
                              onChange={(e) => handleAvgCostChange(product.productName, e.target.value)}
                              placeholder="0.00"
                              className="pl-8 w-full border border-b border-b-black dark:border-b-white"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(totalCost)}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {formatNumber(profit)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      {processedData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-muted-foreground">No products found</p>
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
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell className="text-mainColor font-bold">TOTALS</TableCell>
                    <TableCell className="text-right">{totals.totalOrders}</TableCell>
                    <TableCell className="text-right">{totals.totalQuantity}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{formatNumber(totals.totalAmount)}</TableCell>
                    <TableCell>{formatNumber(totals.totalAdCost)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-right">{formatNumber(totals.totalCost)}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${totals.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatNumber(totals.totalProfit)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {processedData.length > rowsPerPage && (
            <div className="flex items-center justify-between space-x-1 py-2">
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
        </CardContent>
      </Card>
    </div>
  )
}
