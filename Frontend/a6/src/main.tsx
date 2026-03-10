
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboards/Admin";
import TrainerDashboard from "./pages/dashboards/Trainer";
import SportlerDashboard from "./pages/dashboards/Sportler";
import ProtectedRoute from "./routes/Protected";
import Profil from "./pages/dashboards/Profil";
import Register from "./pages/Register";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/dashboard/admin"
                        element={
                            <ProtectedRoute allow={["admin"]}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard/trainer"
                        element={
                            <ProtectedRoute allow={["trainer"]}>
                                <TrainerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard/sportler"
                        element={
                            <ProtectedRoute allow={["sportler"]}>
                                <SportlerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/profil" element={<Profil />} />
                    <Route path="/register" element={<Register/>} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>
);
