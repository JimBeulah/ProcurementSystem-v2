<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Document')</title>
    <style>
        @page {
            margin: 100px 50px;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.5;
        }

        header {
            position: fixed;
            top: -60px;
            left: 0px;
            right: 0px;
            height: 50px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }

        footer {
            position: fixed;
            bottom: -60px;
            left: 0px;
            right: 0px;
            height: 50px;
            text-align: right;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            font-size: 10px;
            color: #666;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            float: left;
        }

        .header-text {
            float: right;
            text-align: right;
        }

        .title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
            text-transform: uppercase;
        }

        .clear {
            clear: both;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        table,
        th,
        td {
            border: 1px solid #ddd;
        }

        th,
        td {
            padding: 8px;
            text-align: left;
        }

        th {
            background-color: #f4f4f4;
            font-weight: bold;
        }

        .signatures {
            margin-top: 50px;
            width: 100%;
            page-break-inside: avoid;
        }

        .signature-box {
            width: 30%;
            float: left;
            margin-right: 3%;
        }

        .signature-box:last-child {
            margin-right: 0;
        }

        .signature-line {
            border-bottom: 1px solid #000;
            margin-top: 40px;
            margin-bottom: 5px;
            height: 30px;
        }

        .signature-status {
            font-size: 10px;
            color: #28a745;
            /* Success green */
            text-align: center;
            font-weight: bold;
            display: block;
            margin-top: -20px;
            /* Pull it up into the signature line area */
            background: white;
            /* to cut through the line if needed, but DomPDF might not support background perfectly here, better just place it on the line */
            position: relative;
        }

        .page-number:before {
            content: "Page " counter(page);
        }

        .watermark {
            position: fixed;
            top: 30%;
            left: 0;
            width: 100%;
            z-index: -1000;
            opacity: 0.08;
            font-size: 100px;
            color: #dc2626;
            /* Deep red for official stamp look */
            text-align: center;
            font-weight: 900;
            text-transform: uppercase;
            transform: rotate(-35deg);
        }
    </style>
    @stack('styles')
</head>

<body>
    @yield('watermark')
    <header>
        <div class="logo">PROCUREMENT SYSTEM</div>
        <div class="header-text">
            Official Document<br>
            Generated on: {{ date('Y-m-d H:i') }}
        </div>
        <div class="clear"></div>
    </header>

    <footer>
        <span class="page-number"></span>
    </footer>

    <main>
        @yield('content')
    </main>
</body>

</html>