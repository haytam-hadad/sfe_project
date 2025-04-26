"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [filters, setFilters] = useState({
    product: "ALL",
    country: "ALL",
    startDate: "2025-01-10",
    endDate: "2025-04-28",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sheet");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        setData(result);
        setFilteredData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const applyFilters = () => {
    if (!data) return;

    const filtered = data.filter((item) => {
      const matchesProduct = filters.product === "ALL" || item.product === filters.product;
      const matchesCountry = filters.country === "ALL" || item.country === filters.country;
      const matchesDate =
        new Date(item.date) >= new Date(filters.startDate) &&
        new Date(item.date) <= new Date(filters.endDate);

      return matchesProduct && matchesCountry && matchesDate;
    });

    setFilteredData(filtered);
  };

  const chartData = filteredData
    ? filteredData.reduce((acc, entry) => {
        const existingEntry = acc.find((item) => item.name === entry.STATUS);
        if (existingEntry) {
          existingEntry.value += 1;
        } else {
          acc.push({ name: entry.STATUS, value: 1 });
        }
        return acc;
      }, []).map((item) => ({
        name: item.name,
        value: (item.value / filteredData.length) * 100,
        count: item.value,
      }))
    : [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const totalLeads = filteredData ? filteredData.length : 0;
  const confirmationRate = filteredData
    ? ((filteredData.filter((item) => item.STATUS === "Confirmed").length / totalLeads) * 100).toFixed(2)
    : 0;
  const deliveryRate = filteredData
    ? ((filteredData.filter((item) => item.STATUS === "Delivered").length / totalLeads) * 100).toFixed(2)
    : 0;
  const returnRate = filteredData
    ? ((filteredData.filter((item) => item.STATUS === "Returned").length / totalLeads) * 100).toFixed(2)
    : 0;
  const inProcessRate = filteredData
    ? ((filteredData.filter((item) => item.STATUS === "In Process").length / totalLeads) * 100).toFixed(2)
    : 0;

  return (
    <main className="p-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Admin Dashboard</h1>

      {/* Show Filters Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          className="h-9 border hover:bg-mainColor hover:text-white"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <select
            className="border rounded-md px-3 py-2 dark:bg-black w-full sm:w-auto"
            value={filters.product}
            onChange={(e) => setFilters({ ...filters, product: e.target.value })}
          >
            <option value="ALL">ALL PRODUCTS</option>
            {/* Add product options dynamically if available */}
          </select>
          <select
            className="border rounded-md px-3 py-2 dark:bg-black w-full sm:w-auto"
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          >
            <option value="ALL">ALL COUNTRIES</option>
            {/* Add country options dynamically if available */}
          </select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="border rounded-md px-3 py-2 dark:bg-black w-full sm:w-auto"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              type="date"
              className="border rounded-md px-3 py-2 dark:bg-black w-full sm:w-auto"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <Button
            variant="outline"
            className="h-9 border hover:bg-mainColor hover:text-white"
            onClick={applyFilters}
          >
            Apply Filters
          </Button>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-yellow-500 text-white p-4 text-center">
          <h2 className="text-xl font-semibold">Total Leads</h2>
          <p className="text-2xl font-bold">{totalLeads}</p>
        </Card>
        <Card className="bg-blue-500 text-white p-4 text-center">
          <h2 className="text-xl font-semibold">Confirmation Rate</h2>
          <p className="text-2xl font-bold">{confirmationRate}%</p>
        </Card>
        <Card className="bg-green-500 text-white p-4 text-center">
          <h2 className="text-xl font-semibold">Delivery Rate</h2>
          <p className="text-2xl font-bold">{deliveryRate}%</p>
        </Card>
        <Card className="bg-red-500 text-white p-4 text-center">
          <h2 className="text-xl font-semibold">Return Rate</h2>
          <p className="text-2xl font-bold">{returnRate}%</p>
        </Card>
        <Card className="bg-purple-500 text-white p-4 text-center">
          <h2 className="text-xl font-semibold">In Process Rate</h2>
          <p className="text-2xl font-bold">{inProcessRate}%</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <Card className="p-4">
          <h2 className="text-2xl font-semibold text-center mb-4">Status Counts</h2>
          {filteredData ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>Loading...</p>
          )}
        </Card>

        {/* Pie Chart */}
        <Card className="p-4">
          <h2 className="text-2xl font-semibold text-center mb-4">Status Distribution</h2>
          {filteredData ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label={(props) => (
                    <text
                      x={props.x}
                      y={props.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fff"
                    >
                      {`${props.name}: ${(props.percent * 100).toFixed(1)}%`}
                    </text>
                  )}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>Loading...</p>
          )}
        </Card>
      </div>
    </main>
  );
}



