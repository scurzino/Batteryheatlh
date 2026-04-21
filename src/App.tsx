/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import SidebarLayout from './components/layout/SidebarLayout';
import Explore from './pages/Explore';
import VehicleDetail from './pages/VehicleDetail';
import DataExplorer from './pages/DataExplorer';
import Benchmarks from './pages/Benchmarks';
import Settings from './pages/Settings';
import Register from './pages/Register';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Moderation from './pages/Moderation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone auth pages (no layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/register" element={<Register />} />

        {/* Main layout (top nav bar) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Explore />} />
        </Route>

        {/* Sidebar layout */}
        <Route element={<SidebarLayout />}>
          <Route path="/vehicle/:id" element={<VehicleDetail />} />
          <Route path="/explorer" element={<DataExplorer />} />
          <Route path="/benchmarks" element={<Benchmarks />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/moderation" element={<Moderation />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
