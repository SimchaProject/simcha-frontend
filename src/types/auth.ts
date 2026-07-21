export interface Couple {
  id: string
  name: string
  email: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}
