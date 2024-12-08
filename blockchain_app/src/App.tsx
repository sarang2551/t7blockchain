import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashboardView from "./views/DashboardView";
import SellerPortal from "./views/SellerPortal";
import Profile from "./views/Profile";
import EventView from "./views/EventView";
import {ContractProvider} from "./component/ContractContext"

function App() {
  return (
    <ContractProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardView />} />
        <Route path="/event/:tokenId" element={<EventView />} />
        <Route path="/sell" element={<SellerPortal />} />
        <Route path="/profile" element={<Profile />} />
    </Routes>
    </BrowserRouter>
    </ContractProvider>
  );
}

export default App;
