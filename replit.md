# BuildOrBail - App Idea Validation Platform

## Overview

BuildOrBail is a full-stack web application that provides brutally honest AI-powered feedback on app ideas. Users submit their app concepts and receive detailed analysis including strengths, weaknesses, opportunities, and actionable recommendations. The application uses Google's Gemini AI to analyze submissions and provides a scoring system with "BUILD", "BAIL", or "CAUTION" verdicts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with centralized error handling
- **Middleware**: Custom logging, JSON parsing, and error handling middleware
- **Development**: Hot module replacement via Vite integration

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless connection (@neondatabase/serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Fallback Storage**: In-memory storage implementation for development/testing
- **Session Storage**: PostgreSQL-based session storage with connect-pg-simple

### Database Schema
- **app_ideas**: Stores user-submitted app concepts with fields for name, description, target market, budget, features, and competition analysis
- **validation_results**: Stores AI analysis results linked to app ideas, including scores, verdicts, strengths, weaknesses, opportunities, detailed analysis, and action items

## Key Components

### AI Integration
- **Provider**: Google Gemini AI via @google/genai
- **Service**: Structured prompt engineering for app idea validation
- **Analysis**: Returns scored feedback (1-10) with categorical verdict system
- **Output Format**: JSON-structured responses with arrays for strengths, weaknesses, opportunities, and action items

### Form System
- **Validation**: Zod schemas with runtime type checking
- **UI Components**: Controlled form inputs with error handling
- **Required Fields**: App name, description, target market
- **Optional Fields**: User name, budget, features, competition analysis
- **Terms Agreement**: Required checkbox for "brutally honest feedback" consent

### Results Display
- **Dynamic Styling**: Color-coded verdicts (green for BUILD, red for BAIL, amber for CAUTION)
- **Structured Layout**: Organized sections for different types of feedback
- **Score Visualization**: Visual representation of 1-10 scoring system
- **Action Items**: Bulleted list of recommended next steps

## Data Flow

1. **User Input**: Form submission with app idea details and validation
2. **Data Processing**: Server-side validation using Zod schemas
3. **AI Analysis**: Gemini API call with structured prompts
4. **Data Storage**: Concurrent storage of app idea and validation results
5. **Response Delivery**: Combined result object returned to client
6. **UI Update**: Dynamic rendering of results with smooth scrolling

## External Dependencies

### Core Dependencies
- **@google/genai**: AI analysis integration
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Database ORM with type safety
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **zod**: Runtime schema validation

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Development tooling

## Deployment Strategy

### Build Process
- **Client**: Vite builds React application to `dist/public`
- **Server**: esbuild bundles Express server to `dist/index.js`
- **Assets**: Static file serving in production mode
- **Environment**: NODE_ENV-based configuration switching

### Environment Configuration
- **Development**: Vite dev server with HMR and runtime error overlay
- **Production**: Express serves static files and API routes
- **Database**: Environment variable-based connection string
- **AI Service**: API key configuration via environment variables

### Monorepo Structure
- **Shared**: Common schemas and types used by both client and server
- **Client**: React application with UI components and pages
- **Server**: Express API with services and storage abstraction
- **Root**: Configuration files and build scripts

The application is designed for deployment on platforms like Replit, with automatic database provisioning and environment variable management. The storage layer uses an abstraction pattern that allows switching between in-memory and PostgreSQL storage based on environment configuration.

## Recent Changes

### January 31, 2025 - Brutal Analysis Integration
- **Brutal Theme**: Completely redesigned interface with dark theme, red accents, and intimidating language
- **New API Endpoint**: Added `/api/analyze` endpoint with enhanced Gemini AI integration using exact user-specified prompt template
- **Enhanced Analysis**: Structured brutal feedback with specific scores for Market Reality, Competition Analysis, Technical Feasibility, and Monetization Reality
- **Fatal Flaws Detection**: AI now identifies specific fatal flaws and provides accurate time-saved estimates
- **Loading Messages**: Added rotating brutal messages during analysis ("Crushing your dreams...", "Finding fatal flaws...")
- **UI Overhaul**: Transformed from polite validation to harsh truth-telling with "DESTROY MY IDEA" button and brutal placeholders
- **Verdict System**: Simplified to BUILD/BAIL only (removed CAUTION) for more decisive feedback