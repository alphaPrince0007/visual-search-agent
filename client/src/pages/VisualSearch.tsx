import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Download, Sparkles } from "lucide-react";

interface VisualMatch {
  id: number;
  imageUrl: string;
  score: number;
}

interface GeneratedImageResult {
  url: string;
  name: string;
  description: string;
  type: string;
  keywords: string[];
}

interface SearchResult {
  searchId?: number;
  imageUrl?: string;
  imageDescription?: string;
  visualMatches: VisualMatch[];
  generatedImages?: GeneratedImageResult[];
  productName?: string;
  category?: string;
  keyFeatures?: string[];
  dominantColor?: string;
  environment?: string;
}

export default function VisualSearch() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [refinementQuery, setRefinementQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const initiateSearchMutation = trpc.visualSearch.initiateSearch.useMutation();
  const refineSearchMutation = trpc.visualSearch.refineSearch.useMutation();
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadZip = async () => {
    if (!searchResult) return;
    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder("visual-search-results");

    try {
      // 1. Add original image
      if (previewUrl) {
         const response = await fetch(previewUrl);
         const blob = await response.blob();
         folder?.file("original_upload.png", blob);
      }

      // 2. Add AI Generated Variations
      if (searchResult.generatedImages) {
        searchResult.generatedImages.forEach((img, index) => {
          const data = img.url.split(",")[1];
          const fileName = `${img.name || `generated_${index + 1}`}.png`;
          folder?.file(fileName, data, { base64: true });
        });
      }

      // 3. Add Visual Matches (via proxy)
      const matchPromises = searchResult.visualMatches.map(async (match, index) => {
        try {
          const proxiedUrl = `/api/proxy/image?url=${encodeURIComponent(match.imageUrl)}`;
          const response = await fetch(proxiedUrl);
          if (!response.ok) throw new Error("Proxy failed");
          const blob = await response.blob();
          const ext = match.imageUrl.split(".").pop()?.split(/[?#]/)[0] || "jpg";
          folder?.file(`match_${index + 1}.${ext}`, blob);
        } catch (err) {
          console.warn(`Failed to download match ${index + 1}:`, err);
        }
      });

      await Promise.all(matchPromises);

      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });
      saveAs(content, `search_results_${searchResult.searchId || "export"}.zip`);
      toast.success("ZIP download started!");
    } catch (error) {
      console.error("ZIP Generation Error:", error);
      toast.error("Failed to generate ZIP");
    } finally {
      setIsZipping(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage(base64);
      setPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleSearch = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    console.log("🚀 SEARCH BUTTON CLICKED");
    setIsSearching(true);
    try {
      const base64Data = selectedImage.split(",")[1];
      const mimeType = selectedImage.split(";")[0].replace("data:", "");

      const result = await initiateSearchMutation.mutateAsync({
        imageBase64: base64Data,
        mimeType,
      });

      console.log("✅ RESULT RECEIVED:", result);

      if (result.success === true && 'data' in result && result.data) {
        const data = result.data;
        if (result.warning) {
          toast.warning(`Notice: ${result.warning}`);
        }
        
        const mappedResults: VisualMatch[] = data.visualMatches.map((res: any, index: number) => ({
          id: index,
          imageUrl: res.thumbnail || res.link || res.url || "",
          score: res.score || 0
        }));

          setSearchResult({
            searchId: data.searchId ?? undefined,
            imageUrl: data.imageUrl,
            imageDescription: data.imageDescription ?? undefined,
            visualMatches: mappedResults,
            generatedImages: data.generatedImages || [],
            productName: data.productName,
            category: data.category,
            keyFeatures: data.keyFeatures,
            dominantColor: data.dominantColor,
            environment: data.environment,
          });
        toast.success("Search completed!");
      } else if (result.success === false && 'error' in result) {
        toast.error(result.error || "Search failed");
      }
    } catch (error) {
      toast.error("Failed to perform search");
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefine = async () => {
    if (!refinementQuery.trim() || !searchResult?.searchId) {
      toast.error("Please enter a refinement query");
      return;
    }

    setIsRefining(true);
    try {
      const result = await refineSearchMutation.mutateAsync({
        searchId: searchResult.searchId,
        refinementQuery,
      });

      if (result.success === true && 'data' in result && result.data) {
        const data = result.data;
        if (result.warning) {
          toast.warning(`Notice: ${result.warning}`);
        }

        const mappedResults: VisualMatch[] = data.visualMatches.map((res: any, index: number) => ({
          id: index,
          imageUrl: res.thumbnail || res.link || res.url || "",
          score: res.score || 0
        }));

        setSearchResult((prev: SearchResult | null) => {
          if (!prev) return null;
            return {
              ...prev,
              visualMatches: mappedResults,
              generatedImages: data.generatedImages || prev.generatedImages || [],
              productName: data.productName || prev.productName,
              category: data.category || prev.category,
              keyFeatures: data.keyFeatures || prev.keyFeatures,
              dominantColor: data.dominantColor || prev.dominantColor,
              environment: data.environment || prev.environment,
            };
        });
        setRefinementQuery("");
        toast.success("Search refined!");
      } else if (result.success === false && 'error' in result) {
        toast.error(result.error || "Refinement failed");
      }
    } catch (error) {
      toast.error("Failed to refine search");
      console.error(error);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Visual Search Agent</h1>
            <p className="text-lg text-slate-600">
              Upload an image to find visually similar results across the web
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/history")}>
            View History
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
                <CardDescription>Drag and drop or click to select</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag and Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 bg-slate-50 hover:border-slate-400"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">Drag image here</p>
                  <p className="text-xs text-slate-500">or click to browse</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Preview */}
                {previewUrl && (
                  <div className="space-y-2">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-slate-200"
                    />
                    <Button
                      onClick={() => {
                        setSelectedImage(null);
                        setPreviewUrl(null);
                        setSearchResult(null);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Clear
                    </Button>
                  </div>
                )}

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  disabled={!selectedImage || isSearching}
                  className="w-full"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {searchResult && (
              <>
                {/* Image Description */}
                {searchResult.imageDescription && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Image Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {searchResult.productName && (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Product:</span>
                          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{searchResult.productName}</span>
                        </div>
                      )}
                      <p className="text-slate-700 leading-relaxed">{searchResult.imageDescription}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {searchResult.category && (
                          <div className="text-xs">
                            <span className="block text-slate-400 uppercase font-bold mb-1">Category</span>
                            <span className="text-slate-600 font-medium">{searchResult.category}</span>
                          </div>
                        )}
                        {searchResult.dominantColor && (
                          <div className="text-xs">
                            <span className="block text-slate-400 uppercase font-bold mb-1">Dominant Color</span>
                            <span className="text-slate-600 font-medium">{searchResult.dominantColor}</span>
                          </div>
                        )}
                      </div>

                      {searchResult.keyFeatures && searchResult.keyFeatures.length > 0 && (
                        <div className="mt-4">
                          <span className="block text-xs text-slate-400 uppercase font-bold mb-2">Key Features</span>
                          <div className="flex flex-wrap gap-2">
                            {searchResult.keyFeatures.map((f, i) => (
                              <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Refinement Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Refine Results</CardTitle>
                    <CardDescription>Add text to narrow down search results</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="e.g., 'red color', 'outdoor', 'modern style'"
                      value={refinementQuery}
                      onChange={(e) => setRefinementQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleRefine();
                      }}
                    />
                    <Button
                      onClick={handleRefine}
                      disabled={!refinementQuery.trim() || isRefining}
                      className="w-full"
                      variant="secondary"
                    >
                      {isRefining ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Refining...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refine Search
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Ranked Matches ({searchResult.visualMatches.length})
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2" 
                        onClick={handleDownloadZip}
                        disabled={isZipping}
                      >
                        {isZipping ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Zipping...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download All (ZIP)
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Generated Images Section */}
                    {searchResult.generatedImages && searchResult.generatedImages.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <h3 className="text-sm font-semibold text-slate-900">AI Generated Variations</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {searchResult.generatedImages.map((img, idx) => (
                            <div key={idx} className="relative group rounded-lg overflow-hidden border border-blue-100 shadow-sm aspect-square bg-slate-50">
                              <img 
                                src={img.url} 
                                alt={img.name} 
                                title={img.description}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-white text-[10px] font-medium leading-tight line-clamp-2">
                                  {img.description}
                                </p>
                              </div>
                              <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight shadow-sm">
                                {img.type.replace('_', ' ')}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 border-b border-slate-100"></div>
                      </div>
                    )}

                    {searchResult.visualMatches.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResult.visualMatches.map((match) => (
                          <div
                            key={match.id}
                            className="group flex flex-col items-center border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden relative"
                          >
                            <div className="relative w-full overflow-hidden rounded-md aspect-square bg-slate-50 mb-3">
                              <img
                                src={match.imageUrl}
                                alt="Visual Search Match"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            
                            <div className="flex w-full justify-between items-center px-1 mt-1">
                               <div className="text-sm font-semibold text-slate-700">Similarity</div>
                               <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                                 match.score > 0.8 ? 'bg-green-100/80 text-green-700 border border-green-200/50' : 
                                 match.score > 0.6 ? 'bg-blue-100/80 text-blue-700 border border-blue-200/50' : 
                                 'bg-slate-100 text-slate-600 border border-slate-200/50'
                               }`}>
                                 {(match.score * 100).toFixed(1)}%
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500">No high-confidence matches found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {!searchResult && !selectedImage && (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">Upload an image to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
