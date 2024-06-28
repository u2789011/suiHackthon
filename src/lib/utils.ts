import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isContentWithFields(content: any): content is Content {
  return content && content.fields && typeof content.fields.name === 'string';
}