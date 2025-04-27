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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";


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

export default function OrdersDashboard() {
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    "Order date": true,
    "Order ID": true,
    "sku number": true,
    "Cod Amount": true,
    "Quantity": true,
    "City": true,
    "Receier Country*": true,
    "STATUS": true,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortField, setSortField] = useState("Order date");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

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

  const cities = useMemo(() => {
    if (!orders.length) return [];
    const cityCounts = orders.reduce((acc, order) => {
      const city = order["City"];
      if (city) {
        acc[city] = (acc[city] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.entries(cityCounts)
      .sort(([, countA], [, countB]) => countB - countA) // Sort by count descending
      .map(([city, count]) => ({ city, count })); // Return city and count as objects
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
        const matchesCity = !cityFilter || order["City"] === cityFilter;

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

        return matchesStatus && matchesCountry && matchesCity && matchesDateRange;
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
    cityFilter,
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
    setCityFilter("");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  }, []);
  const handleSort = (field) => {
    const isSameField = field === sortField;
    setSortField(field);
    setSortDirection(
      isSameField ? sortDirection === "asc" ? "desc" : "asc" : "asc"
    );
  };

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
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

  const handleSearchQueryChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to the first page
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to the first page
  };

  const handleCountryFilterChange = (value) => {
    setCountryFilter(value);
    setCurrentPage(1); // Reset to the first page
  };

  const handleCityFilterChange = (value) => {
    setCityFilter(value);
    setCurrentPage(1); // Reset to the first page
  };

  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1); // Reset to the first page
  };

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

    // Always show the first page
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
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-red-600">Error Loading Data</h2>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t load your orders data. Please try again.
            </p>
          </div>
          <div className="mb-4 text-sm text-muted-foreground">{error}</div>
          <button
            className="w-full bg-mainColor text-white py-2 px-4 rounded-md hover:bg-mainColor-dark transition"
            onClick={() => window.location.reload()}
          >
            <RefreshCwIcon className="mr-2 h-4 w-4 inline-block" /> Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-2 sm:p-3 md:p-4 lg:p-5 w-full">
      <div className="w-full mb-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-2">
          <div className="flex-1">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight">
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
              className="text-xs sm:text-sm bg-mainColor text-white p-1 px-3"
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
                <DropdownMenuContent align="end" className="w-full sm:w-56">
                  <div className="p-2">
                    <h4 className="font-medium text-sm mb-2">Order Summary</h4>
                    <div className="text-xs sm:text-sm space-y-1">
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
                    <div className="text-xs sm:text-sm space-y-1">
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
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <FilterIcon className="mr-2 h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SlidersIcon className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-full sm:w-56 max-h-[80vh] overflow-y-auto"
              >
                <div className="p-2">
                  <h4 className="font-medium text-sm mb-2">Toggle Columns</h4>
                  <div className="space-y-2">
                    {Object.keys(visibleColumns).map((column) => (
                      <div key={column} className="flex items-center">
                        <Input
                          type="checkbox"
                          checked={visibleColumns[column]}
                          onChange={() =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [column]: !prev[column],
                            }))
                          }
                          className="mr-2"
                        />
                        <label className="text-xs sm:text-sm">{column}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg flex items-center">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filters
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 border hover:bg-mainColor hover:text-white"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-2 hover:bg-mainColor hover:text-white"
              onClick={() =>
                setSortDirection((prevDirection) =>
                  prevDirection === "asc" ? "desc" : "asc"
                )
              }
            >
              {sortDirection === "asc" ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div
          className={`mb-3 md:mb-4 w-full p-1 transition-all ${showFilters ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
            }`}
        >
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-[100vw] lg:grid-cols-4 gap-2">
              {/* Filters */}
              <div className="relative col-span-full">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by ID, city, SKU or any field..."
                  className="pl-8 border-mainColor w-full"
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  aria-label="Search orders"
                />
              </div>

              {/* Status filter */}
              <select
                className="border rounded-md px-3 py-2 dark:bg-black w-full"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
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
                className="border rounded-md px-3 py-2 dark:bg-black w-full"
                value={countryFilter}
                onChange={(e) => handleCountryFilterChange(e.target.value)}
                aria-label="Filter by country"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              {/* City filter */}
              <select
                className="border rounded-md px-3 py-2 dark:bg-black w-full"
                value={cityFilter}
                onChange={(e) => handleCityFilterChange(e.target.value)}
                aria-label="Filter by city"
              >
                <option value="">All Cities</option>
                {cities.map(({ city, count }) => (
                  <option key={city} value={city}>
                    {city} ({count} orders)
                  </option>
                ))}
              </select>

              {/* Date range */}
              <div className="flex gap-2 col-span-full sm:col-span-2">
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
                      onSelect={(date) => handleDateRangeChange(date, endDate)}
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
                      onSelect={(date) => handleDateRangeChange(startDate, date)}
                      initialFocus
                      disabled={(date) => startDate && date < startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Orders Table */}
      <div
        id="orders-table"
        className="bg-white dark:bg-zinc-900 rounded-md border max-w-full overflow-auto"
        style={{ maxHeight: "80vh", maxWidth: "100vw", overflowX: "scroll" }}
      >
        <Table className="min-w-full">
          <TableHeader className="bg-gray-100 text-center dark:bg-zinc-950 sticky top-0 z-10">
            <TableRow>
              {visibleColumns["Order date"] && (
                <TableHead
                  className="cursor-pointer user-select-none"
                  onClick={() => handleSort("Order date")}
                  role="columnheader"
                  aria-sort={sortField === "Order date" ? sortDirection : "none"}
                >
                  <div className="flex items-center">
                    <span
                      className={sortField === "Order date" ? "text-mainColor" : ""}
                    >
                      Date
                    </span>
                    {sortField === "Order date" && (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    )}
                  </div>
                </TableHead>
              )}
              {visibleColumns["Order ID"] && (
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("Order ID")}
                  role="columnheader"
                  aria-sort={sortField === "Order ID" ? sortDirection : "none"}
                >
                  <div className="flex items-center">
                    <span
                      className={sortField === "Order ID" ? "text-mainColor" : ""}
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
              )}
              {visibleColumns["sku number"] && (
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("sku number")}
                  role="columnheader"
                  aria-sort={sortField === "sku number" ? sortDirection : "none"}
                >
                  <div className="flex items-center">
                    <span
                      className={sortField === "sku number" ? "text-mainColor" : ""}
                    >
                      SKU
                    </span>
                    {sortField === "sku number" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
              {visibleColumns["Cod Amount"] && (
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("Cod Amount")}
                  role="columnheader"
                  aria-sort={sortField === "Cod Amount" ? sortDirection : "none"}
                >
                  <div className="flex items-center justify-end">
                    <span
                      className={sortField === "Cod Amount" ? "text-mainColor" : ""}
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
              )}
              {visibleColumns["Quantity"] && (
                <TableHead
                  className="cursor-pointer text-center"
                  onClick={() => handleSort("Quantity")}
                  role="columnheader"
                  aria-sort={sortField === "Quantity" ? sortDirection : "none"}
                >
                  <div className="flex items-center justify-center">
                    <span
                      className={sortField === "Quantity" ? "text-mainColor" : ""}
                    >
                      Qty
                    </span>
                    {sortField === "Quantity" ? (
                      sortDirection === "asc" ? (
                        <ArrowUpIcon className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="ml-1 h-4 w-4" />
                      )
                    ) : null}
                  </div>
                </TableHead>
              )}
              {visibleColumns["City"] && (
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
              )}
              {visibleColumns["Receier Country*"] && (
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
              )}
              {visibleColumns["STATUS"] && (
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
              )}
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
                        className="mt-3"
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
                  {visibleColumns["Order date"] && (
                    <TableCell className="text-center font-medium">{order["Order date"]}</TableCell>
                  )}
                  {visibleColumns["Order ID"] && (
                    <TableCell className="text-center">{order["Order ID"]}</TableCell>
                  )}
                  {visibleColumns["sku number"] && (
                    <TableCell className="text-center">
                      <div
                        className="max-w-[150px] truncate"
                        title={order["sku number "] || "N/A"}
                      >
                        {order["sku number "] || "N/A"}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns["Cod Amount"] && (
                    <TableCell className="text-center">
                      {formatCurrency(order["Cod Amount"])}
                    </TableCell>
                  )}
                  {visibleColumns["Quantity"] && (
                    <TableCell className="text-center">{order[" Quantity"]}</TableCell>
                  )}
                  {visibleColumns["City"] && (
                    <TableCell className="text-center">
                      <div
                        className="max-w-[120px] truncate"
                        title={order["City"]}
                      >
                        {order["City"]}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns["Receier Country*"] && (
                    <TableCell className="text-center">{order["Receier Country*"]}</TableCell>
                  )}
                  {visibleColumns["STATUS"] && (
                    <TableCell className="text-center">{getStatusBadge(order["STATUS"])}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="h-8"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-1">
          {renderPaginationButtons()}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="h-8"
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
