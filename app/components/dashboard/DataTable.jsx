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
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Rnd } from "react-rnd";
import { statusFilters, getClientStatus } from "@/app/utills/filters";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

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
  const [showProspectPopup, setShowProspectPopup] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [bdExecutives, setBdExecutives] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [activeDocs, setActiveDocs] = useState([]);
  const [showTextModal, setShowTextModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [prospectEntries, setProspectEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TruncatedCell = ({ text, title = "Details", maxWidth = "250px" }) => {
    if (!text) return <span className="text-gray-400">—</span>;

    return (
      <div
        className="cursor-pointer hover:underline truncate"
        style={{ maxWidth }}
        title="Click to view full"
        onClick={() => {
          setModalTitle(title);
          setModalText(text);
          setShowTextModal(true);
        }}
      >
        {text}
      </div>
    );
  };

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);

        const usersList = snapshot.docs.map((doc) => ({
          uid: doc.id,
          name: doc.data().name,
          role: doc.data().role,
        }));

        setAllUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAllUsers();
  }, []);

  const executiveMap = useMemo(() => {
    const map = {};
    allUsers.forEach((user) => {
      map[user.uid] = user.name;
    });
    return map;
  }, [allUsers]);

  useEffect(() => {
    if (allUsers.length > 0) {
      fetchClients();
    }
  }, [allUsers]);

  useEffect(() => {
    if (!selectedClient?.docId) return;

    const load = async () => {
      const snap = await getDocs(
        collection(db, "onboarding", selectedClient.docId, "prospects")
      );

      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProspectEntries(arr);
    };

    load();
  }, [selectedClient]);

  const [formData, setFormData] = useState({
    date: "",
    month: "",
    executive: "",
    dealAmount: "",
    payTerm: "",
    productCategory: "",
    companyName: "",
    brandName: "",
    contactPerson: "",
    mobile: "",
    city: "",
    mynRegisNo: "",
    pickupAddress: "",
    marketplace1: "",
    marketplace2: "",
    marketplace3: "",
    marketplace4: "",
    marketplace5: "",
    uploadDocs: [],
    notes: "",
    mouWithSB: "",
    obType: "",
    batch: "",
    obSpoke: "",
    vob: "",
    mailAccess: "",
    serviceability: "",
    onboardingStatus: "",
    myntraAgreement: "",

    registerEmailPrimary: "",
    mailPasswordPrimary: "",
    registerEmailSecondary: "",
    mailPasswordSecondary: "",

    myntraLoginPrimary: "",
    myntraPassPrimary: "",
    myntraLoginSecondary: "",
    myntraPassSecondary: "",

    remarksSB: "",
    bondNocNeeded: "",
    bondReceived: "",
    obNotes: "",
    verifiedByClient: "",

    myntraHandoverDate: "",
    gmailHandoverDate: "",

    listingStatus: "",
    myntraLink: "",
    sellerId: "",
    vendorCode: "",

    sbPayUpdateI: { amount: "", paymentDate: "", payDetails: "" },
    sbPayUpdateII: { amount: "", paymentDate: "", payDetails: "" },
    sbPayUpdateIII: { amount: "", paymentDate: "", payDetails: "" },

    paidToVendorI: { amount: "", paymentDate: "", payDetails: "" },
    paidToVendorII: { amount: "", paymentDate: "", payDetails: "" },
    paidToVendorIII: { amount: "", paymentDate: "", payDetails: "" },
    paidToVendorIV: { amount: "", paymentDate: "", payDetails: "" },

    vendorPayNote: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  useEffect(() => {
    const r = localStorage.getItem("role");
    setRole(r);
  }, []);

  const uploadDocumentsToStorage = async (files, clientId) => {
    const uploadedDocs = [];

    for (const file of files) {
      const storageRef = ref(
        storage,
        `onboarding-documents/${clientId}/${file.name}`
      );

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      uploadedDocs.push({
        name: file.name,
        url: downloadURL,
        uploadedAt: Date.now(),
      });
    }

    return uploadedDocs;
  };

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
        await deleteDoc(doc(db, "onboarding", id));
      }

      toast.success("Deleted successfully");
      fetchClients();
      setSelectedRows([]);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete");
    }
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

  const validateForm = () => {
    let newErrors = {};
    if (!formData.contactPerson.trim()) newErrors.contactPerson = "Required";
    if (!formData.mobile.trim() || formData.mobile.length !== 10)
      newErrors.mobile = "Enter valid 10-digit mobile number";
    // if (!formData.email.trim()) newErrors.email = "Email required";
    // if (!/^\S+@\S+\.\S+$/.test(formData.email))
    //   newErrors.email = "Invalid email";
    // if (!formData.city.trim()) newErrors.city = "City required";
    // setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, formId) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!validateForm()) {
      toast.error("Please fill all required fields * correctly.");
      setIsSubmitting(false);
      return;
    }

    try {
      const newClientId = await generateUniqueClientId();

      let uploadedDocs = [];
      if (formData.uploadDocs && formData.uploadDocs.length > 0) {
        uploadedDocs = await uploadDocumentsToStorage(
          formData.uploadDocs,
          newClientId
        );
      }

      const finalData = {
        ...formData,
        uploadDocs: uploadedDocs,
        clientId: newClientId,
        createdAt: Date.now(),
      };

      await setDoc(doc(db, "onboarding", newClientId), finalData);

      toast.success("Client Saved Successfully ID: " + newClientId);
      fetchClients();
      setOpenForms((prev) => prev.filter((f) => f.id !== formId));
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Failed to save client. Try again!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchClients = async () => {
    try {
      const q = query(
        collection(db, "onboarding"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();

        return {
          docId: docSnap.id,
          ...d,

          executiveName: executiveMap[d.executive] || "—",

          serviceStatus: getClientStatus(
            d.activationDate,
            d.serviceTenure?.split(" ")[0]
          ),

          select: false,
        };
      });

      setAllClients(data);
      setFilteredData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
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

      { Header: "Profile ID", accessor: "docId" },
      { Header: "Contact Person", accessor: "contactPerson" },
      { Header: "Mobile", accessor: "mobile" },
      { Header: "City", accessor: "city" },

      { Header: "Date", accessor: "date" },
      { Header: "Month", accessor: "month" },
      {
        Header: "BD Executive",
        accessor: "executiveName",
      },

      { Header: "Deal Amount (₹)", accessor: "dealAmount" },
      { Header: "Pay Term", accessor: "payTerm" },
      {
        Header: "Documents",
        accessor: "uploadDocs",
        Cell: ({ value }) => {
          if (!value || value.length === 0) {
            return <span className="text-gray-400 italic">No Docs</span>;
          }

          const firstDoc = value[0];
          const remaining = value.length - 1;

          return (
            <div className="flex flex-col text-xs">
              {/* First document */}
              <span
                className="text-blue-600 cursor-pointer hover:underline truncate max-w-40"
                title={firstDoc.name}
                onClick={() => {
                  setActiveDocs(value);
                  setShowDocsModal(true);
                }}
              >
                📎 {firstDoc.name}
              </span>

              {/* +X more */}
              {remaining > 0 && (
                <span
                  className="text-gray-500 cursor-pointer hover:underline"
                  onClick={() => {
                    setActiveDocs(value);
                    setShowDocsModal(true);
                  }}
                >
                  +{remaining} more
                </span>
              )}
            </div>
          );
        },
      },

      /* ================= PRODUCT ================= */
      { Header: "Product Category", accessor: "productCategory" },
      { Header: "Company Name", accessor: "companyName" },
      { Header: "Brand Name", accessor: "brandName" },
      { Header: "Myn Registration No", accessor: "mynRegisNo" },

      {
        Header: "Pick Up Address",
        accessor: "pickupAddress",
        Cell: ({ value }) => (
          <TruncatedCell
            text={value}
            title="Pick Up Address"
            maxWidth="280px"
          />
        ),
      },

      {
        Header: "Marketplace Link 1",
        accessor: "marketplace1",
        Cell: ({ value }) => (
          <TruncatedCell
            text={value}
            title="Marketplace Link 1"
            maxWidth="260px"
          />
        ),
      },

      {
        Header: "Marketplace Link 2",
        accessor: "marketplace2",
        Cell: ({ value }) => (
          <TruncatedCell
            text={value}
            title="Marketplace Link 2"
            maxWidth="260px"
          />
        ),
      },

      {
        Header: "Marketplace Link 3",
        accessor: "marketplace3",
        Cell: ({ value }) => (
          <TruncatedCell
            text={value}
            title="Marketplace Link 3"
            maxWidth="260px"
          />
        ),
      },

      {
        Header: "Marketplace Link 4",
        accessor: "marketplace4",
        Cell: ({ value }) => (
          <TruncatedCell
            text={value}
            title="Marketplace Link 4"
            maxWidth="260px"
          />
        ),
      },

      {
        Header: "Marketplace Link 5",
        accessor: "marketplace5",
        Cell: ({ value }) => (
          <TruncatedCell
            text={value}
            title="Marketplace Link 5"
            maxWidth="260px"
          />
        ),
      },
      {
        Header: "Notes",
        accessor: "notes",
        Cell: ({ value }) => (
          <TruncatedCell text={value} title="Notes" maxWidth="260px" />
        ),
      },

      /* ================= ONBOARDING ================= */
      { Header: "MOU with SB", accessor: "mouWithSB" },
      { Header: "OB Type", accessor: "obType" },
      { Header: "Batch", accessor: "batch" },
      { Header: "OB Spoke", accessor: "obSpoke" },
      { Header: "VOB", accessor: "vob" },
      { Header: "Mail Access", accessor: "mailAccess" },
      { Header: "Serviceability", accessor: "serviceability" },
      { Header: "Onboarding Status", accessor: "onboardingStatus" },
      { Header: "Myntra Agreement", accessor: "myntraAgreement" },

      /* ================= MYNTRA CREDENTIALS ================= */
      { Header: "Register Email (Primary)", accessor: "registerEmailPrimary" },
      { Header: "Mail Password (Primary)", accessor: "mailPasswordPrimary" },

      {
        Header: "Register Email (Secondary)",
        accessor: "registerEmailSecondary",
      },
      {
        Header: "Mail Password (Secondary)",
        accessor: "mailPasswordSecondary",
      },

      { Header: "Myntra Login ID (Primary)", accessor: "myntraLoginPrimary" },
      { Header: "Myntra Password (Primary)", accessor: "myntraPassPrimary" },

      {
        Header: "Myntra Login ID (Secondary)",
        accessor: "myntraLoginSecondary",
      },
      {
        Header: "Myntra Password (Secondary)",
        accessor: "myntraPassSecondary",
      },

      /* ================= BOND & REMARKS ================= */
      { Header: "Bond / NOC Needed", accessor: "bondNocNeeded" },
      { Header: "Bond Received", accessor: "bondReceived" },
      {
        Header: "Remarks (SB)",
        accessor: "remarksSB",
        Cell: ({ value }) => (
          <TruncatedCell
            text={value}
            title="Remarks (Seller Buddy)"
            maxWidth="220px"
          />
        ),
      },
      {
        Header: "OB Notes",
        accessor: "obNotes",
        Cell: ({ value }) => (
          <TruncatedCell text={value} title="OB Notes" maxWidth="260px" />
        ),
      },
      { Header: "Verified By Client", accessor: "verifiedByClient" },
      { Header: "Myntra Handover Date", accessor: "myntraHandoverDate" },
      { Header: "Gmail Handover Date", accessor: "gmailHandoverDate" },
      { Header: "Listing Status", accessor: "listingStatus" },
      {
        Header: "Myntra Link",
        accessor: "myntraLink",
        Cell: ({ value }) =>
          value ? (
            <TruncatedCell text={value} title="Myntra Link" maxWidth="260px" />
          ) : (
            "—"
          ),
      },
      { Header: "Seller ID", accessor: "sellerId" },
      { Header: "Vendor Code", accessor: "vendorCode" },

      {
        Header: "SB Pay Update I",
        accessor: "sbPayUpdateI",
        Cell: ({ value }) =>
          value?.amount
            ? `₹${value.amount} | ${value.paymentDate} | ${value.payDetails}`
            : "—",
      },
      {
        Header: "SB Pay Update II",
        accessor: "sbPayUpdateII",
        Cell: ({ value }) =>
          value?.amount
            ? `₹${value.amount} | ${value.paymentDate} | ${value.payDetails}`
            : "—",
      },
      {
        Header: "SB Pay Update III",
        accessor: "sbPayUpdateIII",
        Cell: ({ value }) =>
          value?.amount
            ? `₹${value.amount} | ${value.paymentDate} | ${value.payDetails}`
            : "—",
      },

      {
        Header: "Paid to Vendor - I",
        accessor: "paidToVendorI",
        Cell: ({ value }) =>
          value?.amount
            ? `₹${value.amount} | ${value.paymentDate} | ${value.payDetails}`
            : "—",
      },
      {
        Header: "Paid to Vendor - II",
        accessor: "paidToVendorII",
        Cell: ({ value }) =>
          value?.amount
            ? `₹${value.amount} | ${value.paymentDate} | ${value.payDetails}`
            : "—",
      },
      {
        Header: "Paid to Vendor - III",
        accessor: "paidToVendorIII",
        Cell: ({ value }) =>
          value?.amount
            ? `₹${value.amount} | ${value.paymentDate} | ${value.payDetails}`
            : "—",
      },
      {
        Header: "Paid to Vendor - IV",
        accessor: "paidToVendorIV",
        Cell: ({ value }) =>
          value?.amount
            ? `₹${value.amount} | ${value.paymentDate} | ${value.payDetails}`
            : "—",
      },

      {
        Header: "Vendor Pay Note",
        accessor: "vendorPayNote",
        Cell: ({ value }) => (
          <TruncatedCell
            text={value}
            title="Vendor Pay Note"
            maxWidth="260px"
          />
        ),
      },
    ],
    [selectedRows, filteredData]
  );

  const generateUniqueClientId = async () => {
    const q = query(
      collection(db, "onboarding"),
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

  return (
    <div className="p-1">
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => setOpenForms([...openForms, { id: Date.now() }])}
          className="bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 transition cursor-pointer"
        >
          Add New Onboarding
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
      </div>

      {openForms.map((form) => (
        <Rnd
          key={form.id}
          default={{
            x: window.innerWidth / 2 - 340 + (form.id % 30),
            y: 2 + (form.id % 10),
            width: 780,
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
                Add New Onboarding
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
              <h3 className="text-xl font-semibold border-b pb-2">
                Basic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Contact Person */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Contact Person: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring"
                    placeholder="Enter contact name"
                  />
                </div>

                {/* Mobile Number */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Mobile Number: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring"
                    placeholder="Enter Mobile number"
                  />
                  {errors.mobile && (
                    <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
                  )}
                </div>

                {/* Email */}
                {/* <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring"
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div> */}

                {/* City */}
                <div className="mb-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    City: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring"
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-semibold border-b pb-2">
                Deal & Product Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                {/* Month */}
                <div>
                  <label className="label">Month</label>
                  <input
                    type="month"
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    BD Executive
                  </label>

                  <select
                    name="executive"
                    value={formData.executive}
                    onChange={handleChange}
                    className="
                    w-full
                    px-3 py-2
                    border border-gray-300
                    rounded-md
                    bg-white
                    text-sm
                    text-gray-800
                    focus:outline-none
                    focus:ring-black
                    focus:border-black
                  "
                  >
                    <option value="">Select BD Executive</option>

                    {allUsers.map((user) => (
                      <option key={user.uid} value={user.uid}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deal Amount */}
                <div>
                  <label className="label">Deal Amount (₹)</label>
                  <input
                    type="number"
                    name="dealAmount"
                    value={formData.dealAmount}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                {/* Pay Term */}
                <div>
                  <label className="label">Pay Term</label>
                  <input
                    type="text"
                    name="payTerm"
                    value={formData.payTerm}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                {/* Product Category */}
                <div>
                  <label className="label">Product Category</label>
                  <input
                    type="text"
                    name="productCategory"
                    value={formData.productCategory}
                    onChange={handleChange}
                    placeholder="Enter product category"
                    className="input"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="label">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                {/* Brand Name */}
                <div>
                  <label className="label">Brand Name</label>
                  <input
                    type="text"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                {/* Myntra Registration */}
                <div>
                  <label className="label">Myn Registration No</label>
                  <input
                    type="text"
                    name="mynRegisNo"
                    value={formData.mynRegisNo}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                {/* Pickup Address */}
                <div className="md:col-span-2">
                  <label className="label">Pick Up Address</label>
                  <textarea
                    name="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={handleChange}
                    className="input h-15"
                  />
                </div>
              </div>

              <h3 className="text-xl font-semibold border-b pb-2 mt-4">
                Marketplace Links
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "marketplace1",
                  "marketplace2",
                  "marketplace3",
                  "marketplace4",
                  "marketplace5",
                ].map((mkt, i) => (
                  <input
                    key={i}
                    type="text"
                    name={mkt}
                    placeholder={`Marketplace Link ${i + 1}`}
                    value={formData[mkt]}
                    onChange={handleChange}
                    className="input"
                  />
                ))}
              </div>

              <input
                type="file"
                multiple
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    uploadDocs: [...e.target.files],
                  })
                }
                className="input"
              />

              <div className="mt-3">
                <label className="label">Note </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  maxLength={500}
                  className="input h-20"
                />
              </div>

              <h3 className="text-xl font-semibold border-b pb-2 mt-6">
                Onboarding Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MOU with SB */}
                <div>
                  <label className="label">MOU with SB</label>
                  <select
                    name="mouWithSB"
                    value={formData.mouWithSB}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* OB Type */}
                <div>
                  <label className="label">OB Type</label>
                  <select
                    name="obType"
                    value={formData.obType}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select</option>
                    <option value="Split">Split</option>
                    <option value="CC">CC</option>
                  </select>
                </div>

                <div>
                  <label className="label">Batch</label>
                  <input
                    type="text"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">OB Spoke</label>
                  <input
                    type="text"
                    name="obSpoke"
                    value={formData.obSpoke}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">VOB</label>
                  <input
                    type="text"
                    name="vob"
                    value={formData.vob}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Mail Access</label>
                  <input
                    type="text"
                    name="mailAccess"
                    value={formData.mailAccess}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Serviceability</label>
                  <input
                    type="text"
                    name="serviceability"
                    value={formData.serviceability}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Onboarding Status</label>
                  <select
                    name="onboardingStatus"
                    value={formData.onboardingStatus}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select Onboarding Status</option>

                    <option value="SB-Agreement Initiated">
                      SB-Agreement Initiated
                    </option>
                    <option value="SB-Agreement Done">SB-Agreement Done</option>
                    <option value="Mail id Created">Mail id Created</option>
                    <option value="Waiting For Docs/Details">
                      Waiting For Docs/Details
                    </option>
                    <option value="Ready for PickUp">Ready for PickUp</option>

                    <option value="To be Initiated">To be Initiated</option>
                    <option value="Initiated">Initiated</option>
                    <option value="Application Accepted">
                      Application Accepted
                    </option>
                    <option value="Category Approved">Category Approved</option>

                    <option value="Under BD">Under BD</option>
                    <option value="BD Clear">BD Clear</option>

                    <option value="VOB - Handover">VOB - Handover</option>
                    <option value="Under VOB">Under VOB</option>
                    <option value="VOB Submitted">VOB Submitted</option>

                    <option value="Myntra Agreement Done">
                      Myntra Agreement Done
                    </option>
                    <option value="Incomplete Portal Access">
                      Incomplete Portal Access
                    </option>

                    <option value="Dry Run - Listing Details Awaited">
                      Dry Run - Listing Details Awaited
                    </option>
                    <option value="Dry Run - Listing Under Process">
                      Dry Run - Listing Under Process
                    </option>
                    <option value="Dry Run - Listing Under QC">
                      Dry Run - Listing Under QC
                    </option>
                    <option value="Dry Run - Listing Approved">
                      Dry Run - Listing Approved
                    </option>
                    <option value="Dry Run - Pin Code issue/other issue">
                      Dry Run - Pin Code issue/other issue
                    </option>
                    <option value="Dry Run - Pickup Pending">
                      Dry Run - Pickup Pending
                    </option>

                    <option value="Live on Myntra - Payment Pending">
                      Live on Myntra - Payment Pending
                    </option>
                    <option value="Live on Myntra">Live on Myntra</option>
                    <option value="Live - Mail handed over">
                      Live - Mail handed over
                    </option>

                    <option value="Revision">Revision</option>
                    <option value="In Process">In Process</option>
                    <option value="Not Responding">Not Responding</option>
                  </select>
                </div>

                <div>
                  <label className="label">Myntra Agreement</label>
                  <input
                    type="text"
                    name="myntraAgreement"
                    value={formData.myntraAgreement}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>

              <h3 className="text-xl font-semibold border-b pb-2 mt-6">
                Myntra Credentials
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Register Email (Primary)</label>
                  <input
                    type="email"
                    name="registerEmailPrimary"
                    value={formData.registerEmailPrimary}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Mail Password (Primary)</label>
                  <input
                    type="password"
                    name="mailPasswordPrimary"
                    value={formData.mailPasswordPrimary}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Register Email (Secondary)</label>
                  <input
                    type="email"
                    name="registerEmailSecondary"
                    value={formData.registerEmailSecondary}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Mail Password (Secondary)</label>
                  <input
                    type="password"
                    name="mailPasswordSecondary"
                    value={formData.mailPasswordSecondary}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Myntra Login ID (Primary)</label>
                  <input
                    type="text"
                    name="myntraLoginPrimary"
                    value={formData.myntraLoginPrimary}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Myntra Password (Primary)</label>
                  <input
                    type="password"
                    name="myntraPassPrimary"
                    value={formData.myntraPassPrimary}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Myntra Login ID (Secondary)</label>
                  <input
                    type="text"
                    name="myntraLoginSecondary"
                    value={formData.myntraLoginSecondary}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Myntra Password (Secondary)</label>
                  <input
                    type="password"
                    name="myntraPassSecondary"
                    value={formData.myntraPassSecondary}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>
              <h3 className="text-xl font-semibold border-b pb-2 mt-6">
                Remarks & Bond Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Remarks (Sellers Buddy)</label>
                  <textarea
                    className="input h-20"
                    name="remarksSB"
                    value={formData.remarksSB}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="label">Bond / NOC Needed</label>
                  <select
                    name="bondNocNeeded"
                    value={formData.bondNocNeeded}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="label">Bond Received</label>
                  <select
                    name="bondReceived"
                    value={formData.bondReceived}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="label">OB Notes </label>
                  <textarea
                    className="input h-15"
                    name="obNotes"
                    value={formData.obNotes}
                    onChange={handleChange}
                    maxLength={500}
                  />
                </div>
              </div>

              <h3 className="text-xl font-semibold border-b pb-2 mt-6">
                Verification, Handover & Listing
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Verified By Client</label>
                  <select
                    name="verifiedByClient"
                    value={formData.verifiedByClient}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="label">Myntra Handover Date</label>
                  <input
                    type="date"
                    name="myntraHandoverDate"
                    value={formData.myntraHandoverDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Gmail Handover Date</label>
                  <input
                    type="date"
                    name="gmailHandoverDate"
                    value={formData.gmailHandoverDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Listing Status</label>
                  <input
                    type="text"
                    name="listingStatus"
                    value={formData.listingStatus}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>

              <h3 className="text-xl font-semibold border-b pb-2 mt-6">
                Myntra & Seller Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Myntra Link</label>
                  <input
                    type="url"
                    name="myntraLink"
                    value={formData.myntraLink}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Seller ID</label>
                  <input
                    type="text"
                    name="sellerId"
                    value={formData.sellerId}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Vendor Code</label>
                  <input
                    type="text"
                    name="vendorCode"
                    value={formData.vendorCode}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>
              <h3 className="text-xl font-semibold border-b pb-2 mt-6">
                SB Pay Updates
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {[
                  ["SB Pay Update I", "sbPayUpdateI"],
                  ["SB Pay Update II", "sbPayUpdateII"],
                  ["SB Pay Update III", "sbPayUpdateIII"],
                ].map(([title, key]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div>
                      <label className="label">Amount</label>
                      <input
                        type="number"
                        value={formData[key].amount}
                        onChange={(e) =>
                          handleNestedChange(key, "amount", e.target.value)
                        }
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Payment Date</label>
                      <input
                        type="date"
                        value={formData[key].paymentDate}
                        onChange={(e) =>
                          handleNestedChange(key, "paymentDate", e.target.value)
                        }
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Pay Details</label>
                      <input
                        type="text"
                        value={formData[key].payDetails}
                        onChange={(e) =>
                          handleNestedChange(key, "payDetails", e.target.value)
                        }
                        className="input"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-semibold border-b pb-2 mt-6">
                Vendor Payments
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {[
                  ["Paid to Vendor - I", "paidToVendorI"],
                  ["Paid to Vendor - II", "paidToVendorII"],
                  ["Paid to Vendor - III", "paidToVendorIII"],
                  ["Paid to Vendor - IV", "paidToVendorIV"],
                ].map(([title, key]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div>
                      <label className="label">Amount</label>
                      <input
                        type="number"
                        value={formData[key].amount}
                        onChange={(e) =>
                          handleNestedChange(key, "amount", e.target.value)
                        }
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Payment Date</label>
                      <input
                        type="date"
                        value={formData[key].paymentDate}
                        onChange={(e) =>
                          handleNestedChange(key, "paymentDate", e.target.value)
                        }
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Pay Details</label>
                      <input
                        type="text"
                        value={formData[key].payDetails}
                        onChange={(e) =>
                          handleNestedChange(key, "payDetails", e.target.value)
                        }
                        className="input"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-semibold border-b pb-2 mt-6">
                Vendor Pay Note
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Vendor Pay Note</label>
                  <textarea
                    className="input h-20"
                    name="vendorPayNote"
                    value={formData.vendorPayNote}
                    onChange={handleChange}
                    maxLength={500}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  w-full py-3 rounded-lg transition flex items-center justify-center gap-2
                  ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#FE681C] hover:bg-[#ff7a33] cursor-pointer"
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  "Submit"
                )}
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
                  {typeof col.Header === "function" ? col.Header() : col.Header}
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

      {showDocsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-[400px] rounded-lg shadow-xl p-5">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Documents</h3>
              <button
                onClick={() => setShowDocsModal(false)}
                className="text-gray-500 hover:text-red-600 text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Docs list */}
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              {activeDocs.map((doc, i) => (
                <a
                  key={i}
                  href={doc.url}
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  📎 {doc.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTextModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-[520px] rounded-lg shadow-xl p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{modalTitle}</h3>
              <button
                onClick={() => setShowTextModal(false)}
                className="text-gray-500 hover:text-red-600 text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Full text */}
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
              {modalText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
