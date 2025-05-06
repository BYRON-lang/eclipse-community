# Eclipse Chat Nexus

Eclipse Chat Nexus is a modern real-time chat application built with React, Firebase, and TypeScript. It offers a comprehensive suite of communication features including direct messaging, group chats, communities, and voice communication.

## Features

- **Real-time Chat**: Instant messaging with real-time updates
- **Authentication**: Secure user authentication with email/password and Google sign-in
- **Group Chats**: Create and manage group conversations
- **Communities**: Join and participate in community discussions
- **Voice Communication**: Real-time voice chat capabilities
- **Profile Management**: Customizable user profiles with avatars and settings
- **Ghost Mode**: Temporary invisibility feature with customizable timer
- **Responsive Design**: Mobile-first approach ensuring great experience across all devices

## Tech Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Authentication & Backend**: Firebase
  - Firebase Authentication
  - Cloud Firestore
  - Realtime Database
  - Cloud Storage
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/eclipse-chat-nexus.git
cd eclipse-chat-nexus
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
VITE_FIREBASE_DATABASE_URL="your-database-url"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
src/
├── assets/        # Static assets
├── components/    # Reusable UI components
├── contexts/      # React context providers
├── hooks/         # Custom React hooks
├── lib/           # Library configurations
├── pages/         # Application pages/routes
├── services/      # API and service layer
└── utils/         # Utility functions
```

## Security

- End-to-end encryption for messages
- Secure authentication flow
- Environment variables for sensitive data
- Firebase security rules implementation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.