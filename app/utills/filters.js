const parseAnyDate = (value) => {
  if (!value) return null;
  if (value.includes("-") && value.split("-")[0].length === 4) {
    return new Date(value);
  }
  if (value.includes("-")) {
    const [day, month, year] = value.split("-");
    return new Date(`${year}-${month}-${day}`);
  }
  if (value.includes("/")) {
    const [day, month, year] = value.split("/");
    return new Date(`${year}-${month}-${day}`);
  }
  return new Date(value);
};
export const statusFilters = [
  {
    label: "Active",
    value: "active",
    className:
      "bg-green-200 text-green-800 hover:bg-green-600 border border-green-700 cursor-pointer",
  },
  {
    label: "T + 1",
    value: "t1",
    className:
      "bg-yellow-200 text-yellow-800 hover:bg-yellow-600 border border-yellow-700 cursor-pointer",
  },
  {
    label: "T + 3",
    value: "t3",
    className:
      "bg-blue-200 text-blue-800 hover:bg-blue-600 border border-blue-700 cursor-pointer",
  },
  {
    label: "Inactive",
    value: "inactive",
    className:
      "bg-red-200 text-red-800 hover:bg-red-500 border border-red-700 cursor-pointer",
  },
];

export const getClientStatus = (activationDate, tenure) => {
  if (!activationDate || !tenure) return "inactive";

  if (tenure.toLowerCase() === "other") return "inactive";

  const start = parseAnyDate(activationDate);
  if (!start || isNaN(start)) return "inactive";

  const months = parseInt(tenure);
  if (isNaN(months) || months <= 0) return "inactive";

  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + months);

  const today = new Date();
  if (isNaN(expiry)) return "inactive";

  const remainingDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (remainingDays <= 0) return "inactive"; 
  if (remainingDays <= 30) return "t1";      
  if (remainingDays <= 90) return "t3";    
  return "active";                           
};

