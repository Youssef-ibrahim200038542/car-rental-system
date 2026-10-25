<?php

namespace App\Console\Commands;

use App\Models\Car;
use App\Models\CarCategory;
use App\Models\Branch;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class ImportFleetCars extends Command
{
    protected $signature = 'fleet:import';

    protected $description = 'Import the Kaggle fleet dataset into the DriveX cars table';

    public function handle(): int
    {
        $csvPath = base_path('../ML/data/processed/fleet_clean.csv');

        if (!is_file($csvPath)) {
            $this->error("Dataset not found: {$csvPath}");
            return self::FAILURE;
        }

        $categories = CarCategory::query()
            ->get()
            ->keyBy(fn ($category) => strtolower(trim($category->name)));

        $branches = Branch::query()->orderBy('id')->get();

        if ($categories->isEmpty() || $branches->isEmpty()) {
            $this->error('Create at least one car category and one branch first.');
            return self::FAILURE;
        }

        $categoryMap = [
            'economy' => 'economy',
            'compact' => 'economy',
            'midsize' => 'sedan',
            'minivan' => 'sedan',
            'suv' => 'suv',
            'luxury' => 'luxury',
        ];

        foreach (array_unique(array_values($categoryMap)) as $requiredCategory) {
            if (!$categories->has($requiredCategory)) {
                $this->error(
                    "Required category '{$requiredCategory}' was not found. " .
                    'Check the existing categories before importing.'
                );

                return self::FAILURE;
            }
        }

        $handle = fopen($csvPath, 'r');

        if ($handle === false) {
            $this->error('Unable to open the dataset.');
            return self::FAILURE;
        }

        $headers = fgetcsv($handle, 0, ',', '"', '\\');

        if (!$headers) {
            fclose($handle);
            $this->error('The CSV file is empty or invalid.');
            return self::FAILURE;
        }

        $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);
        $headers = array_map(
            fn ($header) => strtolower(trim((string) $header)),
            $headers
        );

        $requiredColumns = [
            'vehicle_id',
            'manufacturer',
            'model_name',
            'category',
            'vehicle_year',
            'vehicle_color',
            'fuel_type',
            'transmission',
            'vehicle_mileage',
            'status',
            'branch_name',
            'city',
            'state',
            'source_daily_rate',
            'features',
        ];

        foreach ($requiredColumns as $column) {
            if (!in_array($column, $headers, true)) {
                fclose($handle);
                $this->error("Missing CSV column: {$column}");
                return self::FAILURE;
            }
        }

        $imported = 0;
        $skipped = 0;
        $statusCounts = [];

        try {
            DB::transaction(function () use (
                $handle,
                $headers,
                $categories,
                $categoryMap,
                $branches,
                &$imported,
                &$skipped,
                &$statusCounts
            ) {
                while (($values = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
                    if (count($values) !== count($headers)) {
                        $skipped++;
                        continue;
                    }

                    $row = array_combine($headers, $values);

                    if (!$row) {
                        $skipped++;
                        continue;
                    }

                    $sourceId = (int) ($row['vehicle_id'] ?? 0);

                    if ($sourceId <= 0) {
                        $skipped++;
                        continue;
                    }

                    // Stable identifiers prevent duplicate imports.
                    $vin = 'KGL' . str_pad(
                        (string) $sourceId,
                        14,
                        '0',
                        STR_PAD_LEFT
                    );

                    $licensePlate = 'KGL-' . str_pad(
                        (string) $sourceId,
                        6,
                        '0',
                        STR_PAD_LEFT
                    );

                    // Never overwrite an existing car.
                    if (
                        Car::query()->where('vin', $vin)->exists() ||
                        Car::query()->where('license_plate', $licensePlate)->exists()
                    ) {
                        $skipped++;
                        continue;
                    }

                    $sourceCategory = strtolower(
                        trim((string) ($row['category'] ?? ''))
                    );

                    $categoryName = $categoryMap[$sourceCategory] ?? 'economy';
                    $category = $categories->get($categoryName);

                    $sourceFuel = strtolower(
                        trim((string) ($row['fuel_type'] ?? ''))
                    );

                    $fuelType = match ($sourceFuel) {
                        'diesel' => 'diesel',
                        'hybrid', 'plug-in hybrid', 'plug in hybrid' => 'hybrid',
                        'electric', 'ev' => 'electric',
                        default => 'petrol',
                    };

                    $sourceTransmission = strtolower(
                        trim((string) ($row['transmission'] ?? ''))
                    );

                    $transmission = $sourceTransmission === 'manual'
                        ? 'manual'
                        : 'automatic';

                    $sourceStatus = strtolower(
                        trim((string) ($row['status'] ?? ''))
                    );

                    $status = match ($sourceStatus) {
                        'available' => 'available',
                        'reserved' => 'reserved',
                        'rented' => 'rented',
                        'maintenance' => 'maintenance',
                        'retired', 'inactive' => 'inactive',
                        default => 'inactive',
                    };

                    $year = (int) ($row['vehicle_year'] ?? 0);

                    if ($year < 1900 || $year > 2100) {
                        $skipped++;
                        continue;
                    }

                    $sourceBranch = trim((string) ($row['branch_name'] ?? ''));
                    $sourceCity = trim((string) ($row['city'] ?? ''));
                    $sourceState = trim((string) ($row['state'] ?? ''));
                    $sourceRate = trim((string) ($row['source_daily_rate'] ?? ''));
                    $features = trim((string) ($row['features'] ?? ''));

                    $descriptionParts = [
                        'Imported sample vehicle from the Kaggle fleet dataset.',
                        "Original dataset ID: {$sourceId}",
                        'Original category: ' . ($row['category'] ?? 'Unknown'),
                        "Original status: {$sourceStatus}",
                        "Original branch: {$sourceBranch}",
                        "Original location: {$sourceCity}, {$sourceState}",
                        "Original source daily rate: {$sourceRate} (currency not verified)",
                    ];

                    if ($features !== '') {
                        $descriptionParts[] = 'Features: ' . mb_substr($features, 0, 800);
                    }

                    // Use DriveX's existing category price, not an
                    // unverified source price or currency conversion.
                    $branch = $branches[$sourceId % $branches->count()];

                    Car::query()->create([
                        'category_id' => $category->id,
                        'branch_id' => $branch->id,
                        'brand' => trim((string) ($row['manufacturer'] ?? 'Unknown')),
                        'model' => trim((string) ($row['model_name'] ?? 'Unknown')),
                        'year' => $year,
                        'color' => trim((string) ($row['vehicle_color'] ?? '')) ?: null,
                        'license_plate' => $licensePlate,
                        'vin' => $vin,
                        'mileage' => max(
                            0,
                            (int) ($row['vehicle_mileage'] ?? 0)
                        ),
                        'fuel_type' => $fuelType,
                        'transmission' => $transmission,
                        'seats' => $sourceCategory === 'minivan' ? 7 : 5,
                        'daily_rate' => $category->daily_rate,
                        'status' => $status,
                        'image' => null,
                        'description' => implode(' | ', $descriptionParts),
                    ]);

                    $imported++;
                    $statusCounts[$status] = ($statusCounts[$status] ?? 0) + 1;
                }
            });
        } catch (Throwable $exception) {
            $this->error('Import failed. Database changes were rolled back.');
            $this->error($exception->getMessage());

            return self::FAILURE;
        } finally {
            fclose($handle);
        }

        $this->info("Import completed. New cars: {$imported}; skipped: {$skipped}.");

        foreach ($statusCounts as $status => $count) {
            $this->line("{$status}: {$count}");
        }

        $this->info('Existing cars were not updated or deleted.');

        return self::SUCCESS;
    }
}
