require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure to set GROQ_API_KEY in your .env file');
});
