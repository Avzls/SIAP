<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetLocation;
use App\Enums\AssetStatus;
use Illuminate\Support\Collection;
use Illuminate\Http\UploadedFile;

class AssetImportService
{
    protected array $errors = [];
    protected int $successCount = 0;
    protected int $skipCount = 0;

    /**
     * Import assets from CSV file
     */
    public function importFromCsv(UploadedFile $file): array
    {
        $this->errors = [];
        $this->successCount = 0;
        $this->skipCount = 0;

        $handle = fopen($file->getPathname(), 'r');
        
        // Read header row
        $header = fgetcsv($handle, 0, ',');
        if (!$header) {
            return [
                'success' => false,
                'message' => 'File CSV kosong atau format tidak valid',
            ];
        }

        // Normalize headers
        $header = array_map(fn($h) => strtolower(trim($h)), $header);
        
        // Required columns
        $requiredColumns = ['name', 'category_code'];
        foreach ($requiredColumns as $col) {
            if (!in_array($col, $header)) {
                return [
                    'success' => false,
                    'message' => "Kolom wajib tidak ditemukan: {$col}",
                ];
            }
        }

        // Cache categories and locations
        $categories = AssetCategory::pluck('id', 'code')->toArray();
        $locations = AssetLocation::pluck('id', 'code')->toArray();

        $rowNum = 1; // Start after header
        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            $rowNum++;
            
            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            // Map row to associative array
            $data = [];
            foreach ($header as $index => $key) {
                $data[$key] = $row[$index] ?? '';
            }

            // Process row
            $this->processRow($data, $rowNum, $categories, $locations);
        }

        fclose($handle);

        return [
            'success' => true,
            'message' => "Import selesai: {$this->successCount} berhasil, {$this->skipCount} dilewati",
            'success_count' => $this->successCount,
            'skip_count' => $this->skipCount,
            'errors' => array_slice($this->errors, 0, 20), // Max 20 errors
        ];
    }

    /**
     * Process a single row
     */
    protected function processRow(array $data, int $rowNum, array $categories, array $locations): void
    {
        // Validate required fields
        if (empty($data['name'])) {
            $this->addError($rowNum, 'Nama aset wajib diisi');
            return;
        }

        if (empty($data['category_code'])) {
            $this->addError($rowNum, 'Kode kategori wajib diisi');
            return;
        }

        // Lookup category
        $categoryCode = strtoupper(trim($data['category_code']));
        if (!isset($categories[$categoryCode])) {
            $this->addError($rowNum, "Kategori tidak ditemukan: {$categoryCode}");
            return;
        }

        // Check if asset_tag already exists (if provided)
        if (!empty($data['asset_tag'])) {
            $existingAsset = Asset::where('asset_tag', $data['asset_tag'])->first();
            if ($existingAsset) {
                $this->addError($rowNum, "Asset tag sudah ada: {$data['asset_tag']}");
                $this->skipCount++;
                return;
            }
        }

        // Lookup location (optional)
        $locationId = null;
        if (!empty($data['location_code'])) {
            $locationCode = strtoupper(trim($data['location_code']));
            if (isset($locations[$locationCode])) {
                $locationId = $locations[$locationCode];
            } else {
                $this->addError($rowNum, "Lokasi tidak ditemukan: {$locationCode} (dilewati)");
            }
        }

        // Parse purchase price
        $purchasePrice = null;
        if (!empty($data['purchase_price'])) {
            // Remove currency symbols and thousand separators
            $price = preg_replace('/[^0-9.]/', '', $data['purchase_price']);
            $purchasePrice = is_numeric($price) ? floatval($price) : null;
        }

        // Parse dates
        $purchaseDate = $this->parseDate($data['purchase_date'] ?? '');
        $warrantyEnd = $this->parseDate($data['warranty_end'] ?? '');

        // Create asset
        try {
            Asset::create([
                'asset_tag' => !empty($data['asset_tag']) ? trim($data['asset_tag']) : $this->generateAssetTag($categoryCode),
                'name' => trim($data['name']),
                'category_id' => $categories[$categoryCode],
                'current_location_id' => $locationId,
                'brand' => $data['brand'] ?? null,
                'model' => $data['model'] ?? null,
                'serial_number' => $data['serial_number'] ?? null,
                'purchase_date' => $purchaseDate,
                'purchase_price' => $purchasePrice,
                'warranty_end' => $warrantyEnd,
                'notes' => $data['notes'] ?? null,
                'status' => AssetStatus::IN_STOCK,
            ]);
            
            $this->successCount++;
        } catch (\Exception $e) {
            $this->addError($rowNum, "Gagal menyimpan: " . $e->getMessage());
        }
    }

    /**
     * Generate asset tag
     */
    protected function generateAssetTag(string $categoryCode): string
    {
        $prefix = 'AST-' . substr($categoryCode, 0, 3);
        $lastAsset = Asset::where('asset_tag', 'like', $prefix . '%')
            ->orderByRaw('CAST(SUBSTRING(asset_tag, -5) AS UNSIGNED) DESC')
            ->first();

        if ($lastAsset) {
            $lastNumber = (int) substr($lastAsset->asset_tag, -5);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . '-' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Parse date from various formats
     */
    protected function parseDate(?string $dateStr): ?string
    {
        if (empty($dateStr)) {
            return null;
        }

        // Try various formats
        $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'm/d/Y'];
        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, trim($dateStr));
            if ($date !== false) {
                return $date->format('Y-m-d');
            }
        }

        return null;
    }

    /**
     * Add error to list
     */
    protected function addError(int $row, string $message): void
    {
        $this->errors[] = [
            'row' => $row,
            'message' => $message,
        ];
    }

    /**
     * Generate CSV template
     */
    public static function getTemplateContent(): string
    {
        $headers = [
            'asset_tag',
            'name',
            'category_code',
            'location_code',
            'brand',
            'model',
            'serial_number',
            'purchase_date',
            'purchase_price',
            'warranty_end',
            'notes',
        ];

        $examples = [
            'AST-LAP-00001',
            'Laptop Dell Latitude 5520',
            'LAPTOP',
            'HQ-01',
            'Dell',
            'Latitude 5520',
            'ABC123XYZ',
            '2024-01-15',
            '15000000',
            '2027-01-15',
            'Dengan tas laptop',
        ];

        $template = implode(',', $headers) . "\n";
        $template .= implode(',', $examples) . "\n";
        
        return $template;
    }

    /**
     * Get template column descriptions
     */
    public static function getTemplateDescription(): array
    {
        return [
            ['column' => 'asset_tag', 'description' => 'Tag aset (opsional, auto-generate jika kosong)', 'required' => false],
            ['column' => 'name', 'description' => 'Nama aset', 'required' => true],
            ['column' => 'category_code', 'description' => 'Kode kategori (harus sudah ada di master)', 'required' => true],
            ['column' => 'location_code', 'description' => 'Kode lokasi (opsional)', 'required' => false],
            ['column' => 'brand', 'description' => 'Merek', 'required' => false],
            ['column' => 'model', 'description' => 'Model', 'required' => false],
            ['column' => 'serial_number', 'description' => 'Nomor seri', 'required' => false],
            ['column' => 'purchase_date', 'description' => 'Tanggal pembelian (YYYY-MM-DD)', 'required' => false],
            ['column' => 'purchase_price', 'description' => 'Harga pembelian', 'required' => false],
            ['column' => 'warranty_end', 'description' => 'Tanggal garansi berakhir (YYYY-MM-DD)', 'required' => false],
            ['column' => 'notes', 'description' => 'Catatan', 'required' => false],
        ];
    }
}
