import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import WOMaterialView from './features/wo-materials/components/WOMaterialView';
import MaterialRequestView from './features/material-requests/components/MaterialRequestView';
import QubePickListView from './features/qube-fulfillment/components/QubePickListView';
import PickingView from './features/qube-fulfillment/components/PickingView';
import AdminControlPanelView from './features/admin/components/AdminControlPanelView';
import ExceptionDashboardView from './features/admin/components/ExceptionDashboardView';

const App = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/materials" replace />} />
          <Route path="/materials" element={<WOMaterialView />} />
          <Route path="/requests" element={<MaterialRequestView />} />
          <Route path="/qube-picklist" element={<QubePickListView />} />
          <Route path="/picking" element={<PickingView />} />
          <Route path="/admin" element={<AdminControlPanelView />} />
          <Route path="/exceptions" element={<ExceptionDashboardView />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;
