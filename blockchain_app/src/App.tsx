import React from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom"
import DashboardView from './views/DashboardView';
import PurchaseView from './views/PurchaseView';

function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route path='/' element={<DashboardView/>}/>
    <Route path='/purchase/:id' element={<PurchaseView/>}/>
    </Routes>
    </BrowserRouter>
  );
}

export default App;
