import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  // If the price is a whole number, show without decimals
  if (price % 1 === 0) {
    return price.toString()
  }
  // Otherwise show with 2 decimal places
  return price.toFixed(2)
}
