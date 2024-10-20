import React from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom"
import DashboardView from './views/DashboardView';

function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route path='/' element={<DashboardView/>}/>
    <Route path='/event/:id' />
    </Routes>
    </BrowserRouter>
  );
}

export default App;
