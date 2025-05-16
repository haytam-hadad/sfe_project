// API URL - replace with your actual backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

/**
 * Fetch data from the Google Sheet
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Array>} - Sheet data
 */
export async function fetchSheetData(token) {
  try {
    const response = await fetch(`${API_URL}/sheet`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to fetch sheet data")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching sheet data:", error)
    throw error
  }
}

/**
 * Update sheet URL for a user
 * @param {string} token - JWT token for authentication
 * @param {string} sheetUrl - Google Sheet URL
 * @returns {Promise<Object>} - Updated user data
 */
export async function updateSheetUrl(token, sheetUrl) {
  try {
    const response = await fetch(`${API_URL}/auth/update-sheet`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sheetUrl }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to update sheet URL")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error updating sheet URL:", error)
    throw error
  }
}

/**
 * Get all users (admin only)
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Array>} - List of users
 */
export async function getUsers(token) {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to fetch users")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}
