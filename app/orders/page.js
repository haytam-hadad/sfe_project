"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarIcon,
  SearchIcon,
  FilterIcon,
  RefreshCwIcon,
  PackageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XCircle,
  ArrowDownIcon,
  ArrowUpIcon,
  SlidersIcon,
  LoaderIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function OrdersDashboard() {
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortField, setSortField] = useState("Order date");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Media query for responsive design
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    setIsSmallScreen(isMobile);
    if (isMobile) {
      setShowFilters(false);
    }
  }, [isMobile]);

  // Fetch data with error retry logic
  useEffect(() => {
    const fetchData = async (retryCount = 0) => {
      setLoading(true);
      try {
        const response = await fetch("/api/sheet");
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        setOrders(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => fetchData(retryCount + 1), delay);
        } else {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, []);

  // Memoized derivations
  const countries = useMemo(() => {
    if (!orders.length) return [];
    const uniqueCountries = [
      ...new Set(orders.map((order) => order["Receier Country*"]).filter(Boolean)),
    ];
    return uniqueCountries.sort();
  }, [orders]);

  const statuses = useMemo(() => {
    if (!orders.length) return [];
    const uniqueStatuses = [
      ...new Set(orders.map((order) => order["STATUS"]).filter(Boolean)),
    ];
    return uniqueStatuses.sort();
  }, [orders]);

  // Filter orders based on current criteria
  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];

    return orders
      .filter((order) => {
        const searchLower = searchQuery.toLowerCase().trim();
        if (searchLower) {
          const matchesSearch = Object.entries(order).some(([key, value]) => {
            if (typeof value === 'string' || value instanceof String) {
              return value.toLowerCase().includes(searchLower);
            }
            return false;
          });
          if (!matchesSearch) return false;
        }

        const matchesStatus = !statusFilter || order["STATUS"] === statusFilter;
        const matchesCountry =
          !countryFilter || order["Receier Country*"] === countryFilter;

        let matchesDateRange = true;
        if (startDate || endDate) {
          const orderDate = new Date(order["Order date"]);
          if (startDate && orderDate < startDate) {
            matchesDateRange = false;
          }
          if (endDate) {
            const endDatePlusOne = new Date(endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            if (orderDate >= endDatePlusOne) {
              matchesDateRange = false;
            }
          }
        }

        return matchesStatus && matchesCountry && matchesDateRange;
      })
      .sort((a, b) => {
        const fieldA = a[sortField];
        const fieldB = b[sortField];

        if (typeof fieldA !== "string" && typeof fieldB !== "string") {
          return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
        }

        if (!fieldA && !fieldB) return 0;
        if (!fieldA) return sortDirection === "asc" ? -1 : 1;
        if (!fieldB) return sortDirection === "asc" ? 1 : -1;

        if (sortDirection === "asc") {
          return String(fieldA).localeCompare(String(fieldB));
        } else {
          return String(fieldB).localeCompare(String(fieldA));
        }
      });
  }, [
    orders,
    searchQuery,
    statusFilter,
    countryFilter,
    startDate,
    endDate,
    sortField,
    sortDirection,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Order statistics
  const orderStats = useMemo(() => {
    if (!filteredOrders.length) return {};

    const totalAmount = filteredOrders.reduce((sum, order) => {
      const amount = parseFloat(order["Cod Amount"]) || 0;
      return sum + amount;
    }, 0);

    const totalQuantity = filteredOrders.reduce((sum, order) => {
      const qty = parseFloat(order[" Quantity"]) || 0;
      return sum + qty;
    }, 0);

    const statusCounts = filteredOrders.reduce((acc, order) => {
      const status = order["STATUS"] || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAmount,
      totalQuantity,
      statusCounts,
    };
  }, [filteredOrders]);

  // Callbacks
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("");
    setCountryFilter("");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  }, []);

  const handleSort = (field) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prevDirection) =>
          prevDirection === "asc" ? "desc" : "asc"
        );
      } else {
        setSortDirection("asc"); // Reset to "asc" for new attribute
      }
      return field; // Ensure field is updated
    });
  };
  const goToPage = useCallback((page) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      const tableElement = document.querySelector("#orders-table");
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const refreshData = useCallback(() => {
    setLoading(true);
    fetch("/api/sheet")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to refresh data");
        }
        return response.json();
      })
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const viewOrderDetails = useCallback((order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  }, []);

  // UI Helper Functions
  const getStatusBadge = useCallback((status) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;

    switch (status) {
      case "Delivered":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Delivered
          </Badge>
        );
      case "Cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Cancelled
          </Badge>
        );
      case "Returned":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
            Returned
          </Badge>
        );
      case "Processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Processing
          </Badge>
        );
      case "Shipped":
        return (
          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
            Shipped
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  const formatCurrency = useCallback((amount) => {
    if (!amount && amount !== 0) return "—";

    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Pagination rendering
  const renderPaginationButtons = useCallback(() => {
    const buttons = [];
    const maxButtonsToShow = isSmallScreen ? 3 : 5;

    // Always show first page
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
      </Button>
    );

    // Calculate range of pages to show
    let startPage = Math.max(2, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxButtonsToShow - 2);

    if (startPage <= 2) {
      startPage = 2;
      endPage = Math.min(totalPages - 1, startPage + maxButtonsToShow - 2);
    }

    if (endPage >= totalPages - 1) {
      endPage = totalPages - 1;
      startPage = Math.max(2, endPage - (maxButtonsToShow - 2));
    }

    if (startPage > 2) {
      buttons.push(
        <span key="ellipsis-1" className="px-2" aria-hidden="true">
          …
        </span>
      );
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
        </Button>
      );
    }

    if (endPage < totalPages - 1) {
      buttons.push(
        <span key="ellipsis-2" className="px-2" aria-hidden="true">
          …
        </span>
      );
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
        </Button>
      );
    }

    return buttons;
  }, [currentPage, goToPage, isSmallScreen, totalPages]);

  // Loading placeholder table
  const renderSkeletonRows = useCallback(() => {
    return Array(5).fill(null).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
        <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      </TableRow>
    ));
  }, []);

  // Error handling UI
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
            <CardDescription>
              We couldn&apos;t load your orders data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <Button
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <RefreshCwIcon className="mr-2 h-4 w-4" /> Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-1 sm:p-3 md:p-4 lg:p-5 w-full">
      {/* Header */}
      <div className="flex w-full flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
        <div>
          <h1 className="text-3xl p-1 font-extrabold tracking-tight">
            Orders List
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="h-9"
          >
            <RefreshCwIcon className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Badge
            variant="outline"
            className="text-sm bg-mainColor text-white p-1 px-3"
          >
            {filteredOrders.length} orders
          </Badge>

          {Object.keys(orderStats).length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SlidersIcon className="mr-2 h-4 w-4" />
                  Stats
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <h4 className="font-medium text-sm mb-2">Order Summary</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(orderStats.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Quantity:</span>
                      <span className="font-medium">{formatCurrency(orderStats.totalQuantity)}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <h4 className="font-medium text-sm mb-2">Status Breakdown</h4>
                  <div className="text-sm space-y-1">
                    {Object.entries(orderStats.statusCounts || {}).map(([status, count]) => {
                      const percentage = (count / filteredOrders.length) * 100;
                      return (
                        <div key={status} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{status}:</span>
                          <Badge variant="outline" className="font-medium">
                            {count} ({percentage.toFixed(1)}%)
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {isSmallScreen && (
            <Button 
              variant="outline" 
              size="sm"
              className="h-9"
              onClick={() => setShowFilters(prev => !prev)}
            >
              <FilterIcon className="mr-2 h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className={`mb-3 md:mb-4 w-full transition-all ${showFilters ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        {showFilters && (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FilterIcon className="mr-2 h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6">
              {/* Search */}
              <div className="relative md:col-span-2 lg:col-span-4">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by ID, city, SKU or any field..."
                  className="pl-8 border-mainColor w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search orders"
                />
              </div>

              {/* Status filter */}
              <select
                className="border rounded-md px-3 py-2 md:col-span-2 lg:col-span-1 dark:bg-black"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {/* Country filter */}
              <select
                className="border rounded-md px-3 py-2 md:col-span-2 lg:col-span-1 dark:bg-black"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                aria-label="Filter by country"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              {/* Date range */}
              <div className="flex gap-2 md:col-span-2 lg:col-span-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start dark:bg-black text-left hover:text-white font-normal flex-1"
                      aria-label="Select start date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      disabled={(date) => endDate && date > endDate}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start dark:bg-black text-left hover:text-white font-normal flex-1"
                      aria-label="Select end date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => startDate && date < startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>

            <div className="flex justify-end px-6 pb-3">
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="h-8 border px-2 lg:px-3 m-1 hover:text-white"
                disabled={!searchQuery && !statusFilter && !countryFilter && !startDate && !endDate}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reset filters
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Orders Table */}
      <div id="orders-table" className="mb-3 md:mb-4 bg-white dark:bg-zinc-900 rounded-md border">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-100 dark:bg-zinc-950 sticky top-0 z-10">
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("Order date")}
                  role="columnheader"
                  aria-sort={sortField === "Order date" ? sortDirection : "none"}
                >
                  <div className="flex items-center">
                    <span
                      className={
                        sortField === "Order date" ? "text-mainColor" : ""
                      }
                    >
                      Date
                    </span>
                    {sortField === "Order date" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("Order ID")}
                  role="columnheader"
                  aria-sort={sortField === "Order ID" ? sortDirection : "none"}
                >
                  <div className="flex items-center">
                    <span
                      className={
                        sortField === "Order ID" ? "text-mainColor" : ""
                      }
                    >
                      Order ID
                    </span>
                    {sortField === "Order ID" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("sku number ")}
                  role="columnheader"
                  aria-sort={sortField === "sku number " ? sortDirection : "none"}
                >
                  <div className="flex items-center">
                    <span
                      className={
                        sortField === "sku number " ? "text-mainColor" : ""
                      }
                    >
                      SKU
                    </span>
                    {sortField === "sku number " ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("Cod Amount")}
                  role="columnheader"
                  aria-sort={sortField === "Cod Amount" ? sortDirection : "none"}
                >
                  <div className="flex items-center justify-end">
                    <span
                      className={
                        sortField === "Cod Amount" ? "text-mainColor" : ""
                      }
                    >
                      Amount
                    </span>
                    {sortField === "Cod Amount" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-center"
                  onClick={() => handleSort(" Quantity")}
                  role="columnheader"
                  aria-sort={sortField === " Quantity" ? sortDirection : "none"}
                >
                  <div className="flex items-center justify-center">
                    <span
                      className={
                        sortField === " Quantity" ? "text-mainColor" : ""
                      }
                    >
                      Qty
                    </span>
                    {sortField === " Quantity" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("City")}
                  role="columnheader"
                  aria-sort={sortField === "City" ? sortDirection : "none"}
                >
                  <div className="flex items-center">
                    <span
                      className={sortField === "City" ? "text-mainColor" : ""}
                    >
                      City
                    </span>
                    {sortField === "City" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("Receier Country*")}
                  role="columnheader"
                  aria-sort={sortField === "Receier Country*" ? sortDirection : "none"}
                >
                  <div className="flex items-center">
                    <span
                      className={
                        sortField === "Receier Country*" ? "text-mainColor" : ""
                      }
                    >
                      Country
                    </span>
                    {sortField === "Receier Country*" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("STATUS")}
                  role="columnheader"
                  aria-sort={sortField === "STATUS" ? sortDirection : "none"}
                >
                  <div className="flex items-center">
                    <span
                      className={sortField === "STATUS" ? "text-mainColor" : ""}
                    >
                      Status
                    </span>
                    {sortField === "STATUS" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-8">
                      <PackageIcon className="h-12 w-12 mb-4 opacity-40" />
                      <p className="text-lg font-medium mb-1">No orders found</p>
                      <p className="text-sm max-w-sm text-center">
                        {searchQuery || statusFilter || countryFilter || startDate || endDate
                          ? "Try adjusting your filters or clearing the search"
                          : "There are no orders to display. Try refreshing or check back later."}
                      </p>
                      {(searchQuery || statusFilter || countryFilter || startDate || endDate) && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={resetFilters}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
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
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => viewOrderDetails(order)}
                  >
                    <TableCell className="font-medium">
                      {order["Order date"]}
                    </TableCell>
                    <TableCell>{order["Order ID"]}</TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate" title={order["sku number "]}>
                        {order["sku number "]}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order["Cod Amount"])}
                    </TableCell>
                    <TableCell className="text-center">
                      {order[" Quantity"]}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[120px] truncate" title={order["City"]}>
                        {order["City"]}
                      </div>
                    </TableCell>
                    <TableCell>{order["Receier Country*"]}</TableCell>
                    <TableCell>{getStatusBadge(order["STATUS"])}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t gap-3">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Showing{" "}
              <span className="font-medium">
                {Math.min(
                  filteredOrders.length,
                  (currentPage - 1) * itemsPerPage + 1
                )}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(filteredOrders.length, currentPage * itemsPerPage)}
              </span>{" "}
              of <span className="font-medium">{filteredOrders.length}</span>{" "}
              orders
            </div>

            <div className="flex items-center space-x-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>

              <div className="flex items-center">
                {renderPaginationButtons()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
                aria-label="Next page"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 px-2 text-xs">
                    {itemsPerPage} / page
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup value={`${itemsPerPage}`} onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}>
                    <DropdownMenuRadioItem value="10">10 per page</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="20">20 per page</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="50">50 per page</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="100">100 per page</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog 
        open={showOrderDetails} 
        onOpenChange={(open) => {
          setShowOrderDetails(open);
          if (!open) setSelectedOrder(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <PackageIcon className="mr-2 h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.["Order ID"] && `Order : ${selectedOrder["Order ID"]}`}
            </DialogDescription>
          </DialogHeader>
          <hr/>
          {selectedOrder && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 py-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Order Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedOrder["STATUS"])}</div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium">{selectedOrder["Order date"]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-medium">{formatCurrency(selectedOrder["Cod Amount"])}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="font-medium">{selectedOrder[" Quantity"]}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Product Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">SKU</p>
                      <p className="font-medium break-all">{selectedOrder["sku number "]}</p>
                    </div>
                    {selectedOrder["Product Name"] && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Product</p>
                        <p className="font-medium">{selectedOrder["Product Name"]}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Shipping Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {[
                          selectedOrder["Address Line 1"],
                          selectedOrder["Address Line 2"]
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">City</p>
                      <p className="font-medium">{selectedOrder["City"]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Country</p>
                      <p className="font-medium">{selectedOrder["Receier Country*"]}</p>
                    </div>
                    {selectedOrder["Postal Code"] && (
                      <div>
                        <p className="text-xs text-muted-foreground">Postal Code</p>
                        <p className="font-medium">{selectedOrder["Postal Code"]}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional order details if available */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Additional Details</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(selectedOrder)
                      .filter(([key]) => 
                        !["Order ID", "Order date", "STATUS", "Cod Amount", " Quantity", 
                          "sku number ", "City", "Receier Country*", "Address Line 1", 
                          "Address Line 2", "Product Name", "Postal Code"].includes(key) && 
                        selectedOrder[key])
                      .slice(0, 8) // Limit the number of additional fields
                      .map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs text-muted-foreground">{key}</p>
                          <p className="font-medium break-words">{value}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowOrderDetails(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Loading overlay */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-md flex items-center shadow-lg z-50">
          <LoaderIcon className="animate-spin h-4 w-4 mr-2" />
          Loading orders...
        </div>
      )}
    </div>
  );
}