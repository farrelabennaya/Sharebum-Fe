import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx"; // ⬅️ tambah ini
import Dashboard from "./pages/Dashboard.jsx";
import AlbumPublic from "./pages/AlbumPublic.jsx";
import AlbumDetail from "./pages/AlbumDetail.jsx";
import RequireAuth from "./lib/RequireAuth.jsx";
import LandingPage from "./pages/Landing.jsx";
import LoginSolo from "./pages/LoginSolo.jsx";
import AlbumSettings from "./pages/AlbumSettings.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> }, // ⬅️ rute publik
  { path: "/", element: <LandingPage /> }, // ⬅️ rute publik
  { path: "/loginsolo", element: <LoginSolo /> }, // ⬅️ rute publik
  // semua child di bawah RequireAuth butuh login
  {
    element: <RequireAuth />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/dashboard/albums/:albumId", element: <AlbumDetail /> },
      {
        path: "/dashboard/albums/:albumId/settings",
        element: <AlbumSettings />,
      },
      {path: "/dashboard/profile", element: <Profile/>},
      {path: "/dashboard/settings", element: <Settings/>}
    ],
  },
  // halaman publik tetap bebas
  { path: "/album/:slug", element: <AlbumPublic /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
