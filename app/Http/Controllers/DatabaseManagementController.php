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

    public function backup()
    {
        $connection = config('database.default');
        
        if ($connection !== 'mysql') {
            return back()->with('error', 'Backup feature currently only supports MySQL.');
        }

        $config = config("database.connections.mysql");
        $filename = "backup-" . date('Y-m-d-H-i-s') . ".sql";
        $path = storage_path('app/backups/' . $filename);

        if (!file_exists(storage_path('app/backups'))) {
            mkdir(storage_path('app/backups'), 0755, true);
        }

        $env = ['MYSQL_PWD' => $config['password']];
        $command = sprintf(
            'mysqldump --user=%s --host=%s --port=%s %s > %s',
            escapeshellarg($config['username']),
            escapeshellarg($config['host']),
            escapeshellarg($config['port']),
            escapeshellarg($config['database']),
            escapeshellarg($path)
        );

        $process = Process::fromShellCommandline($command, null, $env);
        $process->run();

        if (!$process->isSuccessful()) {
            return back()->with('error', 'Backup failed: ' . $process->getErrorOutput());
        }

        return response()->download($path)->deleteFileAfterSend(true);
    }

    public function import(Request $request)
    {
        $request->validate([
            'database_file' => 'required|file',
        ]);

        $connection = config('database.default');
        if ($connection !== 'mysql') {
            return back()->with('error', 'Import feature currently only supports MySQL.');
        }

        $config = config("database.connections.mysql");
        $file = $request->file('database_file');
        $path = $file->storeAs('temp', 'import.sql');
        $fullPath = storage_path('app/' . $path);

        $env = ['MYSQL_PWD' => $config['password']];
        $command = sprintf(
            'mysql --user=%s --host=%s --port=%s %s < %s',
            escapeshellarg($config['username']),
            escapeshellarg($config['host']),
            escapeshellarg($config['port']),
            escapeshellarg($config['database']),
            escapeshellarg($fullPath)
        );

        $process = Process::fromShellCommandline($command, null, $env);
        $process->run();

        Storage::delete($path);

        if (!$process->isSuccessful()) {
            return back()->with('error', 'Import failed: ' . $process->getErrorOutput());
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
            return back()->with('error', 'Reset failed: ' . $e->getMessage());
        }
    }
}
