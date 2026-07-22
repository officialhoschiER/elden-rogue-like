$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$port = if ($env:PORT) { [int]$env:PORT } else { 8123 }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"
$mime = @{
  ".html"="text/html"; ".js"="application/javascript"; ".css"="text/css";
  ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".webp"="image/webp";
  ".avif"="image/avif"; ".gif"="image/gif"; ".ttf"="font/ttf"; ".otf"="font/otf";
  ".json"="application/json"; ".ico"="image/x-icon";
  ".mp3"="audio/mpeg"; ".ogg"="audio/ogg"; ".wav"="audio/wav"; ".m4a"="audio/mp4"; ".svg"="image/svg+xml"; ".txt"="text/plain"
}
while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrEmpty($rel)) { $rel = "index.html" }
    $path = Join-Path $root $rel
    if (Test-Path $path -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] }
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch {}
  finally { try { $ctx.Response.OutputStream.Close() } catch {} }
}
