'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Fingerprint, Key, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { startAuthentication } from '@simplewebauthn/browser'

export function LoginPageComponent() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // This is important for including cookies
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      router.push('/drive')
    } catch (error) {
      setError('Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWebAuthnLogin = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Get authentication options
      const optionsRes = await fetch(`/api/auth?username=${encodeURIComponent(username)}`)
      const options = await optionsRes.json()

      // Request biometric authentication
      options.authenticatorSelection = {
        ...options.authenticatorSelection,
        userVerification: 'required',
        authenticatorAttachment: 'platform'
      }

      // Start the authentication process
      const credential = await startAuthentication(options)

      // Send the credential to the server for verification
      const verificationRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, credential }),
        credentials: 'include'
      })

      if (!verificationRes.ok) {
        throw new Error('WebAuthn authentication failed')
      }

      router.push('/drive')
    } catch (error) {
      console.error(error)
      setError('WebAuthn authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <Tabs defaultValue="traditional" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional">Password</TabsTrigger>
              <TabsTrigger value="webauthn">WebAuthn</TabsTrigger>
            </TabsList>
            <TabsContent value="traditional">
              <form onSubmit={handleTraditionalLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="webauthn">
              <div className="space-y-4 text-center">
                <p>Use WebAuthn to sign in quickly and securely.</p>
                <div className="space-y-2">
                  <Label htmlFor="webauthn-username">Username</Label>
                  <Input
                    id="webauthn-username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <Button
                  onClick={handleWebAuthnLogin}
                  className="w-full h-32"
                  disabled={isLoading || !username}
                >
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <Fingerprint className="h-16 w-16" />
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}