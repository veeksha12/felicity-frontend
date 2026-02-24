import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import OnboardingScreen from './pages/OnboardingScreen';

import EventList from './pages/Events';
import EventDetail from './pages/EventDetail';
import MyEvents from './pages/MyEvents';
import Profile from './pages/Profile';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail';
import TicketView from './pages/TicketView';

import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import EventRegistration from './pages/EventRegistration';
import EventParticipants from './pages/EventParticipants';
import PaymentManagement from './pages/PaymentManagement';
import QRScanner from './pages/QRScanner';
import MyTeams from './pages/MyTeams';
import JoinTeam from './pages/JoinTeam';
import PasswordResetRequest from './pages/PasswordResetRequest';


import AdminDashboard from './pages/AdminDashboard';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import ProtectedRoute from './components/ProtectedRoute';
import GlobalChatListener from './components/GlobalChatListener';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalChatListener />
        <Toaster position="top-right" />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Protected Public-turned-Private Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={['Participant', 'Organizer', 'Admin']}>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute allowedRoles={['Participant', 'Organizer', 'Admin']}>
                    <EventList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute allowedRoles={['Participant', 'Organizer', 'Admin']}>
                    <EventDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs"
                element={
                  <ProtectedRoute allowedRoles={['Participant', 'Organizer', 'Admin']}>
                    <Clubs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:id"
                element={
                  <ProtectedRoute allowedRoles={['Participant', 'Organizer', 'Admin']}>
                    <ClubDetail />
                  </ProtectedRoute>
                }
              />

              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Onboarding Route (Participant only) */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute allowedRoles={['Participant']}>
                    <OnboardingScreen />
                  </ProtectedRoute>
                }
              />

              {/* Participant Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Participant']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-events"
                element={
                  <ProtectedRoute allowedRoles={['Participant']}>
                    <MyEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ticket/:registrationId"
                element={
                  <ProtectedRoute allowedRoles={['Participant']}>
                    <TicketView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event/:id/register"
                element={
                  <ProtectedRoute allowedRoles={['Participant']}>
                    <EventRegistration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-teams"
                element={
                  <ProtectedRoute allowedRoles={['Participant']}>
                    <MyTeams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/join-team/:code"
                element={
                  <ProtectedRoute allowedRoles={['Participant']}>
                    <JoinTeam />
                  </ProtectedRoute>
                }
              />

              {/* Organizer Routes */}
              <Route
                path="/organizer"
                element={
                  <ProtectedRoute allowedRoles={['Organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-event"
                element={
                  <ProtectedRoute allowedRoles={['Organizer']}>
                    <CreateEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-event/:id"
                element={
                  <ProtectedRoute allowedRoles={['Organizer']}>
                    <CreateEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event/:id/participants"
                element={
                  <ProtectedRoute allowedRoles={['Organizer']}>
                    <EventParticipants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event/:id/payments"
                element={
                  <ProtectedRoute allowedRoles={['Organizer']}>
                    <PaymentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event/:eventId/scanner"
                element={
                  <ProtectedRoute allowedRoles={['Organizer']}>
                    <QRScanner />
                  </ProtectedRoute>
                }
              />


              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Shared Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['Participant', 'Organizer', 'Admin']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* 404 Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;