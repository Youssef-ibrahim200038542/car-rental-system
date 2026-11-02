// Shared API types mirroring the Laravel models (backend/app/Models + migrations).
// Laravel serializes `decimal:2` casts as strings, so money fields are `Money`.

export type Money = number | string;

export type Role = "admin" | "staff" | "customer";

export type CarStatus =
  | "available"
  | "reserved"
  | "rented"
  | "maintenance"
  | "inactive";

/** Fleet states an admin may set; reserved/rented exist only on legacy rows. */
export const EDITABLE_CAR_STATUSES = ["available", "maintenance", "inactive"] as const;

export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";
export type Transmission = "manual" | "automatic";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "card" | "online";
export const PAYMENT_METHODS: readonly PaymentMethod[] = ["cash", "card", "online"];

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type MaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

type Timestamps = {
  created_at?: string;
  updated_at?: string;
};

export type User = Timestamps & {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role?: Role;
  avatar?: string | null;
  email_verified_at?: string | null;
  /** Present only when the API eager-counts bookings (withCount). */
  bookings_count?: number;
};

export type Branch = Timestamps & {
  id: number;
  name: string;
  address: string;
  city: string;
  phone?: string | null;
  cars?: Car[];
};

export type CarCategory = Timestamps & {
  id: number;
  name: string;
  description?: string | null;
  daily_rate: Money;
  cars?: Car[];
};

export type Car = Timestamps & {
  id: number;
  category_id: number;
  branch_id: number;
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  license_plate: string;
  vin: string;
  mileage: number;
  fuel_type: FuelType;
  transmission: Transmission;
  seats: number;
  daily_rate: Money;
  status: CarStatus;
  image?: string | null;
  description?: string | null;
  category?: CarCategory | null;
  branch?: Branch | null;
  reviews?: Review[];
  maintenance_records?: Maintenance[];
};

export type Payment = Timestamps & {
  id: number;
  booking_id: number;
  amount: Money;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_reference?: string | null;
  paid_at?: string | null;
  booking?: Booking | null;
};

type BookingAddon = Timestamps & {
  id: number;
  booking_id: number;
  name: string;
  price: Money;
  quantity: number;
  booking?: Booking | null;
};

export type Review = Timestamps & {
  id: number;
  user_id: number;
  car_id: number;
  booking_id: number;
  rating: number;
  comment?: string | null;
  user?: User | null;
  car?: Car | null;
  booking?: Booking | null;
};

export type Booking = Timestamps & {
  id: number;
  user_id: number;
  car_id: number;
  pickup_branch_id: number;
  dropoff_branch_id: number;
  pickup_date: string;
  return_date: string;
  daily_rate: Money;
  total_days: number;
  subtotal: Money;
  discount: Money;
  total_amount: Money;
  status: BookingStatus;
  notes?: string | null;
  user?: User | null;
  car?: Car | null;
  pickup_branch?: Branch | null;
  dropoff_branch?: Branch | null;
  payments?: Payment[];
  review?: Review | null;
  addons?: BookingAddon[];
};

type Maintenance = Timestamps & {
  id: number;
  car_id: number;
  title: string;
  description?: string | null;
  cost: Money;
  start_date: string;
  end_date?: string | null;
  status: MaintenanceStatus;
  car?: Car | null;
};

/** Every API response is wrapped in this envelope. */
export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export type AuthPayload = {
  user: User;
  token: string;
};

export type CarAvailability = {
  available: boolean;
  reason?: string;
};

export type PayBookingResult = {
  booking: Booking;
  payment: Payment;
};

export type AdminStats = {
  cars: Record<CarStatus | "total", number>;
  bookings: Record<BookingStatus | "total", number>;
  revenue: { paid_total: number };
  users: { total: number; customers: number };
  branches: { total: number };
  reviews: { total: number; average_rating: number };
};
