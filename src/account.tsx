import { ClerkProvider, useAuth, useClerk, useUser } from '@clerk/react'
import { createContext, useContext, useMemo, type ReactNode } from 'react'

export type GardenAccount = {
  configured: boolean
  signedIn: boolean
  loaded: boolean
  userId: string | null
  name: string
  email: string
  imageUrl: string | null
  getToken: () => Promise<string | null>
  openSignIn: () => void
  openProfile: () => void
}

const guestAccount: GardenAccount = {
  configured: false,
  signedIn: false,
  loaded: true,
  userId: null,
  name: 'Guest caretaker',
  email: '',
  imageUrl: null,
  getToken: async () => null,
  openSignIn: () => undefined,
  openProfile: () => undefined,
}

const AccountContext = createContext<GardenAccount>(guestAccount)

function ClerkAccountBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useAuth()
  const clerk = useClerk()
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const name = user?.fullName || user?.firstName || email.split('@')[0] || 'Garden caretaker'
  const account = useMemo<GardenAccount>(() => ({
    configured: true,
    signedIn: Boolean(isSignedIn),
    loaded: isLoaded,
    userId: user?.id ?? null,
    name,
    email,
    imageUrl: user?.imageUrl ?? null,
    getToken,
    openSignIn: () => clerk.openSignIn({}),
    openProfile: () => clerk.openUserProfile({}),
  }), [clerk, email, getToken, isLoaded, isSignedIn, name, user?.id, user?.imageUrl])
  return (
    <AccountContext.Provider value={account}>
      {children}
    </AccountContext.Provider>
  )
}

export function GardenAccountProvider({ children }: { children: ReactNode }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (!publishableKey) return <AccountContext.Provider value={guestAccount}>{children}</AccountContext.Provider>
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkAccountBridge>{children}</ClerkAccountBridge>
    </ClerkProvider>
  )
}

export const useGardenAccount = () => useContext(AccountContext)
