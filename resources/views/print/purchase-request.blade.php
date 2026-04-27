@extends('print.layout')

@section('title', 'Purchase Request - PR-' . str_pad($purchaseRequest->id, 5, '0', STR_PAD_LEFT))

@section('watermark')
    @if(strtoupper($purchaseRequest->status->value) === 'APPROVED' || strtoupper($purchaseRequest->status->value) === 'COMPLETED')
        <div class="watermark" style="color: #16a34a; opacity: 0.06;">APPROVED</div>
    @elseif(strtoupper($purchaseRequest->status->value) === 'DECLINED')
        <div class="watermark">DECLINED</div>
    @else
        <div class="watermark" style="color: #d97706; opacity: 0.05;">UNOFFICIAL COPY</div>
    @endif
@endsection

@section('content')
    <div class="title">Purchase Request</div>

    <table style="width: 100%; border: none;">
        <tr>
            <td style="border: none; width: 50%;">
                <strong>PR Number:</strong> PR-{{ str_pad($purchaseRequest->id, 5, '0', STR_PAD_LEFT) }}<br>
                <strong>Date Created:</strong> {{ $purchaseRequest->created_at->format('M d, Y') }}<br>
                <strong>Status:</strong> {{ ucfirst(strtolower($purchaseRequest->status->value)) }}
            </td>
            <td style="border: none; width: 50%; text-align: right;">
                <strong>Project:</strong> {{ $purchaseRequest->project->name ?? 'N/A' }}<br>
                <strong>Requested By:</strong> {{ $purchaseRequest->requester->name ?? 'System' }}<br>
                <strong>Date Required:</strong>
                {{ count($purchaseRequest->items) > 0 && isset($purchaseRequest->items[0]->date_required) ? \Carbon\Carbon::parse($purchaseRequest->items[0]->date_required)->format('M d, Y') : 'N/A' }}
            </td>
        </tr>
    </table>

    <table style="margin-top: 20px;">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 40%;">Item Description</th>
                <th style="width: 15%; text-align: center;">Quantity</th>
                <th style="width: 15%; text-align: center;">UOM</th>
                <th style="width: 25%;">Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchaseRequest->items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->item_description ?? 'N/A' }}</td>
                    <td style="text-align: center;">{{ $item->quantity ?? 0 }}</td>
                    <td style="text-align: center;">{{ $item->unit ?? 'pcs' }}</td>
                    <td>{{ $item->remarks ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 20px;">
        <strong>Notes/Justification:</strong>
        <p style="border: 1px solid #ddd; padding: 10px; min-height: 50px;">
            {{ $purchaseRequest->justification ?? 'No additional notes provided.' }}
        </p>
    </div>

    <div class="signatures">
        <div class="signature-box">
            <strong>Requested By:</strong>
            <div class="signature-line">
                <!-- If system has digital signature or simply "Approved" stamp -->
                <span class="signature-status">Signed Electronically</span>
            </div>
            <div style="text-align: center;">
                {{ $purchaseRequest->requester->name ?? '______________' }}<br>
                <small>{{ $purchaseRequest->created_at->format('M d, Y') }}</small>
            </div>
        </div>

        <div class="signature-box">
            <strong>Verified By:</strong>
            <div class="signature-line">
                @if(strtoupper($purchaseRequest->status->value) === 'APPROVED' || strtoupper($purchaseRequest->status->value) === 'COMPLETED')
                    <span class="signature-status">Approved via System</span>
                @endif
            </div>
            <div style="text-align: center;">
                Project Manager / Admin<br>
                <small>Date: ______________</small>
            </div>
        </div>

        <div class="signature-box" style="float: right;">
            <strong>Approved By:</strong>
            <div class="signature-line">
                @if(strtoupper($purchaseRequest->status->value) === 'APPROVED' || strtoupper($purchaseRequest->status->value) === 'COMPLETED')
                    <span class="signature-status">Approved via System</span>
                @endif
            </div>
            <div style="text-align: center;">
                Management / Finance<br>
                <small>Date: ______________</small>
            </div>
        </div>

        <div class="clear"></div>
    </div>
@endsection