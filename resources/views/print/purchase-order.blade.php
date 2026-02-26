@extends('print.layout')

@section('title', 'Purchase Order - PO-' . str_pad($purchaseOrder->id, 5, '0', STR_PAD_LEFT))

@section('watermark')
    @if(strtoupper($purchaseOrder->status) === 'APPROVED' || strtoupper($purchaseOrder->status) === 'COMPLETED')
        <div class="watermark" style="color: #16a34a; opacity: 0.06;">APPROVED</div>
    @elseif(strtoupper($purchaseOrder->status) === 'DECLINED')
        <div class="watermark">DECLINED</div>
    @else
        <div class="watermark" style="color: #d97706; opacity: 0.05;">UNOFFICIAL COPY</div>
    @endif
@endsection

@section('content')
    <div class="title">Purchase Order</div>

    <table style="width: 100%; border: none;">
        <tr>
            <td style="border: none; width: 50%;">
                <strong>PO Number:</strong> PO-{{ str_pad($purchaseOrder->id, 5, '0', STR_PAD_LEFT) }}<br>
                <strong>Order Date:</strong> {{ \Carbon\Carbon::parse($purchaseOrder->order_date)->format('M d, Y') }}<br>
                <strong>Status:</strong> {{ ucfirst(strtolower($purchaseOrder->status)) }}
            </td>
            <td style="border: none; width: 50%; text-align: right;">
                <strong>Project:</strong> {{ $purchaseOrder->project->name ?? 'N/A' }}<br>
                <strong>Supplier:</strong> {{ $purchaseOrder->supplier->name ?? 'N/A' }}<br>
                <strong>Contact:</strong> {{ $purchaseOrder->supplier->contact_person ?? 'N/A' }}
            </td>
        </tr>
    </table>

    <table style="margin-top: 20px;">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 40%;">Item Description</th>
                <th style="width: 15%; text-align: center;">Quantity</th>
                <th style="width: 15%; text-align: right;">Unit Price</th>
                <th style="width: 25%; text-align: right;">Total Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchaseOrder->items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        <strong>{{ $item->material_name ?? 'N/A' }}</strong><br>
                        <span style="font-size: 10px; color: #555;">{{ $item->description ?? '' }}</span>
                    </td>
                    <td style="text-align: center;">{{ $item->quantity ?? 0 }} {{ $item->unit ?? 'pcs' }}</td>
                    <td style="text-align: right;">{{ number_format($item->unit_price, 2) }}</td>
                    <td style="text-align: right;">{{ number_format($item->total_price, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4" style="text-align: right; font-weight: bold;">TOTAL AMOUNT (PHP)</td>
                <td style="text-align: right; font-weight: bold; font-size: 14px; color: #16a34a;">
                    {{ number_format($purchaseOrder->total_amount, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <div style="margin-top: 20px;">
        <strong>Remarks:</strong>
        <p style="border: 1px solid #ddd; padding: 10px; min-height: 50px;">
            {{ $purchaseOrder->remarks ?? 'No additional remarks provided.' }}
        </p>
    </div>

    <div class="signatures">
        <div class="signature-box">
            <strong>Requested By:</strong>
            <div class="signature-line">
                <span class="signature-status">Signed Electronically</span>
            </div>
            <div style="text-align: center;">
                {{ $purchaseOrder->requester->name ?? '______________' }}<br>
                <small>{{ $purchaseOrder->created_at->format('M d, Y') }}</small>
            </div>
        </div>

        <div class="signature-box" style="float: right;">
            <strong>Approved By:</strong>
            <div class="signature-line">
                @if(strtoupper($purchaseOrder->status) === 'APPROVED' || strtoupper($purchaseOrder->status) === 'COMPLETED')
                    <span class="signature-status">Approved via System</span>
                @endif
            </div>
            <div style="text-align: center;">
                {{ $purchaseOrder->approver->name ?? 'Management / Finance' }}<br>
                <small>Date:
                    {{ $purchaseOrder->approver ? $purchaseOrder->updated_at->format('M d, Y') : '______________' }}</small>
            </div>
        </div>

        <div class="clear"></div>
    </div>
@endsection