<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laporan Pergerakan Aset</title>
    <style>
        @page { size: A4 landscape; margin: 15mm; }
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
        .type-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
            background: #e0e7ff;
            color: #3730a3;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN PERGERAKAN ASET</h1>
        <div class="subtitle">SIAP - Sistem Informasi Aset Perusahaan</div>
    </div>

    @if(!empty($filters))
    <div class="filters">
        <strong>Filter:</strong>
        @if(isset($filters['from_date'])) Dari: {{ date('d/m/Y', strtotime($filters['from_date'])) }} | @endif
        @if(isset($filters['to_date'])) Sampai: {{ date('d/m/Y', strtotime($filters['to_date'])) }} | @endif
        @if(isset($filters['type'])) Tipe: {{ $filters['type'] }} | @endif
        <strong>Dicetak:</strong> {{ $generated_at }}
    </div>
    @endif

    <table>
        <thead>
            <tr>
                <th>Tanggal</th>
                <th>Asset Tag</th>
                <th>Nama Aset</th>
                <th>Tipe</th>
                <th>Dari</th>
                <th>Ke</th>
                <th>Dilakukan Oleh</th>
                <th>Catatan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($movements as $movement)
            <tr>
                <td>{{ date('d/m/Y H:i', strtotime($movement->created_at)) }}</td>
                <td><strong>{{ $movement->asset?->asset_tag ?? '-' }}</strong></td>
                <td>{{ $movement->asset?->name ?? '-' }}</td>
                <td>
                    <span class="type-badge">{{ $movement->movement_type->label() }}</span>
                </td>
                <td>{{ $movement->from_value ?? '-' }}</td>
                <td>{{ $movement->to_value ?? '-' }}</td>
                <td>{{ $movement->performer?->name ?? '-' }}</td>
                <td style="font-size: 8pt;">{{ $movement->notes ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <strong>Total Pergerakan:</strong> {{ count($movements) }} | 
        Dicetak pada {{ $generated_at }} | 
        SIAP &copy; {{ date('Y') }}
    </div>
</body>
</html>
