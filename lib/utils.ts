import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Lightweight className merger (clsx + tailwind-merge if available). */
export function cn(...inputs: ClassValue[]) {
  try {
    return twMerge(clsx(inputs))
  } catch {
    return clsx(inputs)
  }
}

export function absoluteUrl(path: string, base: string): string {
  if (path.startsWith('http')) return path
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}
