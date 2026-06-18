export function exportCanvasAsPNG(Graph) {
  // Get the WebGL canvas
  const canvas = document.querySelector('#graph-container canvas');
  if (!canvas) {
    alert('Could not find 3D canvas to export.');
    return;
  }

  // Create a temporary canvas to composite the watermark
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');

  // Fill background with dark theme color so it's not transparent
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Draw the WebGL canvas content onto our export canvas
  // Because we set preserveDrawingBuffer: true, the canvas natively holds the 
  // exact Bloom post-processing frame! No need to manually trigger .render()
  ctx.drawImage(canvas, 0, 0);

  // Add the "Software MRI" Branding / Watermark
  ctx.save();
  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  
  const text = 'Scanned with Software MRI';
  const textWidth = ctx.measureText(text).width;
  
  // Bottom Right corner
  ctx.fillText(text, exportCanvas.width - textWidth - 40, exportCanvas.height - 40);
  
  // Add subtext
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  const subText = 'software-mri.com';
  const subTextWidth = ctx.measureText(subText).width;
  ctx.fillText(subText, exportCanvas.width - subTextWidth - 40, exportCanvas.height - 15);
  ctx.restore();

  // Trigger download
  exportCanvas.toBlob((blob) => {
    if (!blob) {
      alert('Failed to export image.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `software-mri-scan-${new Date().toISOString().slice(0,10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
