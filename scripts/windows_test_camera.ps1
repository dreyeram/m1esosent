Write-Host "========================================================"
Write-Host "   Windows GStreamer Dev Camera Start                   "
Write-Host "========================================================"
Write-Host "This simulates the Raspberry Pi zero-latency hardware"
Write-Host "video sink by opening a direct Windows GStreamer window."
Write-Host ""
Write-Host "INSTRUCTIONS:"
Write-Host "1. A 'Direct3D11' or 'ActiveMovie' window will pop up."
Write-Host "2. Drag it to cover the left 70% of your screen."
Write-Host "3. Make sure your browser is placed OVER it."
Write-Host "4. The camera will show through the transparent UI hole!"
Write-Host ""
Write-Host "Press Ctrl+C to stop."
Write-Host "========================================================"

# Use Windows Media Foundation source to grab the first USB webcam
gst-launch-1.0 mfvideosrc ! videoconvert ! videoscale ! video/x-raw,width=1280,height=720 ! d3d11videosink force-aspect-ratio=true
