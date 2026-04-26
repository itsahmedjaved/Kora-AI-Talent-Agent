export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
    const parsed = await pdfParse(buffer)

    return Response.json({
      text: parsed.text,
      pages: parsed.numpages,
      filename: file.name
    })

  } catch (err) {
    console.error('Upload error:', err)
    return Response.json({ error: 'Could not parse PDF. Make sure it is a text-based PDF.' }, { status: 500 })
  }
}
