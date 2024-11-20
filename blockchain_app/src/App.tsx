import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashboardView from "./views/DashboardView";
import SellerPortal from "./views/SellerPortal";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardView />} />
        <Route path="/sell" element={<SellerPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
