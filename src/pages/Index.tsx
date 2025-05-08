
import React, { useState, useRef } from "react";
import { useFireproof } from "use-fireproof";
import { callAI } from "call-ai";
import { toast } from "@/components/ui/use-toast";

// Define TypeScript interfaces for our documents
interface CaptionRequest {
  _id?: string;
  type: "caption-request";
  description: string;
  timestamp: number;
}

interface Caption {
  text: string;
  style: string;
}

interface CaptionResponse {
  _id?: string;
  type: "caption-response";
  description: string;
  captions: Caption[];
  timestamp: number;
  likes: Record<string, boolean>;
}

export default function App() {
  const { database, useLiveQuery, useDocument } = useFireproof("instagram-caption-generator");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Document for storing the current request
  const { doc, merge, submit } = useDocument<CaptionRequest>({
    type: "caption-request",
    description: "",
    timestamp: Date.now()
  });

  // Query for all previously generated captions, sorted by newest first
  const { docs: captionDocs } = useLiveQuery<CaptionResponse>("type", {
    key: "caption-response",
    descending: true,
  });

  const generateCaptions = async () => {
    setError(null);
    if (!doc.description.trim()) {
      setError("Please enter a description for your post");
      return;
    }

    try {
      setIsGenerating(true);
      // Save the request
      await submit();
      
      // Generate captions using AI
      const result = await callAI(
        `Generate 5 engaging, catchy Instagram captions for a post about: ${doc.description}. 
        Make them diverse in style (witty, inspirational, punny, etc).`,
        {
          schema: {
            properties: {
              captions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    style: { type: "string" }
                  }
                }
              }
            }
          }
        }
      );
      
      // Parse result and save to database
      const captionData = JSON.parse(result);
      await database.put({
        type: "caption-response",
        description: doc.description,
        captions: captionData.captions,
        timestamp: Date.now(),
        likes: {}
      });
      
      // Reset form
      merge({ description: "" });
      toast({
        title: "Captions Generated",
        description: "Your Instagram captions are ready!",
      });
    } catch (err) {
      setError("Failed to generate captions. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleLike = async (captionDoc: CaptionResponse, index: number) => {
    const newCaptionDoc = { ...captionDoc };
    const likeKey = `caption-${index}`;
    
    if (newCaptionDoc.likes && newCaptionDoc.likes[likeKey]) {
      delete newCaptionDoc.likes[likeKey];
    } else {
      if (!newCaptionDoc.likes) newCaptionDoc.likes = {};
      newCaptionDoc.likes[likeKey] = true;
    }
    
    await database.put(newCaptionDoc);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Caption copied to clipboard",
      duration: 2000,
    });
  };
  
  const generateDemoData = async () => {
    merge({ description: "Beach vacation at sunset" });
    await generateCaptions();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent mb-2">
            Instagram Caption Generator
          </h1>
          <p className="text-gray-400 italic">
            Enter your post description and get AI-generated catchy captions for your Instagram posts
          </p>
        </header>

        {/* Input Section */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 shadow-lg">
          <div className="mb-4">
            <label htmlFor="description" className="block mb-2 text-gray-300">
              What's your post about?
            </label>
            <textarea
              id="description"
              ref={descriptionRef}
              className="w-full bg-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-200"
              placeholder="e.g., Beach vacation, Coffee shop morning, New workout routine..."
              rows={3}
              value={doc.description}
              onChange={(e) => merge({ description: e.target.value })}
            />
          </div>
          
          {error && (
            <div className="text-red-400 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between">
            <button
              className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-medium py-2 px-6 rounded-lg transition duration-200 flex items-center justify-center w-full mr-2"
              onClick={generateCaptions}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Captions"
              )}
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 ml-2"
              onClick={generateDemoData}
              disabled={isGenerating}
            >
              Demo Data
            </button>
          </div>
        </div>

        {/* Captions Section */}
        {captionDocs.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated Captions</h2>
            </div>
            
            <div className="space-y-4">
              {captionDocs.map((captionDoc) => (
                <div key={captionDoc._id} className="bg-gray-800 rounded-xl p-4 shadow-lg">
                  <div className="text-sm text-gray-400 mb-2">
                    For post about: {captionDoc.description}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {captionDoc.captions.map((caption, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-700 rounded-lg p-4 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                      >
                        <div className="flex justify-between items-start">
                          <span className="inline-block bg-gradient-to-r from-pink-500 to-blue-500 text-xs text-white px-2 py-1 rounded mb-2">
                            {caption.style}
                          </span>
                        </div>
                        <p className="text-white mb-3">
                          {caption.text}
                        </p>
                        <div className="flex justify-end space-x-2">
                          <button
                            className={`flex items-center justify-center p-2 rounded-full transition-colors duration-200 ${
                              captionDoc.likes && captionDoc.likes[`caption-${index}`]
                                ? "bg-pink-500 text-white"
                                : "bg-gray-600 hover:bg-gray-500"
                            }`}
                            onClick={() => toggleLike(captionDoc, index)}
                            aria-label="Like caption"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            className="flex items-center justify-center p-2 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors duration-200"
                            onClick={() => copyToClipboard(caption.text)}
                            aria-label="Copy caption"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
