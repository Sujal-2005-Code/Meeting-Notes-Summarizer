require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Setup multer for file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit


// Generate notes endpoint
app.post('/api/generate-notes', async (req, res) => {
    try {
        const { transcript, template, title, date, attendees } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: 'Groq API key not configured on server' });
        }

        console.log('Generating notes with template:', template);
        
        const prompt = generatePrompt(transcript, template, title, date, attendees);

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 4096,
        });

        const text = chatCompletion.choices[0]?.message?.content || '';
        
        console.log('Notes generated successfully');
        res.json({ notes: text });

    } catch (error) {
        console.error('Error generating notes:', error);
        res.status(500).json({ 
            error: 'Failed to generate notes', 
            details: error.message 
        });
    }
});

// ── Email Summarizer Endpoint ─────────────────────────────
app.post('/api/summarize-email', async (req, res) => {
    try {
        const { thread, subject, participants } = req.body;

        if (!thread) {
            return res.status(400).json({ error: 'Email thread is required' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: 'Groq API key not configured on server' });
        }

        console.log('Summarizing email thread:', subject);
        
        const prompt = `You are a professional assistant summarizing an email thread.
        
IMPORTANT RULES:
- Only include information present in the email thread
- Be highly concise
- Extract key action items with their owners

Email Context:
- Subject: ${subject || 'Not specified'}
- Participants: ${participants || 'Not specified'}

Email Thread:
${thread}

Format the output exactly like this:
EXECUTIVE SUMMARY
[2-3 sentence overview of the email thread]

KEY POINTS
- [Point 1]
- [Point 2]

ACTION ITEMS
- [Owner]: [Task] - [Deadline if any]
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 2048,
        });

        res.json({ summary: chatCompletion.choices[0]?.message?.content || '' });
    } catch (error) {
        console.error('Error summarizing email:', error);
        res.status(500).json({ error: 'Failed to summarize email', details: error.message });
    }
});

// ── Document Analyzer Endpoint ─────────────────────────────
app.post('/api/analyze-document', upload.single('document'), async (req, res) => {
    try {
        const { analysisType, pastedText } = req.body;
        let documentText = pastedText || '';

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: 'Groq API key not configured on server' });
        }

        // Process uploaded file if it exists
        if (req.file) {
            console.log('Processing file:', req.file.originalname, req.file.mimetype);
            if (req.file.mimetype === 'application/pdf') {
                const pdfData = await pdfParse(req.file.buffer);
                documentText = pdfData.text;
            } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ buffer: req.file.buffer });
                documentText = result.value;
            } else if (req.file.mimetype === 'text/plain') {
                documentText = req.file.buffer.toString('utf8');
            } else {
                return res.status(400).json({ error: 'Unsupported file format. Please upload PDF, DOCX, or TXT.' });
            }
        }

        if (!documentText.trim()) {
            return res.status(400).json({ error: 'No text found to analyze. Please upload a valid document or paste text.' });
        }

        // Basic safeguard: truncate very large documents to ~20000 characters to prevent token limits
        if (documentText.length > 20000) {
            documentText = documentText.substring(0, 20000) + '... [DOCUMENT TRUNCATED DUE TO LENGTH LIMITS]';
        }

        console.log('Analyzing document. Type:', analysisType);

        let systemPrompt = '';
        if (analysisType === 'summary') {
            systemPrompt = 'Provide a comprehensive 3-4 paragraph executive summary of the document. Then, list the 5 most important facts or insights.';
        } else if (analysisType === 'entities') {
            systemPrompt = 'Extract all key entities from the document. Format as lists: \n1. PEOPLE\n2. ORGANIZATIONS\n3. LOCATIONS\n4. DATES/EVENTS\n5. KEY TERMINOLOGY';
        } else if (analysisType === 'action') {
            systemPrompt = 'Extract all implied or explicit action items, decisions, and next steps from this document. If none exist, state that clearly.';
        } else {
            systemPrompt = 'Provide a detailed structural breakdown of the document, summarizing the core topic of each section.';
        }

        const prompt = `You are a professional document analyst.
Task: ${systemPrompt}

Document Text:
${documentText}
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            max_tokens: 4096,
        });

        res.json({ analysis: chatCompletion.choices[0]?.message?.content || '' });
    } catch (error) {
        console.error('Error analyzing document:', error);
        res.status(500).json({ error: 'Failed to analyze document', details: error.message });
    }
});

function generatePrompt(transcript, template, title, date, attendees) {
    const basePrompt = `You are a professional meeting notes summarizer. Your task is to create well-structured, organized notes from the following transcript.

IMPORTANT RULES:
- Only include information that is actually present in the transcript
- Never invent names, numbers, dates, deadlines, or any other details
- Use "Not specified" for any information that is unclear or not mentioned in the transcript
- Keep the executive summary/overview to exactly 2-3 sentences
- Format the output as clean, readable text with clear section headers

Meeting Details:
- Title: ${title}
- Date: ${date}
- Attendees/Participants: ${attendees}

Transcript:
${transcript}

`;

    if (template === 'business') {
        return basePrompt + `Format the output using the following Business template structure:

MEETING NOTES
Title: ${title}
Date: ${date}
Attendees: ${attendees}

EXECUTIVE SUMMARY
[2-3 sentence summary of the meeting]

KEY DISCUSSION POINTS
- [Point 1]
- [Point 2]
- [etc.]

DECISIONS MADE
- [Decision 1]
- [Decision 2]
- [etc.]

ACTION ITEMS
For each action item, include:
- Owner: [Name or "Not specified"]
- Task: [Description]
- Deadline: [Date or "Not specified"]

NEXT STEPS
- [Step 1]
- [Step 2]
- [etc.]

CLIENT FOLLOW-UPS
[Only include this section if client-related discussions occurred]
- [Follow-up 1]
- [etc.]`;
    } else {
        return basePrompt + `Format the output using the following Education template structure:

SESSION NOTES
Title/Topic: ${title}
Date: ${date}
Participants: ${attendees}

OVERVIEW
[2-3 sentence overview of the session]

KEY CONCEPTS COVERED
- [Concept 1]
- [Concept 2]
- [etc.]

IMPORTANT POINTS
- [Point 1]
- [Point 2]
- [etc.]

QUESTIONS RAISED
- [Question 1]
- [Question 2]
- [etc.]

ASSIGNMENTS
For each assignment, include:
- Task: [Description]
- Deadline: [Date or "Not specified"]

PREPARATION FOR NEXT SESSION
- [Item 1]
- [Item 2]
- [etc.]`;
    }
}

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('Make sure to set GROQ_API_KEY in your .env file');
    });
}

module.exports = app;
