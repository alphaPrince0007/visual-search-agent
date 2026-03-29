import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Zap, History, Sparkles } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Navigation */}
        <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Search className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold text-white">Visual Search Agent</h1>
            </div>
            <Button asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Find Visually Similar Images
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Instantly
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Upload any image and discover visually similar results across the web using advanced AI analysis and web search.
            </p>
            <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
              <a href={getLoginUrl()}>Get Started</a>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Sparkles className="w-8 h-8 text-blue-400 mb-2" />
                <CardTitle className="text-white">AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Advanced Gemini AI analyzes your image to understand its visual characteristics and generate accurate search descriptions.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Zap className="w-8 h-8 text-blue-400 mb-2" />
                <CardTitle className="text-white">Fast Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Get visual matches from across the web in seconds using Google Lens API integration with SerpApi.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <History className="w-8 h-8 text-blue-400 mb-2" />
                <CardTitle className="text-white">Refine & Iterate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Add text queries to refine results and narrow down your search. Track your search history for easy re-refinement.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-16">
            <h3 className="text-2xl font-bold text-white mb-8">How It Works</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold">
                  1
                </div>
                <h4 className="font-semibold text-white mb-2">Upload Image</h4>
                <p className="text-slate-300 text-sm">Drag and drop or select an image from your device</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold">
                  2
                </div>
                <h4 className="font-semibold text-white mb-2">AI Analysis</h4>
                <p className="text-slate-300 text-sm">AI analyzes the image and generates search descriptions</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold">
                  3
                </div>
                <h4 className="font-semibold text-white mb-2">Web Search</h4>
                <p className="text-slate-300 text-sm">Find visually similar images across the web</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold">
                  4
                </div>
                <h4 className="font-semibold text-white mb-2">Refine</h4>
                <p className="text-slate-300 text-sm">Add text queries to narrow down results</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
              <a href={getLoginUrl()}>Start Searching Now</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Visual Search Agent</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome, {user?.name || user?.email}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Visual Search Tool</h2>
          <p className="text-lg text-slate-600 mb-8">
            Upload an image to find visually similar results across the web
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/search")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Search className="w-5 h-5 mr-2" />
            Start Searching
          </Button>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Sparkles className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>Advanced image understanding</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Our AI analyzes your image to understand its visual characteristics and generate accurate search descriptions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Fast Results</CardTitle>
              <CardDescription>Instant web search</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Get visual matches from across the web in seconds using Google Lens API integration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <History className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Refine & Iterate</CardTitle>
              <CardDescription>Track your searches</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Add text queries to refine results and track your search history for easy re-refinement.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
