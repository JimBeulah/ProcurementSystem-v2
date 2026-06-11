<?php
// app/Services/BoqItemClassifier.php

namespace App\Services;

class BoqItemClassifier
{
    private array $directKeywords = [
        'supply', 'steel', 'rebar', 'pipe', 'pvc', 'chb', 'block',
        'aggregate', 'gravel', 'sand', 'cement', 'tile', 'paint',
        'wire', 'lumber', 'plywood', 'phenolic', 'glass', 'door',
        'window', 'hardware', 'bolt', 'nail', 'bar', 'reinforcing',
        'structural', 'sheet pile', 'guardrail', 'concrete masonry',
    ];

    private array $serviceKeywords = [
        'mobilization', 'demobilization', 'whse', 'documentation',
        'management', 'safety', 'health', 'loading', 'unloading',
        'hauling', 'as-built', 'supervision', 'inspection',
        'signboard', 'billboard', 'permit', 'testing', 'survey',
    ];

    /**
     * Classify a BOQ item description into one of three nature categories.
     *
     * Returns one of:
     *   'DIRECT_MATERIAL' — item is a directly purchasable resource (e.g. steel, pipe, CHB)
     *   'SERVICE'         — item is a pure labor/service deliverable (e.g. mobilization, WHSE)
     *   'BUNDLE'          — item is a work package whose materials must be entered manually
     *
     * Note: these are nature categories, not resource_type values stored in boq_item_components.
     */
    public function classify(string $description): string
    {
        $lower = strtolower($description);

        foreach ($this->directKeywords as $keyword) {
            if (str_contains($lower, $keyword)) {
                return 'DIRECT_MATERIAL';
            }
        }

        foreach ($this->serviceKeywords as $keyword) {
            if (str_contains($lower, $keyword)) {
                return 'SERVICE';
            }
        }

        return 'BUNDLE';
    }
}
