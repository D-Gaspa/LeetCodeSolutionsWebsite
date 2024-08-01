# LeetCode Solutions Website

## 1. Project Overview

Web application for managing and displaying LeetCode-style programming problems and their solutions.

- **Goals and objectives:**
   - Provide a platform for documenting detailed solutions to programming challenges
   - Offer an intuitive interface for problem management and solution creation
   - Enhance learning through interactive, visual explanations of algorithms
- **Target audience:** Programming students, coding interview preparation candidates, algorithm enthusiasts

## 2. Features and Functionality

1. **Problem Management:**
   - Create, read, update, and delete programming problems
   - Support for both daily and weekly problems
   - Rich content editing for problem descriptions (markdown, LaTeX, images)

2. **Solution Management:**
   - Multiple solution approaches per problem
   - Code snippet support with syntax highlighting
   - Detailed explanations with Markdown and LaTeX support

3. **Solution Examples:**
   - Interactive step-by-step visualization with images that change as the algorithm progresses
   - Carousel-like interface for algorithm steps navigation
   - Dynamic image placement for optimal layout
   - Image updates as the explanation progresses
   - Multi-image support for detailed explanations

4. **Advanced Editor:**
   - Custom MarkdownEditor with live preview
   - LaTeX rendering for mathematical equations
   - Image upload and management within the editor
   - Code syntax highlighting

5. **Image Handling:**
   - Upload, delete, and rename images
   - Image gallery for easy insertion into content

6. **User Interface:**
   - Responsive design for various screen sizes
   - Interactive problem list with filtering and pagination
   - Split-view editing for simultaneous editing and preview

7. **Authentication and Authorization:**
   - Secure admin access for content management

8. **Notification System:**
   - Dynamic, real-time notifications for user feedback
   - Support for different notification types (success, error, warning, loading)

9. **Search and Filter:**
   - Search functionality for problems
   - Filter problems by difficulty, type, and date

10. **Database Integration:**
   - Efficient data storage and retrieval using Supabase
   - Real-time data synchronization

## Setup

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev` to start the development server