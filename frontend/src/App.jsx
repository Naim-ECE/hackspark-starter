import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AvailabilityPage from './pages/Availability/AvailabilityPage'
import ChatPage from './pages/Chat/ChatPage'
import HomePage from './pages/Home/HomePage'
import LoginPage from './pages/Login/LoginPage'
import NotFoundPage from './pages/NotFound/NotFoundPage'
import ProductsPage from './pages/Products/ProductsPage'
import ProfilePage from './pages/Profile/ProfilePage'
import RegisterPage from './pages/Register/RegisterPage'
import SurgePage from './pages/Surge/SurgePage'
import TrendingPage from './pages/Trending/TrendingPage'

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedPage>
            <HomePage />
          </ProtectedPage>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedPage>
            <ProductsPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/availability"
        element={
          <ProtectedPage>
            <AvailabilityPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedPage>
            <ChatPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/trending"
        element={
          <ProtectedPage>
            <TrendingPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedPage>
            <ProfilePage />
          </ProtectedPage>
        }
      />
      <Route
        path="/surge"
        element={
          <ProtectedPage>
            <SurgePage />
          </ProtectedPage>
        }
      />
      <Route
        path="*"
        element={
          <ProtectedPage>
            <NotFoundPage />
          </ProtectedPage>
        }
      />
    </Routes>
  )
}
