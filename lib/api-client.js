// API client for making authenticated requests to the backend

// Base URL for API requests - change this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error("API Error:", error)

  // Extract error message
  let errorMessage = "An unexpected error occurred"

  if (error.response && error.response.data) {
    errorMessage = error.response.data.message || errorMessage
  } else if (error.message) {
    errorMessage = error.message
  }

  // Return the error for further handling
  return { error: errorMessage }
}

// Helper function to get the auth token from localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

// Authentication API calls
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Login failed")
    }

    return data
  } catch (error) {
    return handleApiError(error)
  }
}


export const getCurrentUser = async () => {
  try {
    const token = getToken()

    if (!token) {
      return null
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        "Authorization": token,
      },
    })

    if (response.status === 401) {
      // Token is invalid or expired
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
      }
      return null
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to get user data")
    }

    return data
  } catch (error) {
    console.error("Error fetching current user:", error)
    return null
  }
}

export const updatePassword = async (passwordData) => {
  try {
    const token = getToken()

    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/auth/update-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify(passwordData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Password update failed")
    }

    return data
  } catch (error) {
    return handleApiError(error)
  }
}

export const updateProfile = async (profileData) => {
  try {
    const token = getToken()

    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify(profileData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Profile update failed")
    }

    return data
  } catch (error) {
    return handleApiError(error)
  }
}

// Sheet API calls
export const getUserSheet = async () => {
  try {
    const token = getToken()

    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/data/mysheet`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch sheet data")
    }

    return data.data
  } catch (error) {
    return handleApiError(error)
  }
}

export const getSpecificUserSheet = async (userId, sheetUrl = null) => {
  try {
    const token = getToken()

    if (!token) {
      throw new Error("Authentication required")
    }

    let url = `${API_BASE_URL}/sheet/user/${userId}`
    if (sheetUrl) {
      url += `?sheetUrl=${encodeURIComponent(sheetUrl)}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": token,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch user sheet data")
    }

    return data
  } catch (error) {
    return handleApiError(error)
  }
}

export const validateSheetUrl = async (sheetUrl) => {
  try {
    const token = getToken()

    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/data/validate-sheet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({ sheetUrl }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to validate sheet URL")
    }

    return data
  } catch (error) {
    return handleApiError(error)
  }
}

export const updateSheetUrl = async (url) => {
  try {
    const token = getToken()

    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/data/process-sheet-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to process sheet URL")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating sheet URL:", error)
    throw error
  }
}

// Function to update conversion rate
export const updateConversionRate = (newRate) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currencyConversionRate', newRate.toString());
  }
};

// Function to get current conversion rate
export const getConversionRate = () => {
  if (typeof window !== 'undefined') {
    return parseFloat(localStorage.getItem('currencyConversionRate')) || 0.007;
  }
  return 0.007;
};

// Simplified currency conversion functions
const convertToUSD = (kesAmount, rate) => {
  if (!kesAmount || isNaN(kesAmount)) return 0;
  return Number((kesAmount * rate).toFixed(2));
};

// Simplified data processing function
const processAndFormatData = (data, rate) => {
  if (!Array.isArray(data)) return data;

  return data.map(item => {
    const newItem = { ...item };
    
    // Only process Cod Amount field
    if (newItem['Cod Amount']) {
      const kesAmount = parseFloat(newItem['Cod Amount']);
      if (!isNaN(kesAmount)) {
        const usdAmount = convertToUSD(kesAmount, rate);
        // Replace Cod Amount with USD value
        newItem['Cod Amount'] = usdAmount;
      }
    }
    
    return newItem;
  });
};

export async function fetchMySheetData(token) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/data/mysheet`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
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

    // Get the current conversion rate
    const conversionRate = getConversionRate()

    // Process the data to ensure we capture all statuses and convert amounts
    const processedData = data.map((order) => {
      const processedOrder = { ...order }
      
      // Process status
      if (processedOrder["STATUS"] !== undefined) {
        processedOrder["STATUS"] = String(processedOrder["STATUS"]).trim()
      }

      // Convert currency values
      if (processedOrder["Cod Amount"] !== undefined) {
        const amount = parseFloat(processedOrder["Cod Amount"])
        if (!isNaN(amount)) {
          // Convert the amount using the conversion rate
          const convertedAmount = convertToUSD(amount, conversionRate)
          // Replace the original amount with the converted amount
          processedOrder["Cod Amount"] = convertedAmount
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

