import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import IDFetch from "./pages/IDFetch";
import IDList from "./pages/IDList";

const router = createBrowserRouter([
  {
    path: "/",
    element: <IDFetch />,
  },
  {
    path: "/idlist",
    element: <IDList />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);