'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Fingerprint, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { startRegistration } from '@simplewebauthn/browser'

export function BiometricRegistrationComponent() {
  const [deviceName, setDeviceName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleBiometricRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Get registration options
      const optionsRes = await fetch('/api/auth/register-biometric')
      if (!optionsRes.ok) {
        throw new Error('Failed to get registration options')
      }
      const options = await optionsRes.json()

      // Start the registration process
      const credential = await startRegistration(options)

      // Send the credential to the server for verification
      const verificationRes = await fetch('/api/auth/register-biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName, credential }),
        credentials: 'include',
      })

      if (!verificationRes.ok) {
        throw new Error('Biometric registration failed')
      }

      setSuccess('Biometric successfully registered!')
      setTimeout(() => router.push('/profile'), 2000)
    } catch (error) {
      console.error(error)
      setError('Biometric registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register Biometric</CardTitle>
          <CardDescription>Add a new biometric credential to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">{success}</p>}
          <form onSubmit={handleBiometricRegistration} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                type="text"
                placeholder="Enter a name for this device"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-32" disabled={isLoading || !deviceName}>
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <Fingerprint className="h-16 w-16 mr-2" />
                  <span className="text-lg">Register Biometric</span>
                </>
              )}
            </Button>
          </form>
          <Button 
            onClick={() => router.push('/profile')} 
            variant="outline" 
            className="w-full mt-4"
          >
            Back to Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}