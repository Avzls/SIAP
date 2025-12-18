<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FindEmployeeTable extends Command
{
    protected $signature = 'hris:find-employees';
    protected $description = 'Find employee-related tables in HRIS';

    public function handle(): int
    {
        $tables = DB::connection('hris')->select(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
             WHERE TABLE_TYPE = 'BASE TABLE' 
             AND (TABLE_NAME LIKE '%employee%' 
                  OR TABLE_NAME LIKE '%user%' 
                  OR TABLE_NAME LIKE '%karyawan%' 
                  OR TABLE_NAME LIKE '%pegawai%'
                  OR TABLE_NAME LIKE '%staff%'
                  OR TABLE_NAME LIKE '%m_employee%')"
        );

        $this->info('=== Employee-related Tables ===');
        foreach ($tables as $table) {
            $this->line('- ' . $table->TABLE_NAME);
        }

        // Try to get first employees table contents
        if (count($tables) > 0) {
            $tableName = $tables[0]->TABLE_NAME;
            $this->newLine();
            $this->info("=== Sample columns from '$tableName' ===");
            
            $columns = DB::connection('hris')->select(
                "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?",
                [$tableName]
            );
            
            foreach ($columns as $col) {
                $this->line("- {$col->COLUMN_NAME} ({$col->DATA_TYPE})");
            }
        }

        return Command::SUCCESS;
    }
}
