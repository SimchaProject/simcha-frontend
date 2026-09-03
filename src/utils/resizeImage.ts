const DEFAULT_MAX_EDGE = 640
const JPEG_QUALITY = 0.82

// Phone cameras produce 3-6MB files; the singles list shows them at about
// 90px, so the default max edge is small. Downscaling in the browser before
// upload keeps a few hundred rows of photos in Postgres from turning into
// hundreds of megabytes, and means a guest on hotel wifi isn't uploading a
// full-size original. A caller showing the image bigger (e.g. a guest-page
// hero photo) can pass a larger maxEdge.
export async function resizeImage(file: File, maxEdge = DEFAULT_MAX_EDGE): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    // If the browser won't give us a blob, sending the original beats
    // failing the upload - the server's size limit still applies.
    return blob ?? file
  } finally {
    bitmap.close()
  }
}
