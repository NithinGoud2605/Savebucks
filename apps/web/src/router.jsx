import React, { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { App } from './App'
import { Skeleton } from './components/Loader/Skeleton'

// Lazy load components for code splitting
const ListPage = React.lazy(() => import('./pages/ListPage'))
const DealPage = React.lazy(() => import('./pages/DealPage'))
const PostDeal = React.lazy(() => import('./pages/PostDeal'))
const AdminPage = React.lazy(() => import('./pages/Admin/AdminPage'))
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'))
const Profile = React.lazy(() => import('./pages/Profile'))
const ForumsHome = React.lazy(() => import('./pages/Forums/ForumsHome'))
const ForumThreads = React.lazy(() => import('./pages/Forums/ForumThreads'))
const ThreadComposer = React.lazy(() => import('./pages/Forums/ThreadComposer'))
const ThreadPage = React.lazy(() => import('./pages/Forums/ThreadPage'))
const About = React.lazy(() => import('./pages/About'))
const Privacy = React.lazy(() => import('./pages/Privacy'))
const Terms = React.lazy(() => import('./pages/Terms'))
const Disclosure = React.lazy(() => import('./pages/Disclosure'))
const Contact = React.lazy(() => import('./pages/Contact'))
const NotFound = React.lazy(() => import('./pages/NotFound'))
const SignIn = React.lazy(() => import('./pages/SignIn'))
const SignUp = React.lazy(() => import('./pages/SignUp'))
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'))

const PageLoader = () => (
  <div className="container mx-auto px-4 py-8">
    <Skeleton className="h-8 w-48 mb-4" />
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ListPage />
          </Suspense>
        ),
      },
      {
        path: 'new',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ListPage />
          </Suspense>
        ),
      },
      {
        path: 'trending',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ListPage />
          </Suspense>
        ),
      },
      {
        path: 'deal/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DealPage />
          </Suspense>
        ),
      },
      {
        path: 'post',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PostDeal />
          </Suspense>
        ),
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminPage />
          </Suspense>
        ),
      },
      {
        path: 'leaderboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Leaderboard />
          </Suspense>
        ),
      },
      {
        path: 'u/:handle',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Profile />
          </Suspense>
        ),
      },
      {
        path: 'forums',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForumsHome />
          </Suspense>
        ),
      },
      {
        path: 'forums/:slug',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForumThreads />
          </Suspense>
        ),
      },
      {
        path: 'forums/:slug/new',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ThreadComposer />
          </Suspense>
        ),
      },
      {
        path: 'forums/:slug/thread/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ThreadPage />
          </Suspense>
        ),
      },
      {
        path: 'about',
        element: (
          <Suspense fallback={<PageLoader />}>
            <About />
          </Suspense>
        ),
      },
      {
        path: 'privacy',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Privacy />
          </Suspense>
        ),
      },
      {
        path: 'terms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Terms />
          </Suspense>
        ),
      },
      {
        path: 'disclosure',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Disclosure />
          </Suspense>
        ),
      },
      {
        path: 'contact',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Contact />
          </Suspense>
        ),
      },
    ],
  },
  // Authentication routes (outside main app layout)
  {
    path: 'signin',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SignIn />
      </Suspense>
    ),
  },
  {
    path: 'signup',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SignUp />
      </Suspense>
    ),
  },
  {
    path: 'auth/callback',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthCallback />
      </Suspense>
    ),
  },
  // Catch all route
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFound />
      </Suspense>
    ),
  },
])
