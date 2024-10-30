const mappingStatusTime = (status) => {
  switch (status) {
    case "Pending Confirmation":
      return "created_at";
    case "Shipping":
      return "delivery_at";
    case "Completed":
      return "completed_at";
    case "Cancelled":
      return "canceled_at";
    case "Returned":
      return "return_at";
    default:
      return "shipping_at";
  }
};

module.exports = mappingStatusTime;
