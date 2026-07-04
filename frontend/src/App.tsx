import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute } from "./api/ProtectedRoute";
import {LoadingProvider} from "./components/LoadingComponent.tsx";

function App() {
    return (
        <LoadingProvider>
            <BrowserRouter>
                <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
                    <header className="bg-white shadow-md p-4 border-b border-gray-200">
                        <div className="container mx-auto flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-indigo-600">
                                خوش آمدید
                            </h1>
                        </div>
                    </header>

                    <main className="grow">
                        <Routes>
                            <Route path="/" element={<LoginPage />} />

                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>

                    <footer className="text-center p-4 text-gray-500 text-sm border-t border-gray-200">
                        © 2026 All rights reserved. Powered with ❤️ in Tivan
                    </footer>
                </div>
            </BrowserRouter>
        </LoadingProvider>
    );
}

export default App;
