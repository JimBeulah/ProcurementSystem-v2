@extends('print.layout')

@section('title', $isProjectView ? 'Financial Report - ' . $data['project']['name'] : 'Aggregate Financial Report')

@push('styles')
<style>
    .kpi-container {
        margin-bottom: 30px;
    }
    .kpi-card {
        width: 30%;
        float: left;
        border: 1px solid #ddd;
        padding: 15px;
        margin-right: 3%;
        border-radius: 8px;
    }
    .kpi-card:last-child {
        margin-right: 0;
    }
    .kpi-label {
        font-size: 10px;
        color: #666;
        text-transform: uppercase;
        font-weight: bold;
        margin-bottom: 5px;
    }
    .kpi-value {
        font-size: 18px;
        font-weight: bold;
        color: #333;
    }
    .section-title {
        font-size: 14px;
        font-weight: bold;
        margin: 20px 0 10px 0;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
    }
    .text-right {
        text-align: right;
    }
    .font-mono {
        font-family: 'Courier', monospace;
    }
    .text-orange { color: #f97316; }
    .text-emerald { color: #10b981; }
    .text-blue { color: #3b82f6; }
    .bg-slate-50 { background-color: #f8fafc; }
    .status-badge {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: bold;
    }
    .status-paid { background-color: #d1fae5; color: #065f46; }
    .status-pending { background-color: #ffedd5; color: #9a3412; }
    
    .income-statement table td {
        padding: 10px;
    }
    .income-statement .line-item {
        padding-left: 20px;
    }
    .income-statement .total-row {
        font-weight: bold;
        background-color: #f8fafc;
    }
    .income-statement .net-income {
        font-size: 14px;
        background-color: #f1f5f9;
    }
</style>
@endpush

@section('content')
<div class="title">
    {{ $isProjectView ? 'Project Financial Report' : 'Aggregate Financial Report' }}
</div>

@if($isProjectView)
    <div style="margin-bottom: 20px;">
        <strong>Project:</strong> {{ $data['project']['name'] }}<br>
        <strong>Client:</strong> {{ $data['project']['clientName'] }}<br>
        <strong>Budget:</strong> PHP {{ number_format($data['project']['budget'], 2) }}
    </div>

    <div class="section-title">Income Statement (P&L)</div>
    <div class="income-statement">
        <table class="w-full">
            <thead>
                <tr class="bg-slate-50">
                    <th>Description</th>
                    <th class="text-right">Amount (PHP)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="2"><strong>Operating Revenue</strong></td>
                </tr>
                <tr class="line-item">
                    <td>Contract Amount (Budget)</td>
                    <td class="text-right">{{ number_format($data['income_statement']['revenue']['contract_amount'], 2) }}</td>
                </tr>
                <tr class="line-item border-b">
                    <td>Other Income</td>
                    <td class="text-right">{{ number_format($data['income_statement']['revenue']['other_income'], 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td>Total Operating Revenue</td>
                    <td class="text-right">{{ number_format($data['income_statement']['revenue']['total_operating_revenue'], 2) }}</td>
                </tr>

                <tr>
                    <td colspan="2" style="padding-top: 20px;"><strong>Cost of Goods Sold (COGS)</strong></td>
                </tr>
                <tr class="line-item">
                    <td>Committed Procurement (POs)</td>
                    <td class="text-right">{{ number_format($data['income_statement']['cogs']['committed_pos'], 2) }}</td>
                </tr>
                <tr class="line-item border-b">
                    <td>Other Direct Costs</td>
                    <td class="text-right">{{ number_format($data['income_statement']['cogs']['other_direct_costs'], 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td>Total COGS</td>
                    <td class="text-right">{{ number_format($data['income_statement']['cogs']['total_cogs'], 2) }}</td>
                </tr>

                <tr class="total-row" style="background-color: #ecfdf5;">
                    <td>GROSS PROFIT</td>
                    <td class="text-right text-emerald">{{ number_format($data['income_statement']['gross_profit']['amount'], 2) }}</td>
                </tr>

                <tr>
                    <td colspan="2" style="padding-top: 20px;"><strong>Operating Expenses</strong></td>
                </tr>
                <tr class="line-item border-b">
                    <td>General & Administrative Expenses</td>
                    <td class="text-right">{{ number_format($data['income_statement']['operating_expenses']['total'], 2) }}</td>
                </tr>

                <tr class="total-row net-income">
                    <td>NET INCOME</td>
                    <td class="text-right text-emerald">{{ number_format($data['income_statement']['net_income']['amount'], 2) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
@else
    <div class="kpi-container">
        @php
            $totalBudget = collect($data)->sum('budget');
            $totalCommitted = collect($data)->sum('committed');
            $totalPaid = collect($data)->sum('paid');
        @endphp
        <div class="kpi-card">
            <div class="kpi-label">Total Budget</div>
            <div class="kpi-value">PHP {{ number_format($totalBudget, 0) }}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Committed Costs</div>
            <div class="kpi-value text-orange">PHP {{ number_format($totalCommitted, 0) }}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Actual Paid</div>
            <div class="kpi-value text-emerald">PHP {{ number_format($totalPaid, 0) }}</div>
        </div>
        <div class="clear"></div>
    </div>

    <div class="section-title">Project Cost Breakdown</div>
    <table class="w-full text-sm">
        <thead>
            <tr class="bg-slate-50">
                <th>Project</th>
                <th class="text-right">Budget</th>
                <th class="text-right">Committed</th>
                <th class="text-right">Invoiced</th>
                <th class="text-right">Paid</th>
                <th class="text-right">Remaining</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $p)
                <tr>
                    <td>
                        <strong>{{ $p['name'] }}</strong><br>
                        <small>{{ $p['clientName'] }}</small>
                    </td>
                    <td class="text-right font-mono">{{ number_format($p['budget'], 2) }}</td>
                    <td class="text-right font-mono text-orange">{{ number_format($p['committed'], 2) }}</td>
                    <td class="text-right font-mono">{{ number_format($p['invoiced'], 2) }}</td>
                    <td class="text-right font-mono text-emerald">{{ number_format($p['paid'], 2) }}</td>
                    <td class="text-right font-mono"><strong>{{ number_format($p['remaining'], 2) }}</strong></td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endif

<div class="signatures">
    <div class="signature-box">
        <div class="signature-line"></div>
        <div style="text-align: center;">Prepared By</div>
    </div>
    <div class="signature-box">
        <div class="signature-line"></div>
        <div style="text-align: center;">Reviewed By</div>
    </div>
    <div class="signature-box">
        <div class="signature-line"></div>
        <div style="text-align: center;">Approved By</div>
    </div>
    <div class="clear"></div>
</div>
@endsection
