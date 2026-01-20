import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import DesktopAssessmentApp from './components/DesktopAssessmentApp'
import SuperuserDashboard from './components/SuperuserDashboard'
import SchoolAdminOnboarding from './components/SchoolAdminOnboarding'
import SchoolAdminDashboard from './components/SchoolAdminDashboard'
import LoadingSpinner from './components/LoadingSpinner'
import apiClient from './api/client'

function App() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [schoolData, setSchoolData] = useState(null)
  const [checkingSchool, setCheckingSchool] = useState(false)

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

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }

  if (!isAuthenticated) {
    return <Login />
  }

  // Route based on user role
  if (user?.role === 'SUPERUSER') {
    return <SuperuserDashboard />
  }

  if (user?.role === 'SCHOOL_ADMIN') {
    if (checkingSchool) {
      return <LoadingSpinner fullScreen message="Loading your school..." />
    }

    // If School Admin has no school assigned, show onboarding
    if (!schoolData) {
      return (
        <SchoolAdminOnboarding
          onComplete={(school) => setSchoolData(school)}
        />
      )
    }

    // School Admin has a school, show dashboard
    return <SchoolAdminDashboard schoolData={schoolData} />
  }

  // Default: Teacher view
  return <DesktopAssessmentApp />
}

export default App
