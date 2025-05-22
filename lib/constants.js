// Default status configuration
export const DEFAULT_STATUS_CONFIG = {
  confirmation: ["Confirmed", "Shipped", "Delivered", "Completed"],
  delivery: ["Delivered", "Completed"],
  returned: ["Returned", "Rejected", "Cancelled"],
  inProcess: ["Processing", "Pending", "In Transit", "Shipped"],
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
