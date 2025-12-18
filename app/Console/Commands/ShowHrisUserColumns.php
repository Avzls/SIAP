<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ShowHrisUserColumns extends Command
{
    protected $signature = 'hris:user-columns';
    protected $description = 'Show users table columns from HRIS';

    public function handle(): int
    {
        $columns = DB::connection('hris')->select(
            "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' ORDER BY ORDINAL_POSITION"
        );

        $this->info('=== HRIS users table columns ===');
        $this->newLine();

        foreach ($columns as $col) {
            $this->line("- {$col->COLUMN_NAME} ({$col->DATA_TYPE})");
        }

        $this->newLine();

        // Show sample data
        $sample = DB::connection('hris')->table('users')->first();
        if ($sample) {
            $this->info('=== Sample row ===');
            foreach ((array) $sample as $key => $value) {
                $displayValue = is_null($value) ? 'NULL' : (strlen((string)$value) > 50 ? substr((string)$value, 0, 50) . '...' : $value);
                $this->line("$key: $displayValue");
            }
        }

        return Command::SUCCESS;
    }
}
