export const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin`

// Get all users (admin only)
export async function fetchAllUsers(token) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || "Failed to fetch users")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

// Get specific user details (admin only)
export async function fetchUser(token, userId) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || "Failed to fetch user")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching user:", error)
    throw error
  }
}

// Update user (admin only)
export async function updateUser(token, userId, userData) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || "Failed to update user")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

// Delete user (admin only)
export async function deleteUser(token, userId) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || "Failed to delete user")
    }

    return await response.json()
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

// Get user's sheet data (admin only)
export async function fetchUserSheetData(token, userId, sheetUrl = null) {
  try {
    if (!token) {
      throw new Error("Authentication required")
    }

    let url = `${API_BASE_URL}/users/${userId}/sheet-data`
    if (sheetUrl) {
      url += `?sheetUrl=${encodeURIComponent(sheetUrl)}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || "Failed to fetch user sheet data")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching user sheet data:", error)
    throw error
  }
}
