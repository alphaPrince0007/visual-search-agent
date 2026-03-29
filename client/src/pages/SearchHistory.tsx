import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Clock, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function SearchHistory() {
  const [expandedSearchId, setExpandedSearchId] = useState<number | null>(null);
  const [refinementQuery, setRefinementQuery] = useState("");
  const [selectedSearchId, setSelectedSearchId] = useState<number | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [, navigate] = useLocation();

  const { data: historyData, isLoading, refetch } = trpc.visualSearch.getSearchHistory.useQuery();
  const refineSearchMutation = trpc.visualSearch.refineSearch.useMutation();

  const handleRefine = async (searchId: number) => {
    if (!refinementQuery.trim()) {
      toast.error("Please enter a refinement query");
      return;
    }

    setIsRefining(true);
    try {
      const result = await refineSearchMutation.mutateAsync({
        searchId,
        refinementQuery,
      });

      if (result.success) {
        setRefinementQuery("");
        toast.success("Search refined!");
        refetch();
      } else {
        toast.error(result.error || "Refinement failed");
      }
    } catch (error) {
      toast.error("Failed to refine search");
      console.error(error);
    } finally {
      setIsRefining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const searches = historyData?.searches || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Search History</h1>
              <p className="text-lg text-slate-600">
                View and refine your previous searches
              </p>
            </div>
            <Button onClick={() => navigate("/search")} variant="outline">
              New Search
            </Button>
          </div>
        </div>

        {searches.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-4">No searches yet</p>
              <Button onClick={() => navigate("/search")}>Start a Search</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {searches.map((search: any) => (
              <Card key={search.id} className="overflow-hidden">
                <div
                  onClick={() =>
                    setExpandedSearchId(expandedSearchId === search.id ? null : search.id)
                  }
                  className="cursor-pointer"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={search.imageUrl}
                            alt="Search"
                            className="w-12 h-12 object-cover rounded border border-slate-200"
                          />
                          <div className="flex-1">
                            <CardTitle className="text-base">
                              {search.imageDescription?.substring(0, 60) || "Search"}...
                            </CardTitle>
                            <CardDescription>
                              {new Date(search.createdAt).toLocaleDateString()} •{" "}
                              {search.refinementCount} refinements
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      {expandedSearchId === search.id ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                </div>

                {expandedSearchId === search.id && (
                  <CardContent className="space-y-6 border-t border-slate-200 pt-6">
                    {/* Original Search Info */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Image Analysis</h3>
                      <p className="text-slate-600 text-sm">
                        {search.imageDescription}
                      </p>
                      {search.searchQuery && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm font-medium text-slate-900">Last Query:</p>
                          <p className="text-sm text-slate-600">{search.searchQuery}</p>
                        </div>
                      )}
                    </div>

                    {/* New Refinement */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-900 mb-3">Add Refinement</h3>
                      <div className="space-y-3">
                        <Input
                          placeholder="Enter refinement query (e.g., 'red color', 'outdoor')..."
                          value={selectedSearchId === search.id ? refinementQuery : ""}
                          onChange={(e) => {
                            setSelectedSearchId(search.id);
                            setRefinementQuery(e.target.value);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && selectedSearchId === search.id) {
                              handleRefine(search.id);
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            setSelectedSearchId(search.id);
                            handleRefine(search.id);
                          }}
                          disabled={
                            !refinementQuery.trim() ||
                            isRefining ||
                            selectedSearchId !== search.id
                          }
                          className="w-full"
                          size="sm"
                        >
                          {isRefining && selectedSearchId === search.id ? (
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
                      </div>
                    </div>

                    {/* View Full Results */}
                    <Button
                      onClick={() => navigate("/search")}
                      variant="outline"
                      className="w-full"
                    >
                      View Full Results
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
