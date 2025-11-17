import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { AppRouter } from "./AppRouter";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster />
    </AuthProvider>
  );
}
