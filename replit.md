# Lumen - AI Chat Application

## Overview

Lumen is a modern AI chat application built with React and Express that provides a conversational interface with an AI assistant. The application features real-time communication through WebSockets, voice recognition capabilities, and a memory system to maintain context across conversations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **WebSocket**: Native WebSocket server for real-time communication
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API for chat completions

## Key Components

### Database Schema
- **Users**: Basic user authentication with username/password
- **Conversations**: Chat sessions with timestamps and user association
- **Messages**: Individual messages with role (user/assistant) and content
- **Memories**: Persistent context storage with importance scoring

### AI System
- **LumenAI Service**: Custom AI personality system with configurable traits
- **Memory Integration**: Context-aware responses using stored memories
- **Voice Capabilities**: Speech recognition and text-to-speech synthesis

### Real-time Features
- **WebSocket Communication**: Live chat with typing indicators
- **Voice Recognition**: Browser-based speech-to-text input
- **Speech Synthesis**: AI response playback with voice selection

## Data Flow

1. **User Input**: Voice or text input captured through React components
2. **WebSocket Transmission**: Messages sent to Express server via WebSocket
3. **AI Processing**: OpenAI API processes input with conversation context and memories
4. **Response Generation**: AI generates contextual responses considering user history
5. **Database Storage**: Messages and derived memories stored in PostgreSQL
6. **Client Update**: Real-time response delivery and UI updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **openai**: AI chat completions
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI components

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migrations and schema management

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with hot module replacement
- **Database**: PostgreSQL with Drizzle migrations
- **Environment**: Node.js with tsx for TypeScript execution

### Production Build
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle manages schema migrations with `db:push` command
- **Environment Variables**: DATABASE_URL and OPENAI_API_KEY required

### Architecture Decisions

**Database Choice**: PostgreSQL with Drizzle ORM chosen for:
- Strong typing and schema validation
- Excellent TypeScript integration
- Reliable relational data modeling for chat history

**WebSocket Implementation**: Native WebSocket server for:
- Real-time bidirectional communication
- Lower latency than HTTP polling
- Efficient resource usage

**AI Integration**: OpenAI API with custom personality system for:
- High-quality natural language processing
- Configurable AI behavior and traits
- Memory-enhanced contextual responses

**Frontend Architecture**: React with shadcn/ui for:
- Modern component-based development
- Accessible, well-designed UI components
- Consistent design system with theming support