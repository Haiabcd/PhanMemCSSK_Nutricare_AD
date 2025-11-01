// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../src/screens/Login";
import Admin from "../src/screens/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
