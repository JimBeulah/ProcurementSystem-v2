<?php

namespace Tests\Unit;

use App\Services\BoqItemClassifier;
use PHPUnit\Framework\TestCase;

class BoqItemClassifierTest extends TestCase
{
    private BoqItemClassifier $classifier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->classifier = new BoqItemClassifier();
    }

    public function test_classifies_reinforcing_steel_as_direct_material()
    {
        $this->assertSame('DIRECT_MATERIAL', $this->classifier->classify('Reinforcing Steel'));
    }

    public function test_classifies_pvc_pipe_as_direct_material()
    {
        $this->assertSame('DIRECT_MATERIAL', $this->classifier->classify('Supply and Installation of 50mmØ PVC Pipe'));
    }

    public function test_classifies_chb_as_direct_material()
    {
        $this->assertSame('DIRECT_MATERIAL', $this->classifier->classify('6" CHB'));
    }

    public function test_classifies_mobilization_as_service()
    {
        $this->assertSame('SERVICE', $this->classifier->classify('Mobilization/Demobilization for CME-GBT'));
    }

    public function test_classifies_whse_requirements_as_service()
    {
        $this->assertSame('SERVICE', $this->classifier->classify('WHSE Requirements'));
    }

    public function test_classifies_as_built_documentation_as_service()
    {
        $this->assertSame('SERVICE', $this->classifier->classify('As-built Documentation for Site Acceptance and Billing'));
    }

    public function test_classifies_concrete_works_as_bundle()
    {
        $this->assertSame('BUNDLE', $this->classifier->classify('Concrete Works'));
    }

    public function test_classifies_excavation_as_bundle()
    {
        $this->assertSame('BUNDLE', $this->classifier->classify('Excavation'));
    }

    public function test_classifies_formworks_as_bundle()
    {
        $this->assertSame('BUNDLE', $this->classifier->classify('Formworks/Falseworks'));
    }

    public function test_is_case_insensitive()
    {
        $this->assertSame('DIRECT_MATERIAL', $this->classifier->classify('REINFORCING STEEL'));
        $this->assertSame('SERVICE', $this->classifier->classify('mobilization'));
    }

    public function test_direct_takes_priority_over_service()
    {
        $this->assertSame('DIRECT_MATERIAL', $this->classifier->classify('Supply of Safety Equipment'));
    }
}
