import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/login";
import ProtectedRoute from "./auth/ProtectedRoute";
import Home from "./pages/Home";

// Admin
import AdminHome from "./pages/admin/AdminHome";

import Leagues from "./pages/admin/Leagues";
import Games from "./pages/admin/Games";
import Stadiums from "./pages/admin/Stadiums";
import Teams from "./pages/admin/Teams";
import Assignments from "./pages/admin/Assignments";

// Ampayer
import AmpayerHome from "./pages/ampayer/AmpayerHome";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminHome />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="leagues" element={<Leagues />} />
          <Route path="games" element={<Games />} />
          <Route path="stadiums" element={<Stadiums />} />
          <Route path="assignments" element={<Assignments />} />
        </Route>

        {/* AMPAYER */}
        <Route
          path="/ampayer"
          element={
            <ProtectedRoute role="ampayer">
              <AmpayerHome />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
        </Route>

        <Route path="*" element={<Login />} />

      </Routes>
    </BrowserRouter>
  );
}
