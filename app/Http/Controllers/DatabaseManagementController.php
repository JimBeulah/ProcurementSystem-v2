<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\Process\Process;

class DatabaseManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Database/Index');
    }

    protected function getBinaryPath($binary)
    {
        // On Windows, especially with Laragon, we might need absolute paths
        if (PHP_OS_FAMILY === 'Windows') {
            // Determine driver based on binary prefix
            $isPg = str_starts_with($binary, 'pg_') || $binary === 'psql';
            $driverPath = $isPg ? 'C:\\laragon\\bin\\postgresql\\' : 'C:\\laragon\\bin\\mysql\\';

            if (is_dir($driverPath)) {
                $versions = array_diff(scandir($driverPath, SCANDIR_SORT_DESCENDING), ['.', '..']);
                foreach ($versions as $version) {
                    $fullPath = $driverPath.$version.'\\bin\\'.$binary.'.exe';
                    if (file_exists($fullPath)) {
                        return $fullPath;
                    }
                }
            }
        }

        return $binary; // Fallback to system PATH
    }

    public function backup()
    {
        $connection = config('database.default');
        $config = config("database.connections.{$connection}");

        if (! in_array($connection, ['mysql', 'pgsql'])) {
            return back()->with('error', "Backup feature currently only supports MySQL and PostgreSQL. Current driver: {$connection}");
        }

        $filename = 'backup-'.date('Y-m-d-H-i-s').'.sql';
        $path = storage_path('app/backups/'.$filename);

        if (! file_exists(storage_path('app/backups'))) {
            mkdir(storage_path('app/backups'), 0755, true);
        }

        if ($connection === 'mysql') {
            $mysqldump = $this->getBinaryPath('mysqldump');
            $env = array_merge($_SERVER, getenv(), ['MYSQL_PWD' => $config['password']]);
            $command = sprintf(
                '%s --user=%s --host=%s --port=%s --protocol=tcp %s > %s',
                escapeshellarg($mysqldump),
                escapeshellarg($config['username']),
                escapeshellarg($config['host']),
                escapeshellarg($config['port']),
                escapeshellarg($config['database']),
                escapeshellarg($path)
            );
        } else {
            $pgdump = $this->getBinaryPath('pg_dump');
            $env = array_merge($_SERVER, getenv(), ['PGPASSWORD' => $config['password']]);
            $command = sprintf(
                '%s -U %s -h %s -p %s %s > %s',
                escapeshellarg($pgdump),
                escapeshellarg($config['username']),
                escapeshellarg($config['host']),
                escapeshellarg($config['port']),
                escapeshellarg($config['database']),
                escapeshellarg($path)
            );
        }

        $process = Process::fromShellCommandline($command, null, $env);
        $process->run();

        if (! $process->isSuccessful()) {
            return back()->with('error', 'Backup failed: '.$process->getErrorOutput());
        }

        return response()->download($path)->deleteFileAfterSend(true);
    }

    public function import(Request $request)
    {
        $request->validate([
            'database_file' => 'required|file',
        ]);

        $connection = config('database.default');
        $config = config("database.connections.{$connection}");

        if (! in_array($connection, ['mysql', 'pgsql'])) {
            return back()->with('error', "Import feature currently only supports MySQL and PostgreSQL. Current driver: {$connection}");
        }

        $file = $request->file('database_file');
        $path = $file->storeAs('temp', 'import.sql');
        $fullPath = storage_path('app/'.$path);

        if ($connection === 'mysql') {
            $mysql = $this->getBinaryPath('mysql');
            $env = array_merge($_SERVER, getenv(), ['MYSQL_PWD' => $config['password']]);
            $command = sprintf(
                '%s --user=%s --host=%s --port=%s --protocol=tcp %s < %s',
                escapeshellarg($mysql),
                escapeshellarg($config['username']),
                escapeshellarg($config['host']),
                escapeshellarg($config['port']),
                escapeshellarg($config['database']),
                escapeshellarg($fullPath)
            );
        } else {
            $psql = $this->getBinaryPath('psql');
            $env = array_merge($_SERVER, getenv(), ['PGPASSWORD' => $config['password']]);
            // For PostgreSQL, we often need to drop/create or just pipe.
            // Standard restore from .sql file usually works with psql.
            $command = sprintf(
                '%s -U %s -h %s -p %s %s < %s',
                escapeshellarg($psql),
                escapeshellarg($config['username']),
                escapeshellarg($config['host']),
                escapeshellarg($config['port']),
                escapeshellarg($config['database']),
                escapeshellarg($fullPath)
            );
        }

        $process = Process::fromShellCommandline($command, null, $env);
        $process->run();

        Storage::delete($path);

        if (! $process->isSuccessful()) {
            return back()->with('error', 'Import failed: '.$process->getErrorOutput());
        }

        return back()->with('success', 'Database imported successfully.');
    }

    public function reset()
    {
        try {
            Artisan::call('migrate:fresh', [
                '--seed' => true,
                '--force' => true,
            ]);

            return back()->with('success', 'Database has been reset to initial state.');
        } catch (\Exception $e) {
            return back()->with('error', 'Reset failed: '.$e->getMessage());
        }
    }
}
