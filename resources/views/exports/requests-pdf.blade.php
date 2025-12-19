<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laporan Permintaan Aset</title>
    <style>
        @page { size: A4; margin: 15mm; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 10pt;
            margin: 0;
            padding: 0;
        }
        .header { 
            text-align: center; 
            margin-bottom: 20px;
            border-bottom: 2px solid #213448;
            padding-bottom: 10px;
        }
        .header h1 { 
            margin: 0; 
            color: #213448; 
            font-size: 18pt;
        }
        .header .subtitle {
            color: #666;
            font-size: 9pt;
            margin-top: 5px;
        }
        .filters {
            background: #f8f9fa;
            padding: 8px;
            margin-bottom: 15px;
            border-radius: 4px;
            font-size: 9pt;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
        }
        th { 
            background: #213448;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 9pt;
            font-weight: 600;
        }
        td { 
            padding: 6px 8px;
            border-bottom: 1px solid #dee2e6;
            font-size: 9pt;
        }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #666;
            padding: 10px 0;
            border-top: 1px solid #dee2e6;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
        }
        .status-draft { background: #f3f4f6; color: #4b5563; }
        .status-submitted { background: #fef3c7; color: #92400e; }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .status-fulfilled { background: #dbeafe; color: #1e40af; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN PERMINTAAN ASET</h1>
        <div class="subtitle">SIAP - Sistem Informasi Aset Perusahaan</div>
    </div>

    @if(!empty($filters))
    <div class="filters">
        <strong>Filter:</strong>
        @if(isset($filters['from_date'])) Dari: {{ date('d/m/Y', strtotime($filters['from_date'])) }} | @endif
        @if(isset($filters['to_date'])) Sampai: {{ date('d/m/Y', strtotime($filters['to_date'])) }} | @endif
        @if(isset($filters['status'])) Status: {{ $filters['status'] }} | @endif
        <strong>Dicetak:</strong> {{ $generated_at }}
    </div>
    @endif

    <table>
        <thead>
            <tr>
                <th>No. Permintaan</th>
                <th>Tipe</th>
                <th>Pemohon</th>
                <th>Item</th>
                <th>Status</th>
                <th>Tgl Dibuat</th>
                <th>Disetujui Oleh</th>
            </tr>
        </thead>
        <tbody>
            @foreach($requests as $request)
            <tr>
                <td><strong>{{ $request->request_number }}</strong></td>
                <td>{{ $request->type->label() }}</td>
                <td>{{ $request->requester?->name ?? '-' }}</td>
                <td style="font-size: 8pt;">
                    @foreach($request->items as $item)
                        {{ $item->category?->name }} (x{{ $item->quantity }}){{ !$loop->last ? ', ' : '' }}
                    @endforeach
                </td>
                <td>
                    <span class="status-badge status-{{ strtolower($request->status->value) }}">
                        {{ $request->status->label() }}
                    </span>
                </td>
                <td>{{ date('d/m/Y', strtotime($request->created_at)) }}</td>
                <td>
                    {{ $request->approver?->name ?? '-' }}
                    @if($request->approved_at)
                        <br><small>({{ date('d/m/Y', strtotime($request->approved_at)) }})</small>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <strong>Total Permintaan:</strong> {{ count($requests) }} | 
        Dicetak pada {{ $generated_at }} | 
        SIAP &copy; {{ date('Y') }}
    </div>
</body>
</html>
