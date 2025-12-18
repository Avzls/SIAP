<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckHrisTables extends Command
{
    protected $signature = 'hris:check';
    protected $description = 'Check HRIS database tables';

    public function handle(): int
    {
        try {
            $tables = DB::connection('hris')->select(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
            );

            $this->info('=== HRIS Tables ===');
            $this->newLine();

            foreach ($tables as $table) {
                $this->line('- ' . $table->TABLE_NAME);
            }

            $this->newLine();
            $this->info('Total: ' . count($tables) . ' tables');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
