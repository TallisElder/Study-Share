import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Snowfall from "react-snowfall";
import ProtectedRoute from "./components/protectedRoutes";
import HomePage from "./pages/homePage";
import LandingPage from "./pages/landingPage";
import NotFoundPage from "./pages/notFoundPage";
import ProfilePage from "./pages/profilePage";

function App() {
    return (
        <>
            <Snowfall className="pointer-events-none fixed inset-0" style={{ zIndex: 5 }} />

            <Router>
                <Routes>
                    {/* //Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<NotFoundPage />} />

                    {/* //Private routes */}
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </>
    );
}

export default App;
