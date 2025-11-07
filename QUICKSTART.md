# Quick Start Guide

## 1. Install Dependencies
```bash
npm install
```

## 2. Set Up Google Sheets API

### Get Your Service Account Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable "Google Sheets API"
4. Create a Service Account
5. Download the JSON key file

### Share Your Spreadsheet
1. Open your Google Spreadsheet
2. Click "Share"
3. Add the service account email (from the JSON file)
4. Give it "Viewer" access

## 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - from your JSON file
- `GOOGLE_PRIVATE_KEY` - from your JSON file (keep the `\n` characters)
- `GOOGLE_SPREADSHEET_ID` - from your spreadsheet URL

## 4. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Spreadsheet Format

- **Row 1**: Headers (Roll Number, Name, Total Score, Accuracy, etc.)
- **Column A**: Roll numbers
- **Each tab**: A different test (e.g., "Mock 1", "Mock 2")

Example:
```
Roll Number    | Name      | Total Score | Accuracy
OPEN183@user   | John Doe  | 9/15       | 75%
CATKB52@user   | Jane Smith| 12/15      | 80%
```

## Troubleshooting

- **"GOOGLE_SPREADSHEET_ID not configured"**: Check your `.env.local` file
- **"Failed to fetch data"**: Verify service account has access to spreadsheet
- **Roll number not found**: Check the format matches your sheet exactly

