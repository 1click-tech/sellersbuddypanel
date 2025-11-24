
export const statusFilters = [
  {
    label: "Active",
    value: "active",
    className:
      "bg-green-800 text-white hover:bg-green-600 border border-green-700"
  },
  {
    label: "T + 1",
    value: "t1",
    className:
      "bg-orange-500 text-white hover:bg-blue-600 border border-blue-700"
  },
  {
    label: "T + 3",
    value: "t3",
    className:
      "bg-yellow-500 text-white hover:bg-yellow-600 border border-yellow-700"
  },
  {
    label: "Inactive",
    value: "inactive",
    className:
      "bg-red-800 text-white hover:bg-red-600 border border-red-700"
  }
];

export const getClientStatus = (activationDate, tenureMonths) => {
  if (!activationDate || !tenureMonths) return "inactive";

  const start = new Date(activationDate);
  const months = parseInt(tenureMonths);

  const end = new Date(start);
  end.setMonth(start.getMonth() + months);

  const today = new Date();
  if (today > end) return "inactive";
  const diffMonths =
    (today.getFullYear() - start.getFullYear()) * 12 +
    (today.getMonth() - start.getMonth());
    if (diffMonths < 1) return "t1";
    if (diffMonths < 3) return "t3";
  return "active";
};

