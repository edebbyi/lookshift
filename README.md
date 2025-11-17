# LookShift

LookShift is an AI-powered fashion visualization tool that allows users to see how clothing looks on different body sizes. Upload fashion images and instantly preview them on XS, M, and XL body types using advanced AI image generation.

## ✨ Features

- **Multi-Size Preview**: Transform clothing on XS, M, and XL body types
- **Batch Processing**: Upload up to 6 looks and generate all at once
- **Real-time Generation**: Watch your looks transform with live status updates  
- **High-Quality Output**: Professional fashion retouching powered by Google's Gemini AI
- **Download & Share**: Save generated images in high resolution
- **Responsive Design**: Beautiful glass-morphism UI that works on all devices
- **User Authentication**: Secure user accounts with Supabase Auth

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI**: Google Gemini API for image generation
- **Deployment**: Optimized for modern hosting platforms

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/edebbyi/lookshift.git
   cd lookshift
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Add your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📱 How to Use

1. **Sign Up/Login**: Create an account or sign in with existing credentials
2. **Upload Images**: Drag and drop fashion photos (up to 6 at once)
3. **Select Body Type**: Choose XS, M, or XL size to preview
4. **Generate Looks**: Click "Generate Looks" to transform all images
5. **Download Results**: Save individual images or regenerate specific looks

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, dialogs, etc.)
│   ├── BackgroundBlobs.tsx
│   ├── BodyTypeSelector.tsx
│   ├── GenerateButton.tsx
│   ├── PreviewCard.tsx
│   └── ...
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Main app interface
│   ├── Login.tsx
│   └── SignUp.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── utils/              # Utility functions
│   └── supabase/       # Supabase integration
└── styles/             # Global styles
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Set up authentication providers
3. Deploy the Edge Functions from `supabase/functions/`
4. Add your project URL and anon key to environment variables

### Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The `dist` folder will contain the production-ready files.

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel  
3. Add environment variables
4. Deploy!

### Deploy to Netlify

1. Run `npm run build`
2. Drag the `dist` folder to Netlify
3. Configure environment variables
4. Set up continuous deployment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Deborah Imafidon** - [@edebbyi](https://github.com/edebbyi)

Built as a Nano Bonana demo project.

## 🙏 Acknowledgments

- Original design inspired by [Figma Community](https://www.figma.com/design/As4LLbPFKglBpgJhYrt29C/LookShift)
- UI components powered by [Radix UI](https://radix-ui.com/)
- AI image generation by [Google Gemini](https://deepmind.google/technologies/gemini/)
- Backend infrastructure by [Supabase](https://supabase.com/)

---

⭐ **If you like this project, please give it a star!** ⭐
