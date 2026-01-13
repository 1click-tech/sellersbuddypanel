"use client";
import React, { useState, useEffect, useMemo } from "react";
import { MdClose } from "react-icons/md";
import { Image as ImageIcon } from "lucide-react";
import CustomTable from "../../utills/customTable";
import { Settings } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { deleteDoc } from "firebase/firestore";

import {
  collection,
  setDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Rnd } from "react-rnd";
import { statusFilters, getClientStatus } from "@/app/utills/filters";
import { Funnel } from "lucide-react";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

const TextModal = ({ title, text, onClose }) => {
  if (!text) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-9999">
      <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-[700px]">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-xl text-gray-500 hover:text-red-500"
          >
            ✖
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <p className="text-gray-800 whitespace-pre-wrap text-sm">{text}</p>
        </div>
      </div>
    </div>
  );
};

const TruncateTextCell = ({
  value,
  title,
  width = "260px",
  isLink = false,
}) => {
  const [open, setOpen] = useState(false);
  if (!value) return "—";

  return (
    <>
      <div
        className="truncate cursor-pointer text-gray-800"
        style={{ maxWidth: width }}
        title="Click to view"
        onClick={() => setOpen(true)}
      >
        {value}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-9999">
          <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-[700px]">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-800">{title}</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-xl text-gray-500 hover:text-red-500"
              >
                ✖
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto text-sm text-gray-800 break-all">
              {isLink ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {value}
                </a>
              ) : (
                <p className="whitespace-pre-wrap">{value}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Services = () => {
  const [errors, setErrors] = useState({});
  const [openForms, setOpenForms] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [columnOrder, setColumnOrder] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [allClients, setAllClients] = useState([]);
  const [role, setRole] = useState("");
  // Prospect Delivery Popup
  const [showProspectPopup, setShowProspectPopup] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [notes, setNotes] = useState("");
  const [notesHistory, setNotesHistory] = useState([]);

  useEffect(() => {
    if (!selectedClient?.docId) return;

    const loadNotes = async () => {
      const snap = await getDocs(
        collection(db, "clients", selectedClient.docId, "notesHistory")
      );

      const arr = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.createdAt - a.createdAt);

      setNotesHistory(arr);
    };

    loadNotes();
  }, [selectedClient]);

  const saveNote = async () => {
    if (!notes.trim()) {
      toast.error("Please enter a note!");
      return;
    }

    const refColl = collection(
      db,
      "clients",
      selectedClient.docId,
      "notesHistory"
    );

    const newNote = {
      note: notes,
      createdAt: Date.now(),
    };

    const docRef = doc(refColl);
    await setDoc(docRef, newNote);

    toast.success("Note saved!");

    setNotesHistory((prev) => [{ id: docRef.id, ...newNote }, ...prev]);
    setNotes("");
  };

  const deleteNote = async (id) => {
    await deleteDoc(
      doc(db, "clients", selectedClient.docId, "notesHistory", id)
    );

    setNotesHistory((prev) => prev.filter((item) => item.id !== id));

    toast.success("Note deleted");
  };

  const [formData, setFormData] = useState({
    contactPerson: "",
    mobile: "",
    email: "",
    city: "",
    companyName: "",
    brandName: "",
    companyAddress: "",
    pinCode: "",
    gst: "",
    turnOver: "",
    productImages: [],

    activationDate: "",
    salesExecutive: "",
    servicePlan: "",
    salesAmount: "",
    serviceTenure: "",
    serviceExpireDate: "",

    website: "",
    marketplace1: "",
    marketplace2: "",
    marketplace3: "",
    marketplace4: "",

    notes: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Set user role from localStorage
  useEffect(() => {
    const r = localStorage.getItem("role");
    setRole(r);
  }, []);

  // Delete selected clients
  const handleDelete = async () => {
    if (role !== "admin") {
      toast.error("Only admin can delete records.");
      return;
    }

    if (selectedRows.length === 0) {
      toast.error("Please select at least one record.");
      return;
    }

    const confirmDelete = confirm(
      `Delete ${selectedRows.length} selected record(s)?`
    );
    if (!confirmDelete) return;

    try {
      for (const id of selectedRows) {
        await deleteDoc(doc(db, "clients", id));
      }

      toast.success("Deleted successfully");
      fetchClients();
      setSelectedRows([]);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete");
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const inputError = (field) =>
    errors[field] ? "border-red-500" : "border-gray-300";

  const formatOnlyDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  const formatDateTime = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const mins = pad(date.getMinutes());
    const secs = pad(date.getSeconds());
    return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
  };

  const handleTenureChange = (e) => {
    const tenure = e.target.value;
    let months = 0;
    if (tenure !== "Other" && tenure !== "") {
      months = parseInt(tenure);
    }
    const today = new Date();
    const todayFormatted = today.toISOString().split("T")[0];
    let expireDate = "";
    if (months > 0) {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + months);
      expireDate = expiry.toISOString().split("T")[0];
    }
    setFormData({
      ...formData,
      serviceTenure: tenure,
      activationDate: tenure !== "Other" ? todayFormatted : "",
      serviceExpireDate: tenure !== "Other" ? expireDate : "",
    });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.contactPerson.trim()) newErrors.contactPerson = "Required";
    if (!formData.mobile.trim() || formData.mobile.length !== 10)
      newErrors.mobile = "Enter valid 10-digit mobile number";
    if (!formData.email.trim()) newErrors.email = "Email required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Invalid email";
    if (!formData.city.trim()) newErrors.city = "City required";
    // if (!formData.companyName.trim())
    //   newErrors.companyName = "Company Name required";
    // if (!formData.companyAddress.trim())
    //   newErrors.companyAddress = "Address required";
    if (!formData.serviceTenure.trim())
      newErrors.serviceTenure = "Select service tenure";
    if (!formData.activationDate)
      newErrors.activationDate = "Activation date required";
    if (!formData.serviceExpireDate)
      newErrors.serviceExpireDate = "Expire date required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e, formId) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill all required fields * correctly.");
      return;
    }
    try {
      const newClientId = await generateUniqueClientId();
      let imageUrls = [];
      for (const file of selectedImages) {
        const imgRef = ref(
          storage,
          `ClientsImages/${newClientId}/${file.name}`
        );
        await uploadBytes(imgRef, file);
        const url = await getDownloadURL(imgRef);
        imageUrls.push(url);
      }
      const finalData = {
        ...formData,
        activationDate: formatOnlyDate(formData.activationDate),
        serviceExpireDate: formatOnlyDate(formData.serviceExpireDate),
        productImages: imageUrls,
        clientId: newClientId,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "clients", newClientId), finalData);
      fetchClients();
      toast.success("Client Saved Successfully ID: " + newClientId);
      setOpenForms((prev) => prev.filter((f) => f.id !== formId));
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Failed to save client. Try again!");
    }
    // Reset form
    setFormData({
      contactPerson: "",
      mobile: "",
      email: "",
      city: "",
      companyName: "",
      brandName: "",
      companyAddress: "",
      pinCode: "",
      gst: "",
      turnOver: "",
      productImages: [],

      activationDate: "",
      salesExecutive: "",
      servicePlan: "",
      salesAmount: "",
      serviceTenure: "",
      serviceExpireDate: "",

      website: "",
      marketplace1: "",
      marketplace2: "",
      marketplace3: "",
      marketplace4: "",

      notes: "",
    });
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const getClientImages = async (docId) => {
    try {
      const folderRef = ref(storage, `ClientsImages/${docId}`);
      const result = await listAll(folderRef);
      const urls = await Promise.all(
        result.items.map((item) => getDownloadURL(item))
      );
      return urls.slice(0, 50);
    } catch (error) {
      console.warn(`No images found for ${docId}:`, error);
      return [];
    }
  };

  const fetchClients = async () => {
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((docSnap) => ({
        docId: docSnap.id,
        ...docSnap.data(),
        productImages: [],
        serviceStatus: getClientStatus(
          docSnap.data().activationDate,
          docSnap.data().serviceTenure?.split(" ")[0]
        ),
      }));

      setAllClients(data);
      setFilteredData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const statusColors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-700",
    t1: "bg-yellow-100 text-yellow-700",
    t3: "bg-blue-100 text-blue-700",
  };

  const columns = useMemo(
    () => [
      {
        Header: () => (
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={
                selectedRows.length > 0 &&
                selectedRows.length === filteredData.length
              }
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedRows(filteredData.map((c) => c.docId));
                } else {
                  setSelectedRows([]);
                }
              }}
            />
            <span className="text-xs font-semibold">Select</span>
          </div>
        ),
        accessor: "select",
        disableSortBy: true,

        Cell: ({ row }) => {
          const id = row.original.docId;

          return (
            <input
              type="checkbox"
              checked={selectedRows.includes(id)}
              onChange={() => {
                setSelectedRows((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id]
                );
              }}
            />
          );
        },

        width: 50,
      },

      {
        Header: "Profile ID",
        accessor: "docId",
        Cell: ({ row }) => (
          <button
            className="text-blue-600 font-medium underline cursor-pointer"
            onClick={() => {
              setSelectedClient(row.original);
              setShowProspectPopup(true);
            }}
          >
            {row.original.docId}
          </button>
        ),
      },

      { Header: "Company Name", accessor: "companyName" },
      { Header: "Brand Name", accessor: "brandName" },
      { Header: "Contact Person", accessor: "contactPerson" },

      {
        Header: "Service Status",
        accessor: "serviceStatus",
        Cell: ({ row }) => {
          const status = getClientStatus(
            row.original.activationDate,
            row.original.serviceTenure?.split(" ")[0]
          );

          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium inline-block text-center ${statusColors[status]}`}
            >
              {status === "t1"
                ? "T + 1"
                : status === "t3"
                ? "T + 3"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },

      { Header: "Service Tenure", accessor: "serviceTenure" },
      { Header: "Activation Date", accessor: "activationDate" },
      {
        Header: "Service Expire Date",
        accessor: "serviceExpireDate",
        className: "min-w-[130px] max-w-[240px]",
      },
      { Header: "Service Type", accessor: "servicePlan" },
      { Header: "Sales Amount", accessor: "salesAmount" },
      { Header: "Sales Executive", accessor: "salesExecutive" },
      { Header: "Mobile", accessor: "mobile" },
      { Header: "Email", accessor: "email" },
      { Header: "City", accessor: "city" },
      {
        Header: "Company Address",
        accessor: "companyAddress",
        Cell: ({ value }) => (
          <TruncateTextCell
            value={value}
            title="Company Address"
            width="300px"
          />
        ),
      },

      { Header: "Pin Code", accessor: "pinCode" },
      { Header: "GST Number", accessor: "gst" },
      { Header: "Turnover", accessor: "turnOver" },
      {
        Header: "Website Link",
        accessor: "website",
        Cell: ({ value }) => (
          <TruncateTextCell value={value} title="Website Link" isLink />
        ),
      },
      {
        Header: "Marketplace 1",
        accessor: "marketplace1",
        Cell: ({ value }) => (
          <TruncateTextCell value={value} title="Marketplace Link 1" isLink />
        ),
      },
      {
        Header: "Marketplace 2",
        accessor: "marketplace2",
        Cell: ({ value }) => (
          <TruncateTextCell value={value} title="Marketplace Link 2" isLink />
        ),
      },
      {
        Header: "Marketplace 3",
        accessor: "marketplace3",
        Cell: ({ value }) => (
          <TruncateTextCell value={value} title="Marketplace Link 3" isLink />
        ),
      },
      {
        Header: "Marketplace 4",
        accessor: "marketplace4",
        Cell: ({ value }) => (
          <TruncateTextCell value={value} title="Marketplace Link 4" isLink />
        ),
      },

      {
        Header: "Notes",
        accessor: "notes",
        Cell: ({ value }) => <TruncateTextCell value={value} title="Notes" />,
      },
    ],
    [selectedRows, filteredData]
  );

  const generateUniqueClientId = async () => {
    const q = query(
      collection(db, "clients"),
      orderBy("clientId", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return "SB0001";
    }
    const lastId = snapshot.docs[0].data().clientId;
    const num = parseInt(lastId.replace("SB", "")) + 1;
    return "SB" + num.toString().padStart(4, "0");
  };

  useEffect(() => {
    const saved = localStorage.getItem("visibleColumns");
    const savedOrder = localStorage.getItem("columnOrder");

    if (saved && savedOrder) {
      setVisibleColumns(JSON.parse(saved));
      setColumnOrder(JSON.parse(savedOrder));
    } else {
      const initial = {};
      columns.forEach((col) => (initial[col.accessor] = true));
      setVisibleColumns(initial);
      setColumnOrder(columns.map((col) => col.accessor));
    }
  }, [columns]);

  useEffect(() => {
    if (Object.keys(visibleColumns).length > 0) {
      localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns));
      localStorage.setItem("columnOrder", JSON.stringify(columnOrder));
    }
  }, [visibleColumns, columnOrder]);

  const handleToggleColumn = (accessor) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [accessor]: !prev[accessor],
    }));
  };

  const filteredColumns = useMemo(() => {
    return columns.filter((col) => visibleColumns[col.accessor]);
  }, [columns, visibleColumns]);

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="p-1">
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => setOpenForms([...openForms, { id: Date.now() }])}
          className="bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 transition cursor-pointer"
        >
          Add New Client
        </button>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search Clients..."
          value={searchValue}
          onChange={(e) => {
            const value = e.target.value.toLowerCase();
            setSearchValue(value);

            if (!value.trim()) {
              setFilteredData(allClients);
              return;
            }

            const filtered = allClients.filter((client) =>
              Object.values(client).join(" ").toLowerCase().includes(value)
            );

            setFilteredData(filtered);
          }}
          className="border border-gray-400 px-3 py-1 rounded-md text-sm"
        />

        <button
          onClick={() => setShowSettings(true)}
          className="p-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition flex items-center justify-center shadow-sm cursor-pointer"
        >
          <Settings className="w-4 h-4 text-gray-700 " />
        </button>

        {/* delete service button */}

        {role === "admin" && (
          <button
            onClick={handleDelete}
            className="p-2 w-16 h-8 rounded-md text-white bg-red-500 cursor-pointer transition flex items-center justify-center shadow-sm hover:bg-red-600 active:scale-95"
          >
            Delete
          </button>
        )}

        {/* Funnel Button */}
        {/* <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-1 px-2 border border-gray-300 text-gray-700 py-1 rounded-md hover:bg-gray-100 text-sm cursor-pointer"
        >
          <Funnel size={22} />
        </button> */}


        {/* Filter Options  */}
        <div className="flex items-center gap-2 p-2 border border-gray-300 py-1 rounded-md">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                const filtered = allClients.filter(
                  (client) =>
                    getClientStatus(
                      client.activationDate,
                      client.serviceTenure?.split(" ")[0]
                    ) === filter.value
                );
                setFilteredData(filtered);
              }}
              className={`px-2 py-1 bg-gray-200 text-xs rounded-md hover:text-white transition ${filter.className}`}
            >
              {filter.label}
            </button>
          ))}

          {/* Reset Button */}
          <button
            onClick={() => setFilteredData(allClients)}
            className="px-2 py-1 bg-gray-300 border border-gray-600 text-xs rounded-md hover:bg-gray-600 hover:text-white transition"
          >
            Reset
          </button>
        </div>
      </div>

      {openForms.map((form) => (
        <Rnd
          key={form.id}
          default={{
            x: window.innerWidth / 2 - 340 + (form.id % 30),
            y: 2 + (form.id % 10),
            width: 680,
            height: "auto",
          }}
          minWidth={350}
          bounds="window"
          dragHandleClassName="drag-header"
          enableResizing={{
            bottomRight: true,
            bottom: true,
            right: true,
          }}
          style={{
            zIndex: 1000,
            borderRadius: "14px",
            backdropFilter: "blur(10px)",
          }}
          className="absolute bg-white shadow-[0_10px_40px_rgba(0,0,0,0.25)] border border-gray-200"
        >
          {/* Header */}
          <div className="drag-header cursor-move bg-linear-to-r from-[#FE681C] to-[#FF8744] text-white px-5 py-3.5 rounded-t-xl flex justify-between items-center select-none shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
              <span className="font-semibold text-base tracking-wide">
                Add New Client
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Minimize Button */}
              <button
                type="button"
                className="text-white text-lg font-bold w-7 h-7 rounded-md hover:bg-white/20 active:bg-white/30 transition-all duration-200 flex items-center justify-center cursor-pointer"
                onClick={() => {
                  document
                    .getElementById(`form-body-${form.id}`)
                    .classList.toggle("hidden");
                }}
              >
                –
              </button>

              {/* Close Button */}
              <button
                type="button"
                className="text-white w-7 h-7 rounded-md hover:bg-white/20 active:bg-white/30 transition-all duration-200 flex items-center justify-center group cursor-pointer"
                onClick={() =>
                  setOpenForms(openForms.filter((f) => f.id !== form.id))
                }
              >
                <MdClose className="text-xl group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>
          <div
            id={`form-body-${form.id}`}
            className="p-4 max-h-[82vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
          >
            <form
              onSubmit={(e) => handleSubmit(e, form.id)}
              className="space-y-3"
            >
              {/* Basic Details */}
              {/* Basic Details */}
              <h3 className="text-xl font-semibold border-b pb-2">
                Basic Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Company Name */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter company name"
                  />
                </div>

                {/* Brand Name */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter brand name"
                  />
                </div>

                {/* Contact Person */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter contact name"
                  />
                </div>
              </div>

              {/* Service Details */}
              <h3 className="text-xl font-semibold border-b pb-2 mt-4">
                Service Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Service Status (readonly) */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Service Status
                  </label>
                  <input
                    type="text"
                    value={getClientStatus(
                      formData.activationDate,
                      formData.serviceTenure?.split(" ")[0]
                    )}
                    disabled
                    className="w-full px-3 py-1 bg-gray-100 border rounded-md"
                  />
                </div>

                {/* Service Tenure */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Service Tenure <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="serviceTenure"
                    value={formData.serviceTenure}
                    onChange={handleTenureChange}
                    className="w-full px-3 py-1 border rounded-md"
                  >
                    <option value="">Select Tenure</option>
                    <option value="1 Months">1 Month</option>
                    <option value="2 Months">2 Months</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months</option>
                  </select>
                </div>

                {/* Activation Date */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Activation Date
                  </label>
                  <input
                    type="date"
                    name="activationDate"
                    value={formData.activationDate}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                  />
                </div>

                {/* Expiry Date */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Service Expire Date
                  </label>
                  <input
                    type="date"
                    name="serviceExpireDate"
                    value={formData.serviceExpireDate}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                  />
                </div>

                {/* Service Type — NEW FIELD */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="servicePlan"
                    value={formData.servicePlan}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter service type (e.g., SEO, Ads, SMM)"
                  />
                </div>

                {/* Sales Amount */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Sales Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="salesAmount"
                    value={formData.salesAmount}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter Amount"
                  />
                </div>

                {/* Sales Executive */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Sales Executive
                  </label>
                  <input
                    type="text"
                    name="salesExecutive"
                    value={formData.salesExecutive}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter Sales Executive Name"
                  />
                </div>
              </div>

              {/* Contact Details */}
              <h3 className="text-xl font-semibold border-b pb-2 mt-4">
                Contact Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter Mobile"
                  />
                </div>

                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter Email"
                  />
                </div>

                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter City"
                  />
                </div>

                <div className="mb-1 md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Company Address
                  </label>
                  <input
                    type="text"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter Address"
                  />
                </div>

                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Pin Code
                  </label>
                  <input
                    type="number"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter Pin Code"
                  />
                </div>

                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gst"
                    value={formData.gst}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter GST No."
                  />
                </div>

                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Turnover
                  </label>
                  <input
                    type="text"
                    name="turnOver"
                    value={formData.turnOver}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter Turnover"
                  />
                </div>
              </div>

              {/* Website & Marketplace Links */}
              <h3 className="text-xl font-semibold border-b pb-2 mt-4">
                Online Presence
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Website Link
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border rounded-md"
                    placeholder="Enter website URL"
                  />
                </div>

                {[1, 2, 3, 4].map((num) => (
                  <div className="mb-1" key={num}>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Marketplace Link {num}
                    </label>
                    <input
                      type="text"
                      name={`marketplace${num}`}
                      value={formData[`marketplace${num}`] || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-1 border rounded-md"
                      placeholder={`Enter marketplace link ${num}`}
                    />
                  </div>
                ))}
              </div>

              {/* Notes */}
              <h3 className="text-xl font-semibold border-b pb-2 mt-4">
                Notes
              </h3>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Add notes..."
              ></textarea>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-[#FE681C] text-white py-3 rounded-lg hover:bg-[#ff7a33] transition cursor-pointer"
              >
                Submit
              </button>
            </form>
          </div>
        </Rnd>
      ))}

      {/* Table */}
      {filteredColumns.length > 0 ? (
        <CustomTable
          uniqueDataKey="docId"
          data={filteredData}
          columns={filteredColumns}
          searchValue={searchValue}
          loading={loading}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />
      ) : (
        <p className="text-gray-500 text-center mt-10">
          No columns selected. Please select columns from settings ⚙️
        </p>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[350px]">
            <h3 className="text-lg font-semibold mb-4">Select Columns</h3>

            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
              {columns.map((col) => (
                <label key={col.accessor} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleColumns[col.accessor] || false}
                    onChange={() => handleToggleColumn(col.accessor)}
                  />

                  {/* FIX: Prevent function render error */}
                  <span>
                    {typeof col.Header === "string" ? col.Header : col.accessor}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setShowSettings(false)}
                className="bg-[#FE681C] text-white px-3 py-1 rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 z-50">
          <div className="relative bg-white rounded-lg shadow-lg w-[95%] sm:w-[800px] h-[95vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-center p-3 border-b border-gray-300 bg-white sticky top-0 z-50">
              <h2 className="text-lg font-semibold text-gray-800 text-center">
                {selectedImage.name} - {selectedImage.urls.length} Image
                {selectedImage.urls.length > 1 && "s"}
              </h2>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute right-3 text-gray-500 hover:text-red-600 text-2xl font-bold cursor-pointer"
              >
                ✖
              </button>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Images Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {selectedImage.urls.map((url, index) => (
                  <div
                    key={index}
                    className="relative group border border-gray-300 rounded-md overflow-hidden bg-gray-50"
                  >
                    <img
                      src={url}
                      alt={`Client ${index + 1}`}
                      className="w-full h-48 object-cover rounded-md cursor-pointer"
                    />

                    {/* Download One Image */}
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(url, {
                            cache: "no-cache",
                          });
                          const blob = await response.blob();
                          saveAs(
                            blob,
                            `${selectedImage.name}_image_${index + 1}.jpg`
                          );
                        } catch (err) {
                          console.error("Image download failed:", err);
                          toast.error(
                            "Failed to download this image. Please try again."
                          );
                        }
                      }}
                      className="absolute bottom-3 right-3 bg-white text-gray-800 rounded-full p-2 shadow-md 
                    opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-400 cursor-pointer"
                      title="Download this image"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Download All Images */}
              {selectedImage.urls.length > 0 && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={async () => {
                      try {
                        const zip = new JSZip();
                        const folder = zip.folder(
                          selectedImage.name || "client"
                        );

                        const blobs = await Promise.all(
                          selectedImage.urls.map(async (url) => {
                            const response = await fetch(url, {
                              cache: "no-cache",
                            });
                            return response.blob();
                          })
                        );

                        blobs.forEach((blob, i) => {
                          folder.file(`image_${i + 1}.jpg`, blob);
                        });

                        const zipBlob = await zip.generateAsync({
                          type: "blob",
                        });
                        saveAs(zipBlob, `${selectedImage.name}_images.zip`);
                      } catch (err) {
                        console.error("ZIP download failed:", err);
                        toast.error(
                          "Failed to download all images. Please try again."
                        );
                      }
                    }}
                    className="bg-[#f56219] text-white px-5 py-2 rounded-md font-medium 
                  hover:bg-[#bd460a] transition-colors cursor-pointer"
                  >
                    Download All Images
                  </button>
                </div>
              )}

              {/* Client Info */}
              <div className="text-sm text-gray-700 border-t pt-3 mt-5 space-y-1">
                <p>
                  <strong>Doc ID:</strong> {selectedImage.details.docId}
                </p>
                <p>
                  <strong>Company:</strong> {selectedImage.details.companyName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedImage.details.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProspectPopup && (
        <div className="fixed top-0 right-0 h-full w-[600px] bg-white shadow-xl border-l p-5 z-9999 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4 mb-5">
            <h2 className="text-xl font-semibold text-gray-800">
              Notes – {selectedClient?.docId}
            </h2>

            <button
              className="text-red-500 text-2xl hover:text-red-600 transition cursor-pointer"
              onClick={() => setShowProspectPopup(false)}
            >
              ✖
            </button>
          </div>

          {/* Add New Note */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Add Note
            </h3>

            <textarea
              placeholder="Write a note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm h-28 
        focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            ></textarea>

            <button
              onClick={saveNote}
              className="bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition 
        text-white px-4 py-2.5 rounded-md w-full font-medium text-sm shadow-sm cursor-pointer"
            >
              Save Note
            </button>
          </div>

          {/* Notes History */}
          <h3 className="font-semibold mt-6 mb-3 text-lg text-gray-800">
            Notes History
          </h3>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="bg-gray-50 px-5 py-3 font-semibold text-gray-700 text-sm border-b">
              Previous Notes
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-200">
              {notesHistory.length === 0 ? (
                <div className="p-5 text-gray-500 text-sm">
                  No notes added yet.
                </div>
              ) : (
                notesHistory.map((item, index) => (
                  <div
                    key={index}
                    className="px-5 py-3 text-sm hover:bg-gray-50 transition"
                  >
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {item.note}
                    </p>

                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteNote(item.id)}
                        className="text-red-500 text-xs hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
