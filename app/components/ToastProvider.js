"use client";
import { ToastContainer } from "react-toastify";

export default function ToastLauncher() {
  return (
    <ToastContainer
      position="top-center"
      autoClose={3000}
      hideProgressBar={true}
      closeOnClick={true}
    />
  );
}
