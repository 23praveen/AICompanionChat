// This script starts the local server using SQLite configuration
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory for SQLite database');
}

// Check if .env file exists, if not create it with default values
const envPath = join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# Local SQLite Configuration
SESSION_SECRET=ai-chat-local-secret-key
# API Keys
NVIDIA_API_KEY=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
GOOGLE_API_KEY=AIzaSyBBocaqzNh8F4a4u2zqihJf0ygUI-Kr3Vs
`;
  fs.writeFileSync(envPath, envContent);
  console.log('Created .env file with default configuration');
}

console.log('Starting server with SQLite configuration...');

// Start the server using the SQLite configuration
const server = spawn('node', ['--import=tsx', 'server/index.sqlite.ts'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});