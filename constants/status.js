const mappingStatusTime = (status) => {
  switch (status) {
    case "Pending Confirmation":
      return "created_at";
    case "Completed":
      return "completed_at";
    case "Cancelled":
      return "canceled_at";
    case "Returned":
      return "returned_at";
    case "In Transit":
      return "shipping_at";
    default:
      return "delivery_at";
  }
};

module.exports = { mappingStatusTime };