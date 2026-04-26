import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { resumeText, jobDescription } = await req.json()

    if (!resumeText || !jobDescription) {
      return Response.json({ error: 'Missing resumeText or jobDescription' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are Kora, an AI talent screening assistant for a software agency.

Analyze this resume against the job description below. Be specific and reference actual details from the resume.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY a valid JSON object. No markdown, no explanation, no backticks. Just raw JSON:
{
  "fitScore": <integer 0-100>,
  "topSkills": ["skill one", "skill two", "skill three"],
  "summary": "<two sentence candidate summary referencing their actual experience>",
  "questions": [
    { "num": "01", "q": "<specific interview question referencing something unique in their resume>" },
    { "num": "02", "q": "<specific interview question>" },
    { "num": "03", "q": "<specific interview question>" }
  ]
}`
        }
      ]
    })

    const raw = response.content[0].text.trim()
    const data = JSON.parse(raw)
    return Response.json(data)

  } catch (err) {
    console.error('Analyze error:', err)
    return Response.json({ error: 'Analysis failed. Check your API key and try again.' }, { status: 500 })
  }
}
