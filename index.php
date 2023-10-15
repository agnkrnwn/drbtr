
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>In-APP browser</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <script src="iconv-lite.bundle.js" charset="utf-8"></script>
    <link rel="stylesheet" href="app.css" />
</head>
<body style="max-width:640px">
<div style="padding: 8px">
<center>
<b>Halaman utama</b><br/>
</center><br/>

<p>Setelah menginstal program dan mengonfigurasi koneksi printer, program akan bekerja dengan mudah.</p>

<div id="switch">
    <a style="color:dodgerblue;text-decoration: none; border-bottom:1px dashed dodgerblue" onclick="document.getElementById('switch').style.display='none';document.getElementById('more').style.display='block';">Tentang menu dan fungsi</a>
<br/><br/>
</div>

<div id="more" style="display:none">
<b>Anda dapat dengan mudah mencetak teks dan gambar dari ponsel Anda.</b>
<p>Cari item menu "bagikan," "kirim," atau "buka" dalam aplikasi Anda, klik, dan pilih RawBT, selesai.</p>

<p><b>Menu RawBT</b></p>
<p>Alat sederhana telah ditambahkan untuk mengatur printer, dan jika Anda tidak memiliki program dengan fitur "bagikan."</p>
<ul>
    <li>Beranda - teks ini</li>
    <li>Edit - Editor sederhana</li>
    <li>Teks - Memungkinkan pencetakan dalam format UTF-8 atau pengkodean 1 byte</li>
    <li>PDF - pilihan file untuk dicetak</li>
    <li>Gambar - dengan pratinjau</li>
    <li>Pengaturan - mengonfigurasi printer</li>
</ul>

</p>
</div>
</div>


<div id="demo" style="display:none">
<header id="header" class="header">
    <div class="container">
        <div class="branding">
            Contoh Sample
            <h1 style="margin:0;padding: 0">
                <span class="text-highlight">DRIVER</span> <span class="text-bold">printer</span>
            </h1>
        </div>
    </div>
</header>
<br/>
<div style="padding: 8px">
     <fieldset><legend>Printer family</legend>
         <label><input type="radio" name="pf" checked value="GENERAL" onclick="CodePageType ='GENERAL';">Epson(General)</label>
         <label><input type="radio" name="pf" value="PT210" onclick="CodePageType = 'PT210';">Goojprt PT-210</label>
     </fieldset>

    <h2>Demo</h2>
    <button class="green" onclick="fontDemo();return false;">Font</button>
    <button class="green"  onclick="alignDemo();return false;">Align</button>
    <button class="green"  onclick="decorDemo();return false;">Decor</button>
    <button class="green"  onclick="encodingDemo();return false;">Encode</button>

    <h2>Text Tool
    <select id="lang" style="float:right" onchange="userLang=this.value">
    </select>
    </h2>
    <div style="clear:both"></div>
    <form onsubmit="return false;">
        <textarea id="demotext" rows="8" style="width:100%;box-sizing: border-box;padding: 8px"></textarea>
        <button type="reset" value="Reset">Clear</button>
        <button onclick="document.getElementById('demotext').value = loremIpsum(userLang);return false;">Lorem</button>
        <button onclick="document.getElementById('demotext').value = pangrams(userLang);return false;">Pangram</button>
        <br/>
        <fieldset><legend>Align</legend>
            <label style="width:35%;display: inline-block"><input type="radio" name="align" value="0" checked>Left</label>
            <label style="width:35%;display: inline-block"><input type="radio" name="align" value="1">Center</label>
            <label style="display: inline-block"><input type="radio" name="align" value="2">Right</label>
            <br><small style="color: grey">ESC a - select justification</small>
        </fieldset>
        <br/>
        <fieldset><legend>Font</legend>
            <label style="margin-bottom:8px;display: inline-block;width:90%"><input type="checkbox" name="font" value=1>FONT B (else font A as default)</label>
            <label style="width:45%;margin-bottom:8px;display: inline-block"><input type="checkbox" name="font" value=16>Double height</label>
            <label style="width:45%;margin-bottom:8px;display: inline-block"><input type="checkbox" name="font" value=32>Double width</label>
            <label style="width:45%;margin-bottom:8px;display: inline-block"><input type="checkbox" name="font" value=8>Empjasized</label>
            <label style="width:45%;margin-bottom:8px;display: inline-block"><input type="checkbox" name="font" value=128>Underline</label>
            <label style="width:90%;margin-bottom:8px;display: inline-block"><input type="checkbox" name="font" value=64>Italic (any printers, not all)</label>

            <br><small style="color: grey">ESC ! - select print mode</small>
        </fieldset>

        <br/>
        <button class="green" style="width:100%;margin:0" onclick="printDemoText(); return false;">Print</button>
    </form>

<br/>

    <h2>Bar Code
        <select id="bartype" style="float:right" onchange="democode(this)">
            <option value=65 data-example="036000291452">UPCA</option>
            <option value=66 data-example="1234567">UPCE</option>
            <option value=67 data-example="012345678901">JAN13</option>
            <option value=68 data-example="0123456">JAN8</option>
            <option value=69 selected  data-example="ABCZ012">CODE39</option>
            <option value=70 data-example="0123456789">ITF</option>
            <option value=71 data-example="A012$+-./:A">CODABAR</option>
            <option value=72 data-example="012.ABZ">CODE93</option>
            <option value=73 data-example="012z !.,">CODE128</option>
        </select>
    </h2>
    <div style="clear:both"></div>
    <form>
        <input id="demobarcode" style="width:100%;box-sizing: border-box;padding:8px;border:1px solid #dddddd" value="" >
        <button type="reset" value="Reset">Clear</button>
        <br/>
        <fieldset><legend>HRI</legend>
            <label style="width:35%;display: inline-block"><input type="radio" name="hri" value="0" checked>None</label>
            <label style="width:35%;display: inline-block"><input type="radio" name="hri" value="1">Above</label>
            <label style="display: inline-block"><input type="radio" name="hri" value="2">Below</label>
        </fieldset>
        <br/>
        <fieldset><legend>Size</legend>
            Height: <span id="show_h">162</span> <input id="barcode_h" type="range" min="1" max="255" value="162" style="width:255px" onchange="document.getElementById('show_h').innerText=this.value">
        </fieldset>

        <br/>
        <button class="green" style="width:100%;margin:0" onclick="printDemoBarCode(); return false;">Print</button>
    </form>


    <br/>

    <h2>QR Code
    </h2>
    <div style="clear:both"></div>
    <form>
        <textarea id="demoqrcode" style="width:100%;box-sizing: border-box;padding:8px;border:1px solid #dddddd">https://google.com</textarea>
        <br/>
        <fieldset>
            E: <select id="QR_EC" style="padding: 4px">
                <option value="0" selected>L</option>
                <option value="1">M</option>
                <option value="2">Q</option>
                <option value="3">H</option>
            </select>
            S: <select id="QR_SIZE"  style="padding: 4px">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3" selected>3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
            </select>
            M: <select id="QR_MODEL" style="padding: 4px">
                <option value="1">Model 1</option>
                <option value="2" selected>Model 2</option>
                <option value="3">Micro</option>
            </select>
        </fieldset>
        <br/>
        <button class="green" style="width:100%;margin:0" onclick="printQrCode(); return false;">Print</button>
    </form>
<br/>
</div>
</div>
<!-- <p><b>You can find additional information on the program website.</b></p>
<p style="text-align: center"><a style="font-size: 24px;color:green" href="https://rawbt.ru/">rawbt.ru</a></p>
<br>
<br> -->


<script src="app.js" charset="utf-8" async></script>
</body>
</html>
