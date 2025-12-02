// Uses qrcode npm package for encoding product information

export interface QRCodeData {
  id: string
  name: string
  sku: string
  category: string
}

// Simple QR code generation using qrcode library
// In production, integrate with a QR code library like 'qrcode' npm package
export async function generateQRCode(data: QRCodeData): Promise<string> {
  // Format data as JSON string to encode in QR
  const qrContent = JSON.stringify({
    id: data.id,
    sku: data.sku,
    name: data.name,
    cat: data.category,
    ts: Date.now(),
  })

  // In real implementation, use: import QRCode from 'qrcode'
  // return await QRCode.toDataURL(qrContent)

  // For now, return a placeholder that would be replaced with actual QR generation
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`
}

export function downloadQRCode(qrDataUrl: string, fileName: string): void {
  const link = document.createElement("a")
  link.href = qrDataUrl
  link.download = `${fileName}-qr-code.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printQRCode(qrDataUrl: string, productName: string): void {
  const printWindow = window.open("", "", "width=400,height=500")
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${productName}</title>
          <style>
            body { margin: 20px; text-align: center; font-family: Arial; }
            img { max-width: 300px; margin: 20px auto; }
            h2 { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h2>${productName}</h2>
          <img src="${qrDataUrl}" alt="QR Code" />
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }
}
