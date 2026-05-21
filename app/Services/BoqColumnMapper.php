<?php

namespace App\Services;

class BoqColumnMapper
{
    private array $synonyms = [
        'itemDescription' => [
            'item description', 'description', 'item', 'particulars',
            'work item', 'name', 'item name', 'works', 'details',
            'item no', 'work description', 'scope of work', 'scope of works',
        ],
        'unit' => [
            'unit', 'uom', 'unit of measure', 'units', 'u/m', 'unit of measurement',
        ],
        'quantity' => [
            'quantity', 'qty', 'qty.', 'volume', 'no.', 'nos',
            'count', 'no. of units', 'nos.', 'no',
        ],
        'materialUnitCost' => [
            'material unit cost', 'mat. cost', 'material cost',
            'mat cost', 'material rate', 'mat. unit cost', 'material unit rate',
            'materials', 'mat.', 'unit price', 'unit cost', 'price', 'rate',
        ],
        'laborUnitCost' => [
            'labor unit cost', 'labour cost', 'labor cost',
            'lab. cost', 'labor rate', 'labour rate', 'manpower cost',
            'labor unit rate', 'labour unit cost',
        ],
        'totalCost' => [
            'total', 'total cost', 'amount', 'total amount',
            'total price', 'extended cost', 'total unit cost', 'grand total',
        ],
    ];

    /**
     * @param  array<string>  $headers
     * @return array<array{columnIndex: int, originalHeader: string, mappedTo: string|null, confidence: string|null}>
     */
    public function map(array $headers): array
    {
        return array_map(function (string $header, int $index) {
            $normalized = strtolower(trim($header));
            $match = $this->findMatch($normalized);

            return [
                'columnIndex'    => $index,
                'originalHeader' => $header,
                'mappedTo'       => $match['field'],
                'confidence'     => $match['confidence'],
            ];
        }, $headers, array_keys($headers));
    }

    private function findMatch(string $normalized): array
    {
        // First pass: exact match
        foreach ($this->synonyms as $field => $synonymList) {
            if (in_array($normalized, $synonymList, true)) {
                return ['field' => $field, 'confidence' => 'high'];
            }
        }

        // Second pass: partial match (substring only, not substring of synonym)
        foreach ($this->synonyms as $field => $synonymList) {
            foreach ($synonymList as $synonym) {
                // Skip short synonyms in partial matching to avoid false positives
                if (strlen($synonym) <= 3) {
                    continue;
                }
                // Only match if normalized contains the synonym, not the other way around
                if (str_contains($normalized, $synonym) && $normalized !== $synonym) {
                    return ['field' => $field, 'confidence' => 'low'];
                }
            }
        }

        return ['field' => null, 'confidence' => null];
    }
}
