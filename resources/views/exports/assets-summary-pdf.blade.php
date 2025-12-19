<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laporan Ringkasan Aset</title>
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
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
        }
        .status-in-stock { background: #d1fae5; color: #065f46; }
        .status-assigned { background: #dbeafe; color: #1e40af; }
        .status-in-repair { background: #fef3c7; color: #92400e; }
        .status-retired { background: #f3f4f6; color: #4b5563; }
        .status-lost { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN RINGKASAN ASET</h1>
        <div class="subtitle">SIAP - Sistem Informasi Aset Perusahaan</div>
    </div>

    @if(!empty($filters))
    <div class="filters">
        <strong>Filter:</strong>
        @if(isset($filters['category_id'])) Kategori: {{ $filters['category_id'] }} | @endif
        @if(isset($filters['location_id'])) Lokasi: {{ $filters['location_id'] }} | @endif
        @if(isset($filters['status'])) Status: {{ $filters['status'] }} | @endif
        <strong>Dicetak:</strong> {{ $generated_at }}
    </div>
    @endif

    <table>
        <thead>
            <tr>
                <th>Asset Tag</th>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Status</th>
                <th>Pemegang</th>
                <th>Lokasi</th>
                <th>Harga (Rp)</th>
                <th>Tgl Beli</th>
            </tr>
        </thead>
        <tbody>
            @foreach($assets as $asset)
            <tr>
                <td><strong>{{ $asset->asset_tag }}</strong></td>
                <td>{{ $asset->name }}</td>
                <td>{{ $asset->category?->name ?? '-' }}</td>
                <td>
                    <span class="status-badge status-{{ strtolower(str_replace('_', '-', $asset->status->value)) }}">
                        {{ $asset->status->label() }}
                    </span>
                </td>
                <td>{{ $asset->currentUser?->name ?? '-' }}</td>
                <td>{{ $asset->currentLocation?->name ?? '-' }}</td>
                <td style="text-align: right;">
                    {{ $asset->purchase_price ? number_format($asset->purchase_price, 0, ',', '.') : '-' }}
                </td>
                <td>{{ $asset->purchase_date ? date('d/m/Y', strtotime($asset->purchase_date)) : '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <strong>Total Aset:</strong> {{ count($assets) }} | 
        Dicetak pada {{ $generated_at }} | 
        SIAP &copy; {{ date('Y') }}
    </div>
</body>
</html>
