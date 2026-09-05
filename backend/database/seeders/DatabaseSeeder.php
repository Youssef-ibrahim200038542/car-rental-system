<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\CarCategory;
use App\Models\Branch;
use App\Models\Car;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\BookingAddon;
use App\Models\Maintenance;
use App\Models\Review;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Users
        |--------------------------------------------------------------------------
        */

        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@carrental.com',
            'phone' => '01000000001',
            'role' => 'admin',
            'avatar' => null,
            'password' => 'password',
        ]);

        $staff = User::create([
            'name' => 'Staff User',
            'email' => 'staff@carrental.com',
            'phone' => '01000000002',
            'role' => 'staff',
            'avatar' => null,
            'password' => 'password',
        ]);

        $customer1 = User::create([
            'name' => 'Ahmed Mohamed',
            'email' => 'ahmed@example.com',
            'phone' => '01000000003',
            'role' => 'customer',
            'avatar' => null,
            'password' => 'password',
        ]);

        $customer2 = User::create([
            'name' => 'Omar Ali',
            'email' => 'omar@example.com',
            'phone' => '01000000004',
            'role' => 'customer',
            'avatar' => null,
            'password' => 'password',
        ]);

        $customer3 = User::create([
            'name' => 'Youssef Hassan',
            'email' => 'youssef@example.com',
            'phone' => '01000000005',
            'role' => 'customer',
            'avatar' => null,
            'password' => 'password',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Car Categories
        |--------------------------------------------------------------------------
        */

        $economy = CarCategory::create([
            'name' => 'Economy',
            'description' => 'Affordable and fuel-efficient cars.',
            'daily_rate' => 800,
        ]);

        $sedan = CarCategory::create([
            'name' => 'Sedan',
            'description' => 'Comfortable cars suitable for daily use and business trips.',
            'daily_rate' => 1200,
        ]);

        $suv = CarCategory::create([
            'name' => 'SUV',
            'description' => 'Spacious and powerful cars suitable for families and long trips.',
            'daily_rate' => 1800,
        ]);

        $luxury = CarCategory::create([
            'name' => 'Luxury',
            'description' => 'Premium luxury cars with advanced features.',
            'daily_rate' => 3000,
        ]);


        /*
        |--------------------------------------------------------------------------
        | Branches
        |--------------------------------------------------------------------------
        */

        $cairoBranch = Branch::create([
            'name' => 'Cairo Main Branch',
            'address' => 'Nasr City, Cairo',
            'city' => 'Cairo',
            'phone' => '0223456789',
        ]);

        $gizaBranch = Branch::create([
            'name' => 'Giza Branch',
            'address' => 'Dokki, Giza',
            'city' => 'Giza',
            'phone' => '0234567890',
        ]);

        $newCairoBranch = Branch::create([
            'name' => 'New Cairo Branch',
            'address' => 'Fifth Settlement, New Cairo',
            'city' => 'Cairo',
            'phone' => '0223456790',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Cars - 24 Cars
        |--------------------------------------------------------------------------
        */

        $bmw = Car::create([
            'category_id' => $luxury->id,
            'branch_id' => $cairoBranch->id,
            'brand' => 'BMW',
            'model' => 'M4',
            'year' => 2025,
            'color' => 'Black',
            'license_plate' => 'CAI-1001',
            'vin' => 'WBA00000000000001',
            'mileage' => 15000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 4,
            'daily_rate' => 3500,
            'status' => 'available',
            'image' => 'images/cars/bmw-m4.jpg',
            'description' => 'Luxury BMW M4 in excellent condition.',
        ]);

        $mercedes = Car::create([
            'category_id' => $luxury->id,
            'branch_id' => $newCairoBranch->id,
            'brand' => 'Mercedes-Benz',
            'model' => 'C-Class',
            'year' => 2024,
            'color' => 'White',
            'license_plate' => 'CAI-1002',
            'vin' => 'WDD00000000000002',
            'mileage' => 18000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 3200,
            'status' => 'available',
            'image' => 'images/cars/mercedes-c-class.jpg',
            'description' => 'Premium Mercedes-Benz C-Class.',
        ]);

        $toyota = Car::create([
            'category_id' => $sedan->id,
            'branch_id' => $gizaBranch->id,
            'brand' => 'Toyota',
            'model' => 'Corolla',
            'year' => 2024,
            'color' => 'Silver',
            'license_plate' => 'GIZ-1003',
            'vin' => 'JTD00000000000003',
            'mileage' => 22000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1200,
            'status' => 'available',
            'image' => 'images/cars/toyota-corolla.jpg',
            'description' => 'Reliable Toyota Corolla suitable for daily rental.',
        ]);

        $hyundai = Car::create([
            'category_id' => $economy->id,
            'branch_id' => $cairoBranch->id,
            'brand' => 'Hyundai',
            'model' => 'Accent',
            'year' => 2023,
            'color' => 'Gray',
            'license_plate' => 'CAI-1004',
            'vin' => 'KMH00000000000004',
            'mileage' => 30000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 850,
            'status' => 'available',
            'image' => 'images/cars/hyundai-accent.jpg',
            'description' => 'Economical Hyundai Accent.',
        ]);

        $kia = Car::create([
            'category_id' => $suv->id,
            'branch_id' => $newCairoBranch->id,
            'brand' => 'Kia',
            'model' => 'Sportage',
            'year' => 2024,
            'color' => 'Blue',
            'license_plate' => 'CAI-1005',
            'vin' => 'KNA00000000000005',
            'mileage' => 12000,
            'fuel_type' => 'hybrid',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1900,
            'status' => 'available',
            'image' => 'images/cars/kia-sportage.jpg',
            'description' => 'Modern Kia Sportage SUV.',
        ]);

        $bmw3 = Car::create([
            'category_id' => $luxury->id,
            'branch_id' => $cairoBranch->id,
            'brand' => 'BMW',
            'model' => '3 Series',
            'year' => 2024,
            'color' => 'Blue',
            'license_plate' => 'CAI-1006',
            'vin' => 'WBA00000000000006',
            'mileage' => 19000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 2900,
            'status' => 'available',
            'image' => null,
            'description' => 'Premium BMW 3 Series combining performance, comfort, and modern technology.',
        ]);

        $mercedesGLC = Car::create([
            'category_id' => $suv->id,
            'branch_id' => $newCairoBranch->id,
            'brand' => 'Mercedes-Benz',
            'model' => 'GLC',
            'year' => 2024,
            'color' => 'Black',
            'license_plate' => 'CAI-1007',
            'vin' => 'WDD00000000000007',
            'mileage' => 14000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 2800,
            'status' => 'available',
            'image' => null,
            'description' => 'Luxury Mercedes-Benz GLC SUV with spacious seating and premium comfort.',
        ]);

        $toyotaCamry = Car::create([
            'category_id' => $sedan->id,
            'branch_id' => $gizaBranch->id,
            'brand' => 'Toyota',
            'model' => 'Camry',
            'year' => 2024,
            'color' => 'White',
            'license_plate' => 'GIZ-1008',
            'vin' => 'JTD00000000000008',
            'mileage' => 17000,
            'fuel_type' => 'hybrid',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1700,
            'status' => 'available',
            'image' => null,
            'description' => 'Comfortable Toyota Camry hybrid, perfect for long trips and business travel.',
        ]);

        $hyundaiTucson = Car::create([
            'category_id' => $suv->id,
            'branch_id' => $cairoBranch->id,
            'brand' => 'Hyundai',
            'model' => 'Tucson',
            'year' => 2024,
            'color' => 'Dark Gray',
            'license_plate' => 'CAI-1009',
            'vin' => 'KMH00000000000009',
            'mileage' => 16000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1800,
            'status' => 'available',
            'image' => null,
            'description' => 'Modern Hyundai Tucson SUV with excellent space and everyday practicality.',
        ]);

        $nissanSunny = Car::create([
            'category_id' => $economy->id,
            'branch_id' => $gizaBranch->id,
            'brand' => 'Nissan',
            'model' => 'Sunny',
            'year' => 2023,
            'color' => 'White',
            'license_plate' => 'GIZ-1010',
            'vin' => 'NIS00000000000010',
            'mileage' => 35000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 800,
            'status' => 'available',
            'image' => null,
            'description' => 'Affordable and practical Nissan Sunny for everyday city rentals.',
        ]);

        $nissanQashqai = Car::create([
            'category_id' => $suv->id,
            'branch_id' => $newCairoBranch->id,
            'brand' => 'Nissan',
            'model' => 'Qashqai',
            'year' => 2024,
            'color' => 'Red',
            'license_plate' => 'CAI-1011',
            'vin' => 'NIS00000000000011',
            'mileage' => 21000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1600,
            'status' => 'available',
            'image' => null,
            'description' => 'Stylish Nissan Qashqai SUV with comfortable seating and modern features.',
        ]);

        $mg5 = Car::create([
            'category_id' => $economy->id,
            'branch_id' => $cairoBranch->id,
            'brand' => 'MG',
            'model' => '5',
            'year' => 2024,
            'color' => 'Red',
            'license_plate' => 'CAI-1012',
            'vin' => 'LSJ00000000000012',
            'mileage' => 20000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 900,
            'status' => 'available',
            'image' => null,
            'description' => 'Affordable MG 5 sedan offering modern design and comfortable daily driving.',
        ]);

        $mgHS = Car::create([
            'category_id' => $suv->id,
            'branch_id' => $gizaBranch->id,
            'brand' => 'MG',
            'model' => 'HS',
            'year' => 2024,
            'color' => 'Black',
            'license_plate' => 'GIZ-1013',
            'vin' => 'LSJ00000000000013',
            'mileage' => 13000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1700,
            'status' => 'available',
            'image' => null,
            'description' => 'Spacious MG HS SUV with a premium interior and comfortable ride.',
        ]);

        $tesla = Car::create([
            'category_id' => $luxury->id,
            'branch_id' => $newCairoBranch->id,
            'brand' => 'Tesla',
            'model' => 'Model 3',
            'year' => 2025,
            'color' => 'White',
            'license_plate' => 'CAI-1014',
            'vin' => 'TES00000000000014',
            'mileage' => 9000,
            'fuel_type' => 'electric',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 3000,
            'status' => 'available',
            'image' => null,
            'description' => 'Premium Tesla Model 3 with electric performance and advanced technology.',
        ]);

        $hyundaiElantra = Car::create([
            'category_id' => $sedan->id,
            'branch_id' => $cairoBranch->id,
            'brand' => 'Hyundai',
            'model' => 'Elantra',
            'year' => 2024,
            'color' => 'Silver',
            'license_plate' => 'CAI-1015',
            'vin' => 'KMH00000000000015',
            'mileage' => 18000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1100,
            'status' => 'available',
            'image' => null,
            'description' => 'Modern Hyundai Elantra sedan with comfortable interior and efficient performance.',
        ]);

        $toyotaYaris = Car::create([
            'category_id' => $economy->id,
            'branch_id' => $gizaBranch->id,
            'brand' => 'Toyota',
            'model' => 'Yaris',
            'year' => 2023,
            'color' => 'Blue',
            'license_plate' => 'GIZ-1016',
            'vin' => 'JTD00000000000016',
            'mileage' => 28000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 850,
            'status' => 'available',
            'image' => null,
            'description' => 'Compact and economical Toyota Yaris, ideal for city driving.',
        ]);

        $kiaCerato = Car::create([
            'category_id' => $sedan->id,
            'branch_id' => $newCairoBranch->id,
            'brand' => 'Kia',
            'model' => 'Cerato',
            'year' => 2024,
            'color' => 'White',
            'license_plate' => 'CAI-1017',
            'vin' => 'KNA00000000000017',
            'mileage' => 16000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1050,
            'status' => 'available',
            'image' => null,
            'description' => 'Comfortable Kia Cerato sedan with modern styling and reliable performance.',
        ]);

        $skodaOctavia = Car::create([
            'category_id' => $sedan->id,
            'branch_id' => $gizaBranch->id,
            'brand' => 'Skoda',
            'model' => 'Octavia',
            'year' => 2024,
            'color' => 'Gray',
            'license_plate' => 'GIZ-1018',
            'vin' => 'TMB00000000000018',
            'mileage' => 15000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1350,
            'status' => 'available',
            'image' => null,
            'description' => 'Practical Skoda Octavia with a spacious cabin and comfortable ride.',
        ]);

        $volkswagenTiguan = Car::create([
            'category_id' => $suv->id,
            'branch_id' => $cairoBranch->id,
            'brand' => 'Volkswagen',
            'model' => 'Tiguan',
            'year' => 2024,
            'color' => 'Black',
            'license_plate' => 'CAI-1019',
            'vin' => 'WVG00000000000019',
            'mileage' => 11000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 2000,
            'status' => 'available',
            'image' => null,
            'description' => 'Premium Volkswagen Tiguan SUV with modern technology and spacious seating.',
        ]);

        $bmwX5 = Car::create([
            'category_id' => $luxury->id,
            'branch_id' => $newCairoBranch->id,
            'brand' => 'BMW',
            'model' => 'X5',
            'year' => 2025,
            'color' => 'White',
            'license_plate' => 'CAI-1020',
            'vin' => 'WBA00000000000020',
            'mileage' => 8000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 3800,
            'status' => 'available',
            'image' => null,
            'description' => 'High-end BMW X5 SUV offering luxury, performance, and advanced technology.',
        ]);

        $mercedesEClass = Car::create([
            'category_id' => $luxury->id,
            'branch_id' => $cairoBranch->id,
            'brand' => 'Mercedes-Benz',
            'model' => 'E-Class',
            'year' => 2025,
            'color' => 'Silver',
            'license_plate' => 'CAI-1021',
            'vin' => 'WDD00000000000021',
            'mileage' => 7000,
            'fuel_type' => 'hybrid',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 4000,
            'status' => 'available',
            'image' => null,
            'description' => 'Premium Mercedes-Benz E-Class with luxury comfort and hybrid efficiency.',
        ]);

        $toyotaRav4 = Car::create([
            'category_id' => $suv->id,
            'branch_id' => $gizaBranch->id,
            'brand' => 'Toyota',
            'model' => 'RAV4',
            'year' => 2024,
            'color' => 'Green',
            'license_plate' => 'GIZ-1022',
            'vin' => 'JTD00000000000022',
            'mileage' => 12000,
            'fuel_type' => 'hybrid',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 2100,
            'status' => 'available',
            'image' => null,
            'description' => 'Reliable Toyota RAV4 hybrid SUV, ideal for families and long-distance trips.',
        ]);

        $hondaCivic = Car::create([
            'category_id' => $sedan->id,
            'branch_id' => $cairoBranch->id,
            'brand' => 'Honda',
            'model' => 'Civic',
            'year' => 2024,
            'color' => 'Gray',
            'license_plate' => 'CAI-1023',
            'vin' => 'HND00000000000023',
            'mileage' => 14000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 1300,
            'status' => 'available',
            'image' => null,
            'description' => 'Modern Honda Civic sedan with excellent comfort, efficiency, and driving dynamics.',
        ]);

        $jeepGrandCherokee = Car::create([
            'category_id' => $suv->id,
            'branch_id' => $newCairoBranch->id,
            'brand' => 'Jeep',
            'model' => 'Grand Cherokee',
            'year' => 2024,
            'color' => 'Dark Green',
            'license_plate' => 'CAI-1024',
            'vin' => 'JEP00000000000024',
            'mileage' => 10000,
            'fuel_type' => 'petrol',
            'transmission' => 'automatic',
            'seats' => 5,
            'daily_rate' => 2600,
            'status' => 'available',
            'image' => null,
            'description' => 'Powerful Jeep Grand Cherokee SUV with premium comfort and excellent road capability.',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Bookings
        |--------------------------------------------------------------------------
        */

        $booking1 = Booking::create([
            'user_id' => $customer1->id,
            'car_id' => $toyota->id,
            'pickup_branch_id' => $gizaBranch->id,
            'dropoff_branch_id' => $cairoBranch->id,
            'pickup_date' => '2026-09-05',
            'return_date' => '2026-09-08',
            'daily_rate' => 1200,
            'total_days' => 3,
            'subtotal' => 3600,
            'discount' => 200,
            'total_amount' => 3400,
            'status' => 'confirmed',
            'notes' => 'Customer requested clean interior.',
        ]);

        $booking2 = Booking::create([
            'user_id' => $customer2->id,
            'car_id' => $mercedes->id,
            'pickup_branch_id' => $newCairoBranch->id,
            'dropoff_branch_id' => $newCairoBranch->id,
            'pickup_date' => '2026-09-10',
            'return_date' => '2026-09-12',
            'daily_rate' => 3200,
            'total_days' => 2,
            'subtotal' => 6400,
            'discount' => 400,
            'total_amount' => 6000,
            'status' => 'pending',
            'notes' => null,
        ]);

        $booking3 = Booking::create([
            'user_id' => $customer3->id,
            'car_id' => $kia->id,
            'pickup_branch_id' => $cairoBranch->id,
            'dropoff_branch_id' => $gizaBranch->id,
            'pickup_date' => '2026-08-20',
            'return_date' => '2026-08-23',
            'daily_rate' => 1900,
            'total_days' => 3,
            'subtotal' => 5700,
            'discount' => 300,
            'total_amount' => 5400,
            'status' => 'completed',
            'notes' => 'Completed successfully.',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Payments
        |--------------------------------------------------------------------------
        */

        Payment::create([
            'booking_id' => $booking1->id,
            'amount' => 3400,
            'payment_method' => 'card',
            'payment_status' => 'paid',
            'transaction_reference' => 'TXN-100001',
            'paid_at' => '2026-09-01 14:30:00',
        ]);

        Payment::create([
            'booking_id' => $booking2->id,
            'amount' => 6000,
            'payment_method' => 'online',
            'payment_status' => 'pending',
            'transaction_reference' => null,
            'paid_at' => null,
        ]);

        Payment::create([
            'booking_id' => $booking3->id,
            'amount' => 5400,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'transaction_reference' => 'CASH-100003',
            'paid_at' => '2026-08-20 10:00:00',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Booking Addons
        |--------------------------------------------------------------------------
        */

        BookingAddon::create([
            'booking_id' => $booking1->id,
            'name' => 'GPS Navigation',
            'price' => 100,
            'quantity' => 1,
        ]);

        BookingAddon::create([
            'booking_id' => $booking1->id,
            'name' => 'Child Seat',
            'price' => 150,
            'quantity' => 1,
        ]);

        BookingAddon::create([
            'booking_id' => $booking3->id,
            'name' => 'Additional Driver',
            'price' => 300,
            'quantity' => 1,
        ]);


        /*
        |--------------------------------------------------------------------------
        | Maintenance
        |--------------------------------------------------------------------------
        */

        Maintenance::create([
            'car_id' => $bmw->id,
            'title' => 'Regular Service',
            'description' => 'Oil change and general inspection.',
            'cost' => 2500,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-02',
            'status' => 'completed',
        ]);

        Maintenance::create([
            'car_id' => $kia->id,
            'title' => 'Brake Inspection',
            'description' => 'Brake system inspection and maintenance.',
            'cost' => 1800,
            'start_date' => '2026-09-06',
            'end_date' => null,
            'status' => 'scheduled',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Reviews
        |--------------------------------------------------------------------------
        */

        Review::create([
            'user_id' => $customer1->id,
            'car_id' => $toyota->id,
            'booking_id' => $booking1->id,
            'rating' => 5,
            'comment' => 'Excellent car and very comfortable.',
        ]);

        Review::create([
            'user_id' => $customer3->id,
            'car_id' => $kia->id,
            'booking_id' => $booking3->id,
            'rating' => 4,
            'comment' => 'Great SUV and smooth driving experience.',
        ]);
    }
}
