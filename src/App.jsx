import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import DesktopAssessmentApp from './components/DesktopAssessmentApp'
import SuperuserDashboard from './components/SuperuserDashboard'
import CountryAdminDashboard from './components/CountryAdminDashboard'
import SchoolAdminOnboarding from './components/SchoolAdminOnboarding'
import SchoolAdminDashboard from './components/SchoolAdminDashboard'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import VerifyEmail from './components/VerifyEmail'
import PendingAssignment from './components/PendingAssignment'
import TeacherOnboardingWizard from './components/TeacherOnboardingWizard'
import ParentPlaceholder from './components/ParentPlaceholder'
import LoadingSpinner from './components/LoadingSpinner'
import apiClient from './api/client'

function App() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [schoolData, setSchoolData] = useState(null)
  const [checkingSchool, setCheckingSchool] = useState(false)
  const [hasClasses, setHasClasses] = useState(null) // null = not checked yet

  // For School Admins, check if they have a school assigned
  useEffect(() => {
    const checkSchoolAssignment = async () => {
      if (user?.role === 'SCHOOL_ADMIN') {
        setCheckingSchool(true)
        try {
          const response = await apiClient.get('/schools/my-school')
          if (response.success && response.data) {
            setSchoolData(response.data)
          } else {
            setSchoolData(null)
          }
        } catch (err) {
          console.error('Error checking school assignment:', err)
          setSchoolData(null)
        } finally {
          setCheckingSchool(false)
        }
      }
    }

    if (isAuthenticated && user?.role === 'SCHOOL_ADMIN') {
      checkSchoolAssignment()
    }
  }, [isAuthenticated, user?.role])

  // For Teachers with a school assigned, check if they have any classes
  useEffect(() => {
    const checkTeacherClasses = async () => {
      try {
        const res = await apiClient.get('/classes')
        setHasClasses(res.success && res.data?.length > 0)
      } catch {
        setHasClasses(true) // On error assume they have classes to avoid blocking
      }
    }

    if (isAuthenticated && user?.role === 'TEACHER' && user?.schoolId) {
      checkTeacherClasses()
    }
  }, [isAuthenticated, user?.role, user?.schoolId])

  const renderAuthenticatedApp = () => {
    if (isLoading) {
      return <LoadingSpinner fullScreen message="Loading..." />
    }

    if (!isAuthenticated) {
      return <Login />
    }

    if (user?.role === 'SUPERUSER') {
      return <SuperuserDashboard />
    }

    if (user?.role === 'COUNTRY_ADMIN') {
      return <CountryAdminDashboard />
    }

    if (user?.role === 'SCHOOL_ADMIN') {
      if (checkingSchool) {
        return <LoadingSpinner fullScreen message="Loading your school..." />
      }
      if (!schoolData) {
        return (
          <SchoolAdminOnboarding
            onComplete={(school) => setSchoolData(school)}
          />
        )
      }
      return <SchoolAdminDashboard schoolData={schoolData} />
    }

    if (user?.role === 'PARENT_STUDENT') {
      return <ParentPlaceholder />
    }

    if (user?.role === 'TEACHER' && !user?.schoolId) {
      return <PendingAssignment />
    }

    if (user?.role === 'TEACHER' && user?.schoolId) {
      if (hasClasses === null) {
        return <LoadingSpinner fullScreen message="Loading your classroom..." />
      }
      if (hasClasses === false) {
        return <TeacherOnboardingWizard onComplete={() => setHasClasses(true)} />
      }
    }

    return <DesktopAssessmentApp />
  }

  return (
    <Routes>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/*" element={renderAuthenticatedApp()} />
    </Routes>
  )
}

export default App
