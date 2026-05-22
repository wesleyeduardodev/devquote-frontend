export interface Server {
  id: number
  name: string
  link?: string
  createdAt?: string
  updatedAt?: string
}

export interface ServerFormData {
  name: string
  link?: string
}
