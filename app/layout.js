import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";


export const metadata = {
  title: "expand.1clickdistributors.com",
  description: "Internal tool for 1Clickdistributors",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}
