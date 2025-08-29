import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../components/Layout/Container'
import { ForumCard } from '../../components/Forums/ForumCard'
import { ThreadRow } from '../../components/Forums/ThreadRow'
import { Skeleton } from '../../components/Loader/Skeleton'
import { forumService } from '../../forums/service'
import { setPageMeta } from '../../lib/head'

export default function ForumsHome() {
  React.useEffect(() => {
    setPageMeta({
      title: 'Community Forums',
      description: 'Join discussions, share tips, and connect with fellow deal hunters.',
    })
  }, [])

  const { data: forums = [], isLoading: forumsLoading } = useQuery({
    queryKey: ['forums'],
    queryFn: forumService.getForums.bind(forumService),
  })

  const { data: latestThreads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ['forums', 'latest'],
    queryFn: () => forumService.getLatestThreads(10),
  })

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Community Forums
        </h1>
        <p className="text-gray-600">
          Connect with fellow deal hunters, share tips, and discuss the latest finds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Forums List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Categories
          </h2>
          
          {forumsLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-6">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {forums.map((forum) => (
                <ForumCard key={forum.slug} forum={forum} />
              ))}
            </div>
          )}
        </div>

        {/* Latest Activity Sidebar */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Latest Activity
          </h2>
          
          {threadsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {latestThreads.map((thread) => (
                <ThreadRow 
                  key={thread.id} 
                  thread={thread} 
                  compact 
                  showForum 
                />
              ))}
              {latestThreads.length === 0 && (
                <div className="card p-6 text-center text-gray-600">
                  <p>No recent activity.</p>
                  <p className="text-sm mt-1">Be the first to start a discussion!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}
