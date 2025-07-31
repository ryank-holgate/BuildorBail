import type { ValidationResultWithIdea } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface ValidationResultsProps {
  result: ValidationResultWithIdea;
  onValidateAnother: () => void;
}

export default function ValidationResults({ result, onValidateAnother }: ValidationResultsProps) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "BUILD":
        return "from-emerald-600 to-green-500";
      case "BAIL":
        return "from-red-600 to-red-500";
      case "CAUTION":
        return "from-amber-500 to-yellow-500";
      default:
        return "from-gray-500 to-gray-400";
    }
  };

  const getVerdictBadgeColor = (verdict: string) => {
    switch (verdict) {
      case "BUILD":
        return "bg-emerald-100 text-emerald-800";
      case "BAIL":
        return "bg-red-100 text-red-800";
      case "CAUTION":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case "BUILD":
        return "Build Recommended";
      case "BAIL":
        return "Bail Recommended";
      case "CAUTION":
        return "Proceed with Caution";
      default:
        return verdict;
    }
  };

  return (
    <section id="results" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Validation Results</h2>
          <p className="text-xl text-gray-600">Here's the unfiltered truth about your app idea</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className={`bg-gradient-to-r ${getVerdictColor(result.verdict)} px-6 py-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{result.appIdea.appName}</h3>
              <div className="flex items-center space-x-2">
                <span className={`bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium`}>
                  {getVerdictText(result.verdict)}
                </span>
                <div className="text-2xl font-bold text-white">{result.score.toFixed(1)}/10</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Strengths */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <i className="fas fa-thumbs-up text-emerald-600 mr-2"></i>
                  <h4 className="font-semibold text-emerald-600">Strengths</h4>
                </div>
                <ul className="space-y-2 text-sm">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check text-emerald-600 mr-2 mt-1 text-xs"></i>
                      <span>{strength}</span>
                    </li>
                  ))}
                  {result.strengths.length === 0 && (
                    <li className="text-gray-500 italic">No significant strengths identified</li>
                  )}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <i className="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                  <h4 className="font-semibold text-red-600">Critical Issues</h4>
                </div>
                <ul className="space-y-2 text-sm">
                  {result.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-times text-red-600 mr-2 mt-1 text-xs"></i>
                      <span>{weakness}</span>
                    </li>
                  ))}
                  {result.weaknesses.length === 0 && (
                    <li className="text-gray-500 italic">No major weaknesses identified</li>
                  )}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <i className="fas fa-lightbulb text-blue-600 mr-2"></i>
                  <h4 className="font-semibold text-blue-600">Opportunities</h4>
                </div>
                <ul className="space-y-2 text-sm">
                  {result.opportunities.map((opportunity, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-arrow-up text-blue-600 mr-2 mt-1 text-xs"></i>
                      <span>{opportunity}</span>
                    </li>
                  ))}
                  {result.opportunities.length === 0 && (
                    <li className="text-gray-500 italic">No specific opportunities identified</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h4>
              <div className="prose max-w-none text-gray-700">
                <p className="whitespace-pre-wrap">{result.detailedAnalysis}</p>
              </div>
            </div>

            {/* Action Items */}
            {result.actionItems.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Next Steps</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.actionItems.map((action, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button className="bg-red-600 text-white hover:bg-red-700">
                <i className="fas fa-download mr-2"></i>
                Download Report
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <i className="fas fa-share mr-2"></i>
                Share Results
              </Button>
              <Button 
                variant="outline"
                onClick={onValidateAnother}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <i className="fas fa-redo mr-2"></i>
                Validate Another Idea
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
