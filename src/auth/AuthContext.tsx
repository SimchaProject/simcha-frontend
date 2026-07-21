import { useMemo, type ReactNode } from 'react'
import { authClient } from './client'
import type { LoginPayload, SignupPayload } from '../types/auth'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, refetch } = authClient.useSession()

  const login = async (payload: LoginPayload) => {
    const { error } = await authClient.signIn.email({
      email: payload.email,
      password: payload.password,
    })
    if (error) throw new Error(error.message ?? 'Login failed')
    // The session store updates reactively ~10ms after sign-in via an internal
    // signal, which is too late for an immediate post-login navigate() to see
    // the new session. Force a refetch so `couple` is current before returning.
    await refetch()
  }

  const signup = async (payload: SignupPayload) => {
    const { error } = await authClient.signUp.email({
      name: payload.name,
      email: payload.email,
      password: payload.password,
    })
    if (error) throw new Error(error.message ?? 'Signup failed')
    await refetch()
  }

  const logout = () => {
    authClient.signOut()
  }

  const value = useMemo(
    () => ({
      couple: session?.user
        ? { id: session.user.id, name: session.user.name, email: session.user.email }
        : null,
      isLoading: isPending,
      login,
      signup,
      logout,
    }),
    [session, isPending],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
