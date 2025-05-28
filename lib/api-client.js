export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

// Function to get the conversion rate from localStorage
export function getConversionRate() {
  if (typeof window !== "undefined") {
    const storedRate = localStorage.getItem("conversionRate")
    return storedRate ? Number.parseFloat(storedRate) : 1.0 // Default to 1.0 if not found
  }
  return 1.0 // Default to 1.0 if not in a browser environment
}

// Function to convert to USD
export function convertToUSD(amount, rate) {
  return (amount / rate).toFixed(2)
}

export async function fetchMySheetData(token) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/data/mysheet`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()
    console.log("API Response:", data) // Debug log

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch sheet data")
    }

    // Check if the response is an array
    if (!Array.isArray(data)) {
      console.error("Response is not an array:", data)
      throw new Error("Invalid data format: response is not an array")
    }

    // Get the country-specific conversion rates
    let countryRates = {}
    if (typeof window !== "undefined") {
      const storedRates = localStorage.getItem("countryConversionRates")
      countryRates = storedRates ? JSON.parse(storedRates) : {}
    }

    // Get the default conversion rate
    const defaultRate = getConversionRate()

    // Process the data to ensure we capture all statuses and convert amounts
    const processedData = data.map((order) => {
      const processedOrder = { ...order }

      // Process status
      if (processedOrder["STATUS"] !== undefined) {
        processedOrder["STATUS"] = String(processedOrder["STATUS"]).trim()
      }

      // Convert currency values using country-specific rates
      if (processedOrder["Cod Amount"] !== undefined) {
        const amount = Number.parseFloat(processedOrder["Cod Amount"])
        if (!isNaN(amount)) {
          // Get the country from the order
          const country = processedOrder["Country"]

          // Use country-specific rate if available, otherwise use default
          const rate = country && countryRates[country] ? Number.parseFloat(countryRates[country]) : defaultRate

          // Convert the amount using the appropriate rate
          const convertedAmount = amount * rate

          // Replace the original amount with the converted amount
          processedOrder["Cod Amount"] = Number(convertedAmount.toFixed(2))
        }
      }

      return processedOrder
    })

    console.log("Processed data with converted amounts:", processedData) // Debug log
    return processedData
  } catch (error) {
    console.error("Error fetching sheet data:", error)
    throw error
  }
}

// ==================== COST MANAGEMENT API FUNCTIONS ====================

// Fetch all costs for the authenticated user
export async function fetchCosts(token) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/data/costs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch costs")
    }

    return data
  } catch (error) {
    console.error("Error fetching costs:", error)
    throw error
  }
}

// Update product cost (not date-dependent)
export async function updateProductCost(token, productName, cost) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/data/costs/product/${encodeURIComponent(productName)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cost }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to update product cost")
    }

    return data
  } catch (error) {
    console.error("Error updating product cost:", error)
    throw error
  }
}

// Update ad cost for specific date, product, and platform (date-dependent)
export async function updateAdCost(token, date, productName, platform, cost) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(
      `${API_BASE_URL}/data/costs/ad/${date}/${encodeURIComponent(productName)}/${platform}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cost }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to update ad cost")
    }

    return data
  } catch (error) {
    console.error("Error updating ad cost:", error)
    throw error
  }
}

// Bulk update costs
export async function bulkUpdateCosts(token, productCosts, adCostsByDate) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/data/costs/bulk`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productCosts, adCostsByDate }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to bulk update costs")
    }

    return data
  } catch (error) {
    console.error("Error bulk updating costs:", error)
    throw error
  }
}

// Delete all product costs
export async function deleteAllProductCosts(token) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/data/costs/products/all`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete all product costs")
    }

    return data
  } catch (error) {
    console.error("Error deleting all product costs:", error)
    throw error
  }
}

// Delete all ad costs
export async function deleteAllAdCosts(token) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/data/costs/ads/all`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete all ad costs")
    }

    return data
  } catch (error) {
    console.error("Error deleting all ad costs:", error)
    throw error
  }
}
