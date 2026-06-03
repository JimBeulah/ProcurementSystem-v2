<?php

namespace App\Http\Controllers;

use App\Models\ProjectType;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProjectTypeController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/ProjectTypes/Index', [
            'projectTypes' => ProjectType::orderBy('label')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:100',
            'color' => 'required|string|max:50',
        ]);

        $name = Str::upper(Str::slug($validated['label'], '_'));

        // Append a counter suffix if the generated key already exists
        $base = $name;
        $counter = 2;
        while (ProjectType::where('name', $name)->exists()) {
            $name = $base . '_' . $counter++;
        }

        ProjectType::create(array_merge($validated, ['name' => $name]));

        return back()->with('success', 'Project type created.');
    }

    public function update(Request $request, ProjectType $projectType)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:100',
            'color' => 'required|string|max:50',
        ]);

        $projectType->update($validated);

        return back()->with('success', 'Project type updated.');
    }

    public function destroy(ProjectType $projectType)
    {
        $projectType->delete();

        return back()->with('success', 'Project type deleted.');
    }
}
