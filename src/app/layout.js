import { Inter } from "next/font/google";
import "./globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Zawalink",
  description: "Preview url from twitch tchat",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black">
        <Image src={"/back.JPG"} alt="back" width={1920} height={1080} className="fixed w-screen h-screen top-0 left-0 object-cover opacity-20"/>
        <ChakraProvider>{children}</ChakraProvider>
      </body>
    </html>
  );
}
