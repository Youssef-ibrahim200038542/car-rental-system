import { BACKEND_URL } from "@/lib/api";

// Served by the backend (higher resolution than the copy in /public). Local
// backend IPs cannot go through the Next optimizer, hence `unoptimized`.
export const HERO_IMAGE = `${BACKEND_URL}/images/cars/bmw-m4.jpg`;

/** Maps an in-app path to where a link should really go (login for guests). */
export type Destination = (path: string) => string;

/** `type` values must match a seeded category (see app/cars/car-filters.ts). */
export const CATEGORIES = [
  { label: "Luxury", note: "BMW, Mercedes, Audi", type: "luxury" },
  { label: "SUV", note: "Space for the whole family", type: "suv" },
  { label: "Sedan", note: "Comfort for every commute", type: "sedan" },
  { label: "Economy", note: "Best price per day", type: "economy" },
];

export const STEPS = [
  {
    title: "Choose your car",
    text: "Browse our collection and find the vehicle that matches your style, budget, and needs.",
  },
  {
    title: "Make your booking",
    text: "Select your rental dates, pickup location, and complete your reservation in minutes.",
  },
  {
    title: "Enjoy your ride",
    text: "Pick up your car and enjoy a smooth, comfortable, and hassle-free journey.",
  },
];

export const PERKS = [
  {
    title: "Transparent pricing",
    text: "Explore the available cars and review their daily rates before booking.",
  },
  { title: "Flexible pickup", text: "Choose a pickup branch that suits your journey." },
  {
    title: "Easy booking",
    text: "Choose your vehicle and submit your booking through a simple process.",
  },
  {
    title: "Find your ideal car",
    text: "Use the AI Car Finder to discover vehicles that match your preferences.",
  },
];
