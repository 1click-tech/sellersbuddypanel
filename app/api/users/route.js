import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { email, password, role } = await req.json();

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email,
      role: role || "distributor",
      createdAt: new Date(),
    });

    return Response.json({ message: "User registered successfully" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
