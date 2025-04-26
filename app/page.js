"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function Page() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sheet");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const chartData = data
    ? data.reduce((acc, entry) => {
        const existingEntry = acc.find((item) => item.name === entry.STATUS);
        if (existingEntry) {
          existingEntry.value += 1;
        } else {
          acc.push({ name: entry.STATUS, value: 1 });
        }
        return acc;
      }, []).map((item) => ({
        name: item.name,
        value: (item.value / data.length) * 100,
      }))
    : [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-6xl font-bold">Admin Dashboard</h1>
      {data ? (
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
    </main>
  );
}



