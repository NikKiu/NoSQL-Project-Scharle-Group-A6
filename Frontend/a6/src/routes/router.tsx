import { createBrowserRouter } from 'react-router-dom'
import AdminLayout from '../pages/admin/AdminLayout'
import AdminAssignmentsPage from '../pages/admin/AdminAssignmentsPage'
import AdminHomePage from '../pages/admin/AdminHomePage'
import AdminMonitoringPage from '../pages/admin/AdminMonitoringPage'
import AdminSensorsPage from '../pages/admin/AdminSensorsPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AthleteLayout from '../pages/athlete/AthleteLayout'
import AthleteHistoryPage from '../pages/athlete/AthleteHistoryPage'
import AthleteHomePage from '../pages/athlete/AthleteHomePage'
import AthleteProfilePage from '../pages/athlete/AthleteProfilePage'
import AthleteSessionDetailPage from '../pages/athlete/AthleteSessionDetailPage'
import AthleteTrainingPage from '../pages/athlete/AthleteTrainingPage'
import { ErrorPage } from '../pages/common/ErrorPage'
import RootOutlet from '../pages/common/RootOutlet'
import LoginPage from '../pages/public/LoginPage'
import RegisterPage from '../pages/public/RegisterPage'
import TrainerAthleteDetailPage from '../pages/trainer/TrainerAthleteDetailPage'
import TrainerAthletesPage from '../pages/trainer/TrainerAthletesPage'
import TrainerComparePage from '../pages/trainer/TrainerComparePage'
import TrainerHomePage from '../pages/trainer/TrainerHomePage'
import TrainerLayout from '../pages/trainer/TrainerLayout'
import TrainerSessionDetailPage from '../pages/trainer/TrainerSessionDetailPage'
import {
  adminAssignmentsLoader,
  adminMonitoringLoader,
  adminOverviewLoader,
  adminSensorsLoader,
  adminUsersLoader,
  athleteHistoryLoader,
  athleteOverviewLoader,
  athleteProfileLoader,
  athleteSessionDetailLoader,
  athleteTrainingLoader,
  indexRedirectLoader,
  publicOnlyLoader,
  rootLoader,
  trainerAthleteHistoryLoader,
  trainerAthletesLoader,
  trainerCompareLoader,
  trainerSessionDetailLoader,
  trainerOverviewLoader
} from './loaders'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootOutlet />,
    loader: rootLoader,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        loader: indexRedirectLoader
      },
      {
        path: 'login',
        element: <LoginPage />,
        loader: publicOnlyLoader
      },
      {
        path: 'register',
        element: <RegisterPage />,
        loader: publicOnlyLoader
      },
      {
        path: 'app/athlete',
        element: <AthleteLayout />,
        children: [
          { index: true, element: <AthleteHomePage />, loader: athleteOverviewLoader },
          { path: 'training', element: <AthleteTrainingPage />, loader: athleteTrainingLoader },
          { path: 'history', element: <AthleteHistoryPage />, loader: athleteHistoryLoader },
          { path: 'history/:sessionId', element: <AthleteSessionDetailPage />, loader: athleteSessionDetailLoader },
          { path: 'profile', element: <AthleteProfilePage />, loader: athleteProfileLoader }
        ]
      },
      {
        path: 'app/trainer',
        element: <TrainerLayout />,
        children: [
          { index: true, element: <TrainerHomePage />, loader: trainerOverviewLoader },
          { path: 'athletes', element: <TrainerAthletesPage />, loader: trainerAthletesLoader },
          { path: 'athletes/:athleteId', element: <TrainerAthleteDetailPage />, loader: trainerAthleteHistoryLoader },
          { path: 'sessions/:sessionId', element: <TrainerSessionDetailPage />, loader: trainerSessionDetailLoader },
          { path: 'compare', element: <TrainerComparePage />, loader: trainerCompareLoader }
        ]
      },
      {
        path: 'app/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHomePage />, loader: adminOverviewLoader },
          { path: 'users', element: <AdminUsersPage />, loader: adminUsersLoader },
          { path: 'assignments', element: <AdminAssignmentsPage />, loader: adminAssignmentsLoader },
          { path: 'sensors', element: <AdminSensorsPage />, loader: adminSensorsLoader },
          { path: 'monitoring', element: <AdminMonitoringPage />, loader: adminMonitoringLoader }
        ]
      },
      {
        path: '*',
        loader: indexRedirectLoader
      }
    ]
  }
])

