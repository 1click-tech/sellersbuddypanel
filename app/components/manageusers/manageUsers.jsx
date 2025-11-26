"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import CustomTable from "../../utills/customTable";
import { MdClose } from "react-icons/md";
import toast from "react-hot-toast";

const ManageUsers = () => {
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState("");
  const [users, setUsers] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nextUID, setNextUID] = useState("");
  const [allUsers, setAllUsers] = useState([]);

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text
      ?.toString()
      .replace(regex, `<mark class="bg-yellow-300 text-black">$1</mark>`);
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      toast.error("You are not authorized to access this page.");
      window.location.href = "/dashboard";
    }
  }, []);

  const loadUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));

    let usersList = [];
    let maxNumber = 0;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      usersList.push(data);

      const id = data.uid;
      if (id) {
        const num = parseInt(id.replace("UID", ""));
        if (num > maxNumber) maxNumber = num;
      }
    });

    setUsers(usersList);
    setAllUsers(usersList);

    const nextNumber = (maxNumber + 1).toString().padStart(3, "0");
    setNextUID(`UID${nextNumber}`);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userDocRef = doc(collection(db, "users"), nextUID);
    await setDoc(userDocRef, {
      uid: nextUID,
      name,
      email,
      employeeId,
      phone,
      password,
      role,
      createdAt: new Date(),
    });

    toast.success(`User created successfully! ${nextUID}`);
    setName("");
    setEmail("");
    setEmployeeId("");
    setPhone("");
    setPassword("");
    setShowForm(false);
    loadUsers();
  };

  const columns = [
    {
      Header: "UID",
      accessor: "uid",
      Cell: ({ value }) => (
        <span
          dangerouslySetInnerHTML={{
            __html: highlightText(value, searchValue),
          }}
        />
      ),
    },
    {
      Header: "Name",
      accessor: "name",
      Cell: ({ value }) => (
        <span
          dangerouslySetInnerHTML={{
            __html: highlightText(value, searchValue),
          }}
        />
      ),
    },
    {
      Header: "Email",
      accessor: "email",
      Cell: ({ value }) => (
        <span
          dangerouslySetInnerHTML={{
            __html: highlightText(value, searchValue),
          }}
        />
      ),
    },
    {
      Header: "Phone",
      accessor: "phone",
      Cell: ({ value }) => (
        <span
          dangerouslySetInnerHTML={{
            __html: highlightText(value, searchValue),
          }}
        />
      ),
    },
    {
      Header: "Employee ID",
      accessor: "employeeId",
      Cell: ({ value }) => (
        <span
          dangerouslySetInnerHTML={{
            __html: highlightText(value, searchValue),
          }}
        />
      ),
    },
    {
      Header: "Role",
      accessor: "role",
      Cell: ({ value }) => (
        <span
          dangerouslySetInnerHTML={{
            __html: highlightText(value, searchValue),
          }}
        />
      ),
    },
    {
      Header: "Password",
      accessor: "password",
      Cell: ({ value }) => (
        <span
          dangerouslySetInnerHTML={{
            __html: highlightText(value, searchValue),
          }}
        />
      ),
    },
  ];

  return (
    <div className="p-1">
      <button
        onClick={() => setShowForm(true)}
        className="bg-[#f56219] text-white px-2 py-1 rounded-lg cursor-pointer"
      >
        Add User
      </button>

      {/*  seach in Table   */}
      <input
        type="text"
        placeholder="Search Users..."
        className="ml-4 p-1  border border-gray-400 px-3 py-1 rounded-md text-sm"
        onChange={(e) => {
          const value = e.target.value.toLowerCase();
          setSearchValue(value);

          if (!value.trim()) {
            setUsers(allUsers);
            return;
          }

          const filtered = allUsers.filter((user) =>
            Object.values(user).join(" ").toLowerCase().includes(value)
          );

          setUsers(filtered);
        }}
      />

      {/* POPUP FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50  z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative animate-[fadeIn_0.3s_ease]">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-red-600 cursor-pointer"
              onClick={() => setShowForm(false)}
            >
              <MdClose size={24} />
            </button>
            <h2 className="text-2xl font-semibold mb-4">Create User Account</h2>
            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Enter Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Enter Email</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Enter Employee ID
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Enter Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full p-2 border rounded-lg"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Enter Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Select User Role
                </label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#f56219] text-white py-2 rounded-lg hover:opacity-90 transition cursor-pointer"
              >
                {" "}
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* USERS TABLE */}
      <div className="mt-4">
        <CustomTable columns={columns} data={users} searchValue={searchValue} />
      </div>
    </div>
  );
};

export default ManageUsers;
