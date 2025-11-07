# Exam Report Dashboard

A lightweight web application that connects to Google Sheets to display student test results, scores, accuracy, and rankings. No database required - all data lives in Google Sheets.

## Features

- 🔍 **Roll Number Search**: Enter your roll number to view results
- 📊 **Test Selection**: Choose from available test sheets
- 📈 **Score Dashboard**: View score, accuracy, rank, and percentile
- 🏆 **Rank Calculation**: Automatic ranking based on total scores
- ❌ **Absent Detection**: Shows "Absent" message if roll number not found
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS

## Prerequisites

- Node.js 20.9.0 or higher (recommended)
- A Google Cloud Project with Sheets API enabled
- A Google Service Account with read access to your spreadsheet
- A Google Spreadsheet with test data

## Setup Instructions

### 1. Clone and Install

```bash
cd examreportdash
npm install
```

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 3. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Give it a name (e.g., "exam-report-service")
4. Click "Create and Continue"
5. Skip role assignment (optional)
6. Click "Done"

### 4. Generate Service Account Key

1. Click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file

### 5. Share Spreadsheet with Service Account

1. Open your Google Spreadsheet
2. Click "Share" button
3. Add the service account email (found in the JSON file as `client_email`)
4. Give it "Viewer" access (read-only)
5. Click "Send"

### 6. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in the values:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: The `client_email` from your JSON file
   - `GOOGLE_PRIVATE_KEY`: The `private_key` from your JSON file (keep the `\n` characters)
   - `GOOGLE_SPREADSHEET_ID`: Extract from your spreadsheet URL
     - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
     - Copy the `SPREADSHEET_ID` part

### 7. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Google Sheets Format

Your spreadsheet should follow this structure:

- **Row 1**: Column headers (e.g., "Roll Number", "Name", "Total Score", "Accuracy", etc.)
- **Column A**: Roll numbers (e.g., "OPEN183@user" or "OPEN183")
- **Each tab**: Represents a different test (e.g., "Mock 1", "Mock 2")

Example structure:
```
| Roll Number    | Name      | Total Score | Accuracy | Attempt Status |
|---------------|-----------|-------------|----------|----------------|
| OPEN183@user  | John Doe  | 9/15       | 75%      | Completed      |
| CATKB52@user  | Jane Smith| 12/15      | 80%      | Completed      |
```

## API Endpoints

### GET `/api/sheets?action=list`
Returns all available sheet names (tests).

**Response:**
```json
{
  "sheets": ["Mock 1", "Mock 2", "Mock 3"]
}
```

### GET `/api/sheets?action=get&sheet=Mock%201&rollNumber=OPEN183`
Returns student data for the specified roll number and test.

**Response (Found):**
```json
{
  "found": true,
  "student": {
    "name": "John Doe",
    "rollNumber": "OPEN183@user",
    "score": "9/15",
    "accuracy": "75%",
    "rank": 12,
    "percentile": 90,
    "totalStudents": 120,
    "averageQPerHour": "15",
    "attemptStatus": "Completed"
  }
}
```

**Response (Not Found):**
```json
{
  "found": false,
  "message": "You were absent for this test."
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SPREADSHEET_ID`
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Google Cloud Run
- AWS Amplify

Make sure to set the environment variables in your hosting platform.

## Security Notes

- ✅ Service account has read-only access to the spreadsheet
- ✅ Credentials stored in environment variables (never commit `.env.local`)
- ✅ API routes are server-side only (credentials never exposed to client)
- ⚠️ For production, consider adding rate limiting
- ⚠️ For large datasets, consider implementing caching

## Troubleshooting

### "GOOGLE_SPREADSHEET_ID not configured"
- Make sure `.env.local` exists and contains all required variables
- Restart the dev server after adding environment variables

### "Failed to fetch data from Google Sheets"
- Verify the service account email has access to the spreadsheet
- Check that the spreadsheet ID is correct
- Ensure Google Sheets API is enabled in your Google Cloud project

### "Sheet is empty or not found"
- Verify the sheet name matches exactly (case-sensitive)
- Check that the sheet has data in it

### Roll number not found
- Check the roll number format in your sheet
- The app normalizes roll numbers (handles "OPEN183" and "OPEN183@user")

## License

MIT
