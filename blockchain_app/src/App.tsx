import React from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom"
import DashboardView from './views/DashboardView';
import PurchaseView from './views/PurchaseView';
import UserTicketsView from './views/UserTicketsView';

function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route path='/' element={<DashboardView/>}/>
    <Route path='/purchase/:id' element={<PurchaseView/>}/>
    <Route path='/mytickets' element={<UserTicketsView/>}/>
    </Routes>
    </BrowserRouter>
  );
}

export default App;
