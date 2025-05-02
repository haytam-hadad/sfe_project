// Default status configurations
export const defaultStatusConfig = {
  confirmation: ["Scheduled", "Awaiting Dispatch", "Delivered", "In Transit", "Returned"],
  delivery: ["Delivered"],
  returned: ["Returned"],
  inProcess: ["Scheduled", "Awaiting Dispatch", "In Transit"],
}

// Helper function to check if an order status matches any in the array
export const matchesStatus = (orderStatus, statusArray) => {
  return statusArray.includes(orderStatus)
}
