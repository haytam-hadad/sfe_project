// Default status configurations
export const DEFAULT_STATUS_CONFIG = {
  confirmation: ["Scheduled", "Awaiting Dispatch", "Delivered", "In Transit", "Returned"],
  delivery: ["Delivered"],
  returned: ["Returned"],
  inProcess: ["Scheduled", "Awaiting Dispatch", "In Transit"],
}

// Helper function to check if an order status matches any in the array
export const matchesStatus = (orderStatus, statusArray) => {
  return statusArray.includes(orderStatus)
}

// Default filters
export const DEFAULT_FILTERS = {
  startDate: null,
  endDate: null,
  product: "",
  city: "",
  country: "",
  status: "",
}

// Default conversion rate
export const DEFAULT_CONVERSION_RATE = 1.0

// Default conversion rates by country
export const DEFAULT_CONVERSION_RATES = {}
