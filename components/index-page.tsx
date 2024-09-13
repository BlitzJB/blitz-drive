'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { HardDrive, LogIn, LogOut, Lock } from 'lucide-react'
import Link from 'next/link'

export function IndexPageComponent() {
  // Simulating authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')

  const handleLogin = () => {
    // Simulate login process
    setIsLoggedIn(true)
    setUsername('john.doe@example.com')
  }

  const handleLogout = () => {
    // Simulate logout process
    setIsLoggedIn(false)
    setUsername('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center justify-center p-4">
      <main className="text-center space-y-6 max-w-4xl w-full">
        <Lock className="h-20 w-20 text-primary mx-auto" />
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Blitz Drive</h1>
        <p className="text-xl text-gray-600">
          Secure, self-hosted storage solution for your data
        </p>
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-lg space-y-4">
          <p className="text-gray-700">
            This is a private hosted drive. There is no public signup.
            Please contact the administrator for access.
          </p>
          {isLoggedIn ? (
            <div className="space-y-4">
              <p className="font-medium text-gray-900">Logged in as: {username}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/drive">
                    <HardDrive className="mr-2 h-5 w-5" />
                    Go to Drive
                  </Link>
                </Button>
                <Button variant="outline" size="lg" onClick={handleLogout}>
                  <LogOut className="mr-2 h-5 w-5" />
                  Log Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/drive">
                  <HardDrive className="mr-2 h-5 w-5" />
                  Go to Drive
                </Link>
              </Button>
              <Button variant="outline" size="lg" onClick={handleLogin}>
                <LogIn className="mr-2 h-5 w-5" />
                Log In
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}