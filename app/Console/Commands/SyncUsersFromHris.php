<?php

namespace App\Console\Commands;

use App\Services\HrisSyncService;
use Illuminate\Console\Command;

class SyncUsersFromHris extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hris:sync-users 
                            {--dry-run : Show what would be synced without making changes}
                            {--force : Force sync even if recently synced}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync users from HRIS SQL Server database';

    /**
     * Execute the console command.
     */
    public function handle(HrisSyncService $service): int
    {
        $dryRun = $this->option('dry-run');

        $this->info('Starting HRIS user sync...');
        $this->newLine();

        if ($dryRun) {
            $this->warn('🔍 DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        try {
            $result = $service->syncUsers($dryRun);

            $this->table(
                ['Action', 'Count'],
                [
                    ['✅ Created', $result['created']],
                    ['🔄 Updated', $result['updated']],
                    ['❌ Deactivated', $result['deactivated']],
                    ['♻️ Reactivated', $result['reactivated']],
                    ['⏭️ Skipped', $result['skipped']],
                ]
            );

            $this->newLine();

            if ($dryRun) {
                $this->warn('DRY RUN - No changes were made.');
            } else {
                $this->info('✅ HRIS sync completed successfully.');
            }

            if ($result['errors'] > 0) {
                $this->error("⚠️ {$result['errors']} errors occurred. Check logs for details.");
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ HRIS sync failed: ' . $e->getMessage());
            $this->newLine();
            $this->error('Check that the HRIS database connection is configured correctly in .env');

            return Command::FAILURE;
        }
    }
}
