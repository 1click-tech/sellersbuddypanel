import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // your firebase config file
import { collection, getDocs, query, where } from "firebase/firestore";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    let userData = null;
    querySnapshot.forEach((doc) => {
      userData = { id: doc.id, ...doc.data() };
    });
    if (userData.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Login successful", user: userData },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
