import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Concert {
  id: string;
  artist: string;
  tour: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  image: string;
  genre: string;
  priceFrom: number;
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  type: 'vip' | 'regular';
  status: 'available' | 'selected' | 'reserved';
  price: number;
}

export const CONCERTS: Concert[] = [
  {
    id: '1',
    artist: 'Luna Blue',
    tour: 'Crystal Atrium Sessions',
    date: 'Dec 12, 2024',
    time: '8:00 PM',
    venue: 'The Velvet Lounge',
    location: 'NYC',
    genre: 'Jazz / Soul',
    priceFrom: 89,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '2',
    artist: 'Neon Echoes',
    tour: 'World Tour 2024',
    date: 'Dec 18, 2024',
    time: '8:00 PM',
    venue: 'Terminal 5',
    location: 'NYC',
    genre: 'Electronic / Ambient',
    priceFrom: 129,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '3',
    artist: 'Broken Records',
    tour: 'The Final Spin',
    date: 'Jan 05, 2025',
    time: '7:30 PM',
    venue: 'Madison Square Garden',
    location: 'NYC',
    genre: 'Alternative / Rock',
    priceFrom: 149,
    image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800',
  },
];
