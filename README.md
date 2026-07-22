# Meeting Notes Summarizer

A professional web application that transforms meeting transcripts into organized, structured notes using AI. Supports both business and education templates with multiple input methods and export options.

## Features

### Input Methods
- **Paste Transcript**: Directly paste meeting transcripts into a text box
- **Live Recording**: Record audio through your browser microphone with real-time transcription (uses Web Speech API)
- **Upload Audio**: Upload pre-recorded audio files (note: requires manual transcription - see limitations below)

### Templates
- **Business Template**: Ideal for client meetings and internal team meetings
  - Executive summary
  - Key discussion points
  - Decisions made
  - Action items (with owner, task, deadline)
  - Next steps
  - Client follow-ups

- **Education Template**: Designed for lectures and class sessions
  - Session overview
  - Key concepts covered
  - Important points
  - Questions raised
  - Assignments (with task and deadline)
  - Preparation for next session

### Export Options
- Copy to clipboard
- Download as plain text (.txt)
- Download as Word document (.docx)
- Download as PDF

### Additional Features
- Optional fields for meeting title, date, and attendees
- Loading states during note generation
- Graceful error handling
- Fully responsive design (desktop and mobile)
- Clean, professional UI

## Limitations

### Audio File Transcription
Direct transcription of uploaded audio files requires a paid speech-to-text API (e.g., OpenAI Whisper). To avoid API costs, this app uses the browser's built-in Web Speech API, which does not support file transcription. 

**Recommended alternatives:**
- Use the "Live Recording" feature to transcribe audio in real-time
- Use your meeting platform's built-in transcription feature and paste the transcript
- Use a dedicated transcription service and paste the resulting transcript

### Browser Compatibility
- **Live Recording** works best in Google Chrome and Microsoft Edge (Web Speech API support)
- Other browsers may have limited or no support for speech recognition

## Setup Instructions

### Prerequisites
- Node.js and npm installed on your machine
- A Groq API key from [Groq Console](https://console.groq.com/keys)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` (if not already done)
   - Add your Groq API key to the `.env` file:
     ```
     GROQ_API_KEY=your_actual_api_key_here
     ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3001` (or the port shown in your terminal)

### Getting a Groq API Key

1. Go to [Groq Console](https://console.groq.com/keys)
2. Sign in or create an account
3. Click "Create API Key"
4. Copy your API key
5. Add it to your `.env` file in the project root

**Security Note:** The API key is stored server-side in the `.env` file and is never exposed to the frontend. This ensures your API key remains confidential.

## Usage

1. **Start the server** (if not already running)
2. **Open the app** in your browser at `http://localhost:3001`
3. **Fill in meeting details** (title, date, attendees - all optional)
4. **Select a template** (Business or Education)
5. **Choose an input method:**
   - Paste a transcript directly
   - Record live audio
   - Upload an audio file (with transcription notice)
6. **Click "Generate Notes"**
7. **Review and export** your notes in your preferred format

## Project Structure

```
meeting-notes-summarizer/
├── index.html          # Main HTML structure
├── styles.css          # Responsive CSS styling
├── app.js              # Frontend application logic
├── server.js           # Backend server with Groq API integration
├── package.json        # Dependencies and scripts
├── .env.example        # Example environment variables
├── .env                # Your API key (not in version control)
└── README.md           # This file
```

## Dependencies

- `express` - Backend web server
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `groq-sdk` - Groq AI API integration
- `docx` - Word document generation (frontend)
- `html2pdf.js` - PDF export functionality (frontend)

## Privacy & Security

- Your API key is stored server-side in the `.env` file and is never exposed to the frontend
- The `.env` file should never be committed to version control
- Transcripts are sent to the backend server, which then communicates with Groq AI
- No data is stored on any external servers except during API calls to Groq
- Audio recording is processed locally in your browser

## Browser Support

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Limited support (live recording may not work)
- **Safari**: Limited support (live recording may not work)

## Troubleshooting

**"Speech recognition error" message:**
- Ensure you're using Chrome or Edge
- Check that your microphone is enabled and not blocked by the browser
- Grant microphone permissions when prompted

**"Failed to generate notes" error:**
- Verify your Groq API key is correctly set in the `.env` file
- Ensure the backend server is running
- Check your internet connection
- Ensure you have a valid transcript
- Check the server console for detailed error messages

**Export not working:**
- Check browser console for errors
- Ensure all dependencies are installed
- Try a different browser if issues persist

## License

MIT

## Future Enhancements

Potential improvements for future versions:
- Integration with paid speech-to-text APIs for file transcription
- Support for more templates
- Cloud storage integration
- Collaboration features
- Multi-language support
