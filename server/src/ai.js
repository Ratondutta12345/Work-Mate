import process from 'node:process'
import { Buffer } from 'node:buffer'
import { GoogleGenAI } from '@google/genai'
import { config } from './config.js'

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
const FALLBACK_GEMINI_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite'
const CLIPDROP_API_BASE = 'https://clipdrop-api.co'

function getApiKey() {
  return (config.geminiApiKey || '').trim()
}

function getArticleWordRange(filterName) {
  const map = {
    '100-200 words': { min: 100, max: 200, label: '100-200 word' },
    '400-600 words': { min: 400, max: 600, label: '400-600 word' },
    '800-1000 words': { min: 800, max: 1000, label: '800-1000 word' },
  }

  return map[filterName] || { min: 400, max: 600, label: '400-600 word' }
}

function getTitleCount(filterName) {
  const map = {
    '5 titles': 5,
    '8 titles': 8,
    '12 titles': 12,
  }

  return map[filterName] || 8
}

function normalizeOptions(options = {}) {
  return {
    filter: options.filter || options.wordRange || options.imageType || options.titleCount || '',
    imageType: options.imageType || options.filter || 'Realistic',
    fileType: options.fileType || 'PDF',
    files: Array.isArray(options.files)
      ? options.files.map((file) => ({
          name: file?.name || 'file',
          type: file?.type || '',
          size: file?.size || 0,
          dataUrl: file?.dataUrl || file?.base64 || file?.url || '',
        }))
      : [],
  }
}

function countWords(text = '') {
  return (text.match(/\b[\w’'-]+\b/g) || []).length
}

function sanitizeGeneratedText(text = '') {
  const s = String(text || '')
    // normalize newlines
    .replace(/\r\n/g, '\n')

  // remove literal null/undefined tokens
  let out = s.replace(/\bundefined\b/gi, '').replace(/\bnull\b/gi, '')

  // collapse excessive vertical whitespace but preserve paragraph breaks
  out = out.replace(/\n{3,}/g, '\n\n')

  // trim trailing spaces on each line and collapse multiple spaces within a line
  out = out
    .split('\n')
    .map((line) => line.replace(/\s{2,}/g, ' ').replace(/\s+$/g, ''))
    .join('\n')

  // normalize punctuation spacing (remove space before punctuation, ensure single space after when appropriate)
  out = out.replace(/\s+([.,!?;:])/g, '$1').replace(/([.,!?;:])(?=\S)/g, '$1 ')

  // ensure markdown headings have a blank line after them for reliable rendering
  out = out.replace(/^(#{2,}\s+.+)\n*/gm, '$1\n\n')

  // trim leading/trailing whitespace
  out = out.replace(/^\s+/, '').replace(/\s+$/, '')

  return out
}

function trimToWordLimit(text, maxWords) {
  const words = sanitizeGeneratedText(text).split(/\s+/)
  if (words.length <= maxWords) return sanitizeGeneratedText(text)

  const trimmed = words.slice(0, maxWords).join(' ')
  const sentenceMatch = trimmed.match(/[\s\S]*[.!?](?=\s[^.!?]*$|$)/)
  return sanitizeGeneratedText(sentenceMatch?.[0] || trimmed)
}

function finalizeArticle(text, range) {
  let finalText = sanitizeGeneratedText(text)
  if (!finalText) return finalText

  if (countWords(finalText) > range.max) {
    finalText = trimToWordLimit(finalText, range.max)
  }

  return sanitizeGeneratedText(finalText)
}

function hasArticleStructure(text = '') {
  // require a top-level markdown title and at least one H3
  return /^##\s+/m.test(text) && /(^|\n)###\s+/m.test(text)
}

function makeArticleHeading(input = '') {
  const normalized = String(input || '')
    .replace(/^write an article about\s+/i, '')
    .replace(/^write an article on\s+/i, '')
    .split(/(?:\.|;|\n)/)[0]
    .trim()

  if (!normalized) return 'A Practical Guide'

  return normalized
    .replace(/\s+/g, ' ')
    .replace(/\b(?:tone|audience|include|focus|keywords?)\s*:.*$/i, '')
    .trim() || 'A Practical Guide'
}

function buildArticlePrompt(input, range) {
  const brief = (input || '').trim() || 'this topic'

  return `You are a senior editor and long-form article writer.

Use the user's brief exactly as the content direction. If the brief includes tone, audience, SEO phrases, format preferences, examples, or a specific method for writing, follow those instructions carefully.

User brief:
"""${brief}"""

Write a polished, publication-ready article.

Rules:
- Keep the article between ${range.min} and ${range.max} words.
- Write in natural, human-sounding prose with a clear flow and elegant transitions.
- Start with a strong markdown title using ##.
- Organize the article with 3 to 5 meaningful ### subheadings.
- Start with a strong markdown title using ##.
- Organize the article with 3 to 5 meaningful ### subheadings.
- If the user has not provided a specific structure, include the following coverage as H3 subheadings (you may adapt labels slightly):
  1. Core Planning & Audience Focus
  2. Research & Content Gathering
  3. Structural Essentials
  4. Writing Technique & Formatting
  5. Editing, Optimization & Polish
- Open with an engaging introduction that frames the topic and why it matters.
- Develop each section with specific explanation, useful detail, and concrete examples where helpful.
- Prefer strong paragraphs over filler.
- Use bullet points only when they genuinely improve clarity.
- Include one markdown table only if it clearly helps the reader understand a comparison, framework, or summary.
- Avoid repetition, vague filler, generic AI phrasing, and empty motivational language.
- Avoid writing about the article itself. Just write the article.
- End with a concise conclusion that leaves the reader with a clear takeaway.
 
Return only the final article in markdown.`
}

function buildArticleRevisionPrompt(input, draft, range) {
  const brief = (input || '').trim() || 'this topic'

  return `You are a senior editor revising a draft into a stronger final article.

Original brief:
"""${brief}"""

Current draft:
"""${draft}"""

Revise the article so it feels more polished, more beautiful to read, and more useful to the audience.

Revision rules:
- Keep the final article between ${range.min} and ${range.max} words.
- Preserve the main topic and any user-provided method, tone, audience, or angle.
- Improve clarity, rhythm, paragraph flow, and section transitions.
- Remove repetition, weak filler, generic sentences, and awkward phrasing.
- Ensure the article has a ## title and 3 to 5 ### subheadings.
- Keep the tone confident, natural, and engaging.
- Include a markdown table only if it adds real value.

Return only the revised article in markdown.`
}

function buildPrompt(tool, input, options = {}) {
  const cleanedInput = (input || '').trim()
  const normalizedOptions = normalizeOptions(options)
  const fileSummary = normalizedOptions.files.length
    ? `Uploaded files: ${normalizedOptions.files.map((file) => file.name || 'file').join(', ')}`
    : ''

  if (tool.slug === 'article-writer') {
    const range = getArticleWordRange(normalizedOptions.filter)
    return buildArticlePrompt(cleanedInput, range)
  }

  if (tool.slug === 'title-generator') {
    const count = getTitleCount(normalizedOptions.filter)
    return `Generate ${count} catchy blog title options for the topic: ${cleanedInput || 'this content'}.

Return them as a numbered list with one title per line. Keep them concise, clear, and SEO-friendly. Make the titles varied in tone and easy to understand.`
  }

  if (tool.slug === 'image-generation') {
    const imageType = normalizedOptions.imageType || 'Realistic'
    return `Create a detailed image-generation prompt for: ${cleanedInput || 'a modern creative concept'}.

Style requirements:
- Image type: ${imageType}
- Focus on realistic composition, strong lighting, visual clarity, and professional finishing
- Keep the prompt detailed enough for a generator to produce a high-quality result
- Include subject, mood, background, colors, and camera style

Return only a polished prompt paragraph.`
  }

  if (tool.slug === 'background-removal') {
    return `Prepare a background removal workflow for the uploaded ${normalizedOptions.fileType || 'image'} file(s).\n\nTopic or notes: ${cleanedInput || 'Remove the background cleanly while keeping the subject intact.'}\n${fileSummary ? `\n${fileSummary}` : ''}\n\nDeliver a concise action-ready summary of the expected result, including subject preservation, edge cleanup, and final output quality.`
  }

  if (tool.slug === 'object-removal') {
    return `Prepare an object removal workflow for the uploaded ${normalizedOptions.fileType || 'image'} file(s).\n\nTopic or notes: ${cleanedInput || 'Remove unwanted objects while preserving the overall scene and natural appearance.'}\n${fileSummary ? `\n${fileSummary}` : ''}\n\nDeliver a concise action-ready summary of the cleanup goal, target object removal, and quality expectations.`
  }

  if (tool.slug === 'resume-reviewer') {
    return `Review the following resume content and give helpful feedback.\n\nResume text:\n${cleanedInput}\n${fileSummary ? `\n${fileSummary}` : ''}\n\nProvide:\n1. Top strengths\n2. Key improvements\n3. A stronger professional summary\n4. 5 impact-focused bullet points that could replace weak ones\nKeep the feedback concise, practical, and actionable.`
  }

  if (tool.slug === 'job-search-assistant') {
    return `You are an AI career assistant. The user wants better job search phrasing, role suggestions, and profile alignment.\n\nSearch query: ${cleanedInput || 'No query provided'}\nLocation: ${options.location || 'Any'}\nJob type: ${options.jobType || 'Any'}\nProfile summary: ${options.profileSummary || 'No profile available'}\n\nReturn the result as JSON only with keys: suggestions (array of 3 strings), tips (string).`
  }

  if (tool.slug === 'cover-letter-writer') {
    return `Write a concise, professional cover letter for the job below.\n\nJob title: ${options.jobTitle || 'Unknown'}\nCompany: ${options.companyName || 'Unknown'}\nJob description: ${options.jobDescription || ''}\n\nCandidate profile: ${options.profileSummary || 'No profile available'}\n\nReturn only the cover letter text in one polished paragraph. Do not include analysis.`
  }

  if (tool.slug === 'resume-extractor') {
    return `Extract structured profile data from the resume text below.\n\nResume text:\n${cleanedInput}\n\nReturn JSON only with fields: headline, summary, location, city, state, country, zipCode, desiredSalary, jobTypePreference, linkedinUrl, skills (array of objects with skillName and proficiency), education (array of objects with school, degree, fieldOfStudy, startDate, endDate, grade, description), experience (array of objects with company, title, location, startDate, endDate, isCurrent, description).`
  }

  if (tool.slug === 'ai-interview-coach') {
    return `Create an interview preparation guide in JSON only for the job and candidate below.\n\nJob title: ${options.jobTitle || 'Unknown'}\nCompany: ${options.companyName || 'Unknown'}\nJob description: ${options.jobDescription || ''}\nCandidate profile: ${options.profileSummary || 'No profile available'}\n\nReturn JSON only with keys: questions (array of 5 strings), answers (array of 5 strings), tips (string).`
  }

  return `Help with this request for ${tool.title}: ${cleanedInput}`
}

function fallbackOutput(tool, input, options = {}) {
  const normalizedOptions = normalizeOptions(options)

  if (tool.slug === 'article-writer') {
    const range = getArticleWordRange(normalizedOptions.filter)
    const heading = makeArticleHeading(input)
    const base = `## ${heading}\n\n### Why This Topic Matters\n${heading} matters because readers need clear guidance, not vague advice. A useful article should explain the idea in plain language, show why it matters in real situations, and help the audience understand what to do next.\n\n### Core Ideas\nThe strongest articles break the subject into a few central ideas instead of repeating the same point. That means defining the topic clearly, connecting it to practical decisions, and showing how a reader can apply the insight in a realistic setting.\n\n### Practical Takeaways\n- Lead with a clear point of view rather than a generic introduction.\n- Use concrete examples so the writing feels grounded and believable.\n- Keep each section focused on a distinct idea that moves the article forward.\n- End with a concise takeaway that gives the reader a useful next step.\n\n### Conclusion\nBeautiful article writing feels smooth, specific, and purposeful. When the structure is clear and the language is natural, the final piece becomes more engaging, more persuasive, and easier to remember.`
    return finalizeArticle(base, range)
  }

  if (tool.slug === 'title-generator') {
    const count = getTitleCount(normalizedOptions.filter)
    const topics = Array.from({ length: count }, (_, index) => {
      const suffixes = [
        'A Practical Guide',
        'for Smart Growth',
        'That Drives Results',
        'Blueprint for Beginners',
        'The Complete Strategy',
        'Secrets That Actually Work',
        'Made Simple',
        'in 2026',
        'with Real-world Examples',
        'for Modern Teams',
        'That Wins Attention',
        'from Start to Finish',
      ]
      return `${index + 1}. ${(input || '').trim() || 'Content'} ${suffixes[index % suffixes.length]}`
    })
    return topics.join('\n')
  }

  if (tool.slug === 'image-generation') {
    return `Prompt: ${(input || '').trim() || 'Modern product shot'} in a ${normalizedOptions.imageType || 'Realistic'} style, cinematic lighting, highly detailed composition, polished textures, balanced framing, premium visual quality, clean background, sharp focus, professional color grading.`
  }

  if (tool.slug === 'background-removal' || tool.slug === 'object-removal') {
    return `${tool.title} request prepared for ${normalizedOptions.fileType || 'PNG'} files.\n\nInput notes: ${(input || '').trim() || 'Clean up the subject with careful edge preservation and natural-looking output.'}\n\nFiles selected: ${normalizedOptions.files.length ? normalizedOptions.files.map((file) => file.name || 'file').join(', ') : 'No files chosen yet.'}`
  }

  if (tool.slug === 'resume-reviewer') {
    return `Resume review for your pasted content:\n\nStrengths\n- Clear structure and readable sections\n- Good opportunity to highlight measurable wins\n\nSuggestions\n- Lead with impact-focused bullet points\n- Tighten wording and remove filler phrases\n- Add keywords that match your target role\n\nOverall: solid foundation — polish metrics and clarity for stronger results.`
  }

  if (tool.slug === 'job-search-assistant') {
    return JSON.stringify({
      suggestions: [
        'Search for role titles that match both your skills and the industry, e.g. "AI product analyst" or "technical writer".',
        'Try remote-friendly queries or include location filters like "remote" if flexibility is important.',
        'Add relevant skills such as React, Node.js, AI, or data analysis to surface stronger matches.',
      ],
      tips: 'Use one strong keyword, one location or remote modifier, and one skill or industry term to improve results. Keep your profile headline aligned with the target role.',
    })
  }

  if (tool.slug === 'cover-letter-writer') {
    return `Dear hiring team,\n\nI am eager to apply for the ${options.jobTitle || 'open position'} at ${options.companyName || 'your company'}. With my background in ${options.profileSummary || 'relevant experience'} and my strong interest in this opportunity, I can contribute quickly to your team. I look forward to bringing proactive problem solving and clear communication to this role.\n\nThank you for your consideration.\n\nSincerely,\n[Your Name]`
  }

  if (tool.slug === 'resume-extractor') {
    return JSON.stringify({
      headline: 'Experienced professional seeking new opportunities',
      summary: 'A results-driven candidate with strong technical and communication skills.',
      location: 'Remote',
      city: 'Remote',
      state: 'Remote',
      country: 'USA',
      zipCode: '',
      desiredSalary: '',
      jobTypePreference: 'any',
      linkedinUrl: '',
      skills: [{ skillName: 'Project management', proficiency: 'advanced' }],
      education: [],
      experience: [],
    })
  }

  if (tool.slug === 'ai-interview-coach') {
    return JSON.stringify({
      questions: [
        'Tell me about a project where you solved a difficult problem.',
        'Why are you interested in this role and our company?',
        'How do you prioritize tasks when deadlines are tight?',
        'What is your experience working with relevant technologies or tools?',
        'How do you stay up to date on industry trends and learn new skills?',
      ],
      answers: [
        'I successfully solved a difficult problem by analyzing the root cause, collaborating with stakeholders, and implementing a data-driven solution that improved performance.',
        'I am excited about this role because it matches my skills and gives me the chance to contribute to a purpose-driven team.',
        'I prioritize tasks by impact, break large projects into smaller milestones, and keep communication open with stakeholders.',
        'I have worked with the required tools in past roles, and I enjoy learning new systems quickly to deliver value.',
        'I stay current through online courses, professional communities, and applying new techniques to real work.',
      ],
      tips: 'Focus on outcomes, keep answers concise, and show that you can apply your skills to the company’s goals.',
    })
  }

  return `Processed result for ${tool.title}.\n\nInput received:\n"${input || ''}"\n\nYour file is ready. Use Download to save this result.`
}

async function makeClipdropRequest(endpoint, formData) {
  const apiKey = (config.clipdropApiKey || '').trim()
  if (!apiKey) {
    throw new Error('CLIPDROP_API_KEY is missing.')
  }

  const response = await fetch(`${CLIPDROP_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Clipdrop request failed (${response.status}): ${errorText}`)
  }

  return response
}

function fileDataUrlToBlob(dataUrl) {
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp)|application\/pdf);base64,(.*)$/i)
  if (!match) {
    return null
  }

  const mime = match[1].toLowerCase()
  const base64 = match[3]
  const byteCharacters = atob(base64)
  const byteArray = new Uint8Array(byteCharacters.length)

  for (let index = 0; index < byteCharacters.length; index += 1) {
    byteArray[index] = byteCharacters.charCodeAt(index)
  }

  return new Blob([byteArray], { type: mime })
}

async function generateClipdropImage(prompt, imageType) {
  const finalPrompt = `${prompt || 'A premium modern lifestyle product shot'}\nStyle: ${imageType || 'Realistic'}`.slice(0, 1000)
  const formData = new FormData()
  formData.append('prompt', finalPrompt)

  const response = await makeClipdropRequest('/text-to-image/v1', formData)
  const contentType = response.headers.get('content-type') || 'image/png'
  const buffer = Buffer.from(await response.arrayBuffer())
  const mime = contentType.includes('jpeg') ? 'image/jpeg' : 'image/png'
  return `data:${mime};base64,${buffer.toString('base64')}`
}

function getGenerationConfig(tool, options = {}) {
  if (tool.slug === 'article-writer') {
    const range = getArticleWordRange(options.filter)
    return {
      maxOutputTokens: range.max >= 800 ? 2600 : 1800,
      temperature: 0.9,
      topP: 0.95,
    }
  }

  if (tool.slug === 'title-generator') {
    return {
      maxOutputTokens: 400,
      temperature: 1,
      topP: 0.95,
    }
  }

  if (tool.slug === 'resume-extractor') {
    return {
      maxOutputTokens: 1200,
      temperature: 0.3,
      topP: 0.95,
    }
  }

  if (tool.slug === 'cover-letter-writer') {
    return {
      maxOutputTokens: 1000,
      temperature: 0.75,
      topP: 0.9,
    }
  }

  if (tool.slug === 'ai-interview-coach') {
    return {
      maxOutputTokens: 1200,
      temperature: 0.8,
      topP: 0.9,
    }
  }

  if (tool.slug === 'job-search-assistant') {
    return {
      maxOutputTokens: 700,
      temperature: 0.65,
      topP: 0.9,
    }
  }

  return {
    maxOutputTokens: 1200,
    temperature: 0.7,
    topP: 0.9,
  }
}

function extractGeneratedText(response) {
  return response?.text?.trim() || response?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim()
}

async function generateContentWithModelFallback(ai, contents, config) {
  const models = [DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODEL].filter(
    (model, index, allModels) => model && allModels.indexOf(model) === index,
  )

  let lastError = null

  for (const model of models) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config,
      })
    } catch (error) {
      lastError = error
      console.error(`Gemini generation failed for model ${model}:`, error)

      if (error?.status && ![429, 500, 503].includes(error.status)) {
        throw error
      }
    }
  }

  throw lastError || new Error('Gemini generation failed for all configured models.')
}

export async function generateAIAssist(slug, input, options = {}) {
  const normalizedOptions = normalizeOptions(options)
  const tool = {
    slug,
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
  }
  const prompt = buildPrompt(tool, input, normalizedOptions)
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() })
    const response = await generateContentWithModelFallback(
      ai,
      prompt,
      getGenerationConfig(tool, normalizedOptions),
    )
    const text = extractGeneratedText(response)
    if (!text) {
      throw new Error('Gemini returned an empty response.')
    }
    return sanitizeGeneratedText(text)
  } catch (error) {
    console.error(`AI assist generation failed for ${slug}:`, error)
    return fallbackOutput(tool, input, normalizedOptions)
  }
}

async function applyClipdropImageEdit(endpoint, file, fallbackName = 'upload.png') {
  const fileData = file?.dataUrl || ''
  const blob = fileData ? fileDataUrlToBlob(fileData) : null
  if (!blob) {
    throw new Error('No valid uploaded file was provided.')
  }

  const formData = new FormData()
  formData.append('image_file', blob, file?.name || fallbackName)

  const response = await makeClipdropRequest(endpoint, formData)
  const contentType = response.headers.get('content-type') || 'image/png'
  const buffer = Buffer.from(await response.arrayBuffer())
  const mime = contentType.includes('jpeg') ? 'image/jpeg' : 'image/png'
  return `data:${mime};base64,${buffer.toString('base64')}`
}

export async function generateToolOutput(tool, input, options = {}) {
  const normalizedOptions = normalizeOptions(options)

  if (tool.slug === 'image-generation') {
    try {
      const prompt = buildPrompt(tool, input, normalizedOptions)
      const imageType = normalizedOptions.imageType || 'Realistic'
      return await generateClipdropImage(prompt, imageType)
    } catch (error) {
      console.error(`Clipdrop image generation failed for ${tool.slug}:`, error)
    }
  }

  if (tool.slug === 'background-removal' && normalizedOptions.files.length) {
    const file = normalizedOptions.files[0]

    try {
      return await applyClipdropImageEdit('/remove-background/v1', file, file.name || 'upload.png')
    } catch (error) {
      console.error('Clipdrop background-removal failed:', error)
    }
  }

  if (tool.slug === 'object-removal' && normalizedOptions.files.length) {
    const file = normalizedOptions.files[0]

    return `Object removal needs a mask file to be sent with the uploaded image. The current tool supports image upload, but Clipdrop cleanup requires a separate mask layer for precise object editing.\n\nSelected file: ${file.name || 'upload.png'}\n\nPlease add a mask for best results or use background removal for non-destructive cleanups.`
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    return `Gemini API key is missing.\n\nPlease add a valid Gemini API key to your .env file as GEMINI_API_KEY, GEMINI_API, or GEMINI_KEY, then restart the server.`
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await generateContentWithModelFallback(
      ai,
      buildPrompt(tool, input, normalizedOptions),
      getGenerationConfig(tool, normalizedOptions),
    )

    const text = extractGeneratedText(response)

    if (!text) {
      throw new Error('Gemini returned an empty response.')
    }

    if (tool.slug === 'article-writer') {
      const range = getArticleWordRange(normalizedOptions.filter)
      let article = finalizeArticle(text, range)

      if (countWords(article) < range.min || !hasArticleStructure(article)) {
        const revisedResponse = await generateContentWithModelFallback(
          ai,
          buildArticleRevisionPrompt(input, article, range),
          {
            ...getGenerationConfig(tool, normalizedOptions),
            temperature: 0.85,
          },
        )

        const revisedText = extractGeneratedText(revisedResponse)
        if (revisedText) {
          article = finalizeArticle(revisedText, range)
        }
      }

      return article
    }

    return sanitizeGeneratedText(text)
  } catch (error) {
    console.error(`Gemini generation failed for ${tool.slug}:`, error)
    return fallbackOutput(tool, input, normalizedOptions)
  }
}
