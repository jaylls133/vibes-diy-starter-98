import React, { useState } from "react";
import { useFireproof } from "use-fireproof";

export default function FlashcardApp() {
  const { useLiveQuery, useDocument } = useFireproof("flashcard-study-app");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Form for creating new flashcard
  const { doc: newCard, merge: mergeNewCard, submit: submitNewCard } = useDocument({
    question: "",
    answer: "",
    category: "",
    createdAt: Date.now()
  });

  // Get all cards or filtered by category
  const { docs: flashcards } = useLiveQuery(
    (doc) => doc.category, 
    activeCategory ? { key: activeCategory } : {}
  );

  // Get all unique categories
  const { docs: categoryDocs } = useLiveQuery(
    (doc) => ["category", doc.category], 
    { limit: 100 }
  );
  
  const categories = [...new Set(categoryDocs.map(doc => doc.category)).values()]
    .filter(Boolean);

  const handleCreateCard = (e) => {
    e.preventDefault();
    if (newCard.question.trim() && newCard.answer.trim() && newCard.category.trim()) {
      submitNewCard();
    }
  };

  const handleNextCard = () => {
    setFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    } else {
      setCurrentIndex(0); // Loop back to first card
    }
  };

  const handlePrevCard = () => {
    setFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    } else {
      setCurrentIndex(flashcards.length - 1); // Loop to last card
    }
  };

  // Background elements for visual style
  const bgElements = Array.from({length: 8}).map((_, i) => (
    <div 
      key={i} 
      className="absolute rounded-full opacity-20" 
      style={{
        width: `${Math.random() * 100 + 50}px`, 
        height: `${Math.random() * 100 + 50}px`,
        left: `${Math.random() * 100}%`, 
        top: `${Math.random() * 100}%`,
        backgroundColor: [
          "#70d6ff", "#ff70a6", "#ff9770", "#ffd670", "#e9ff70"
        ][Math.floor(Math.random() * 5)]
      }}
    />
  ));

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background pattern elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {bgElements}
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-[#242424] border-4 border-[#242424] inline-block px-4 py-2 mx-auto bg-[#ffd670] rounded-lg">
          Flashcard Study App
        </h1>
        
        <div className="mb-8 text-center italic text-gray-600">
          *This app helps you create and study flashcards by category. Add your own cards, then flip through them to test your knowledge!*
        </div>
        
        {/* Category filter */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-[#242424]">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1 rounded-full border-2 border-[#242424] ${!activeCategory ? 'bg-[#70d6ff] text-[#242424]' : 'bg-white text-[#242424]'}`}
            >
              All
            </button>
            {categories.map(category => (
              <button 
                key={category} 
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-1 rounded-full border-2 border-[#242424] ${activeCategory === category ? 'bg-[#ff70a6] text-[#242424]' : 'bg-white text-[#242424]'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Flashcard display */}
        {flashcards.length > 0 ? (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={handlePrevCard} 
                className="px-4 py-2 bg-[#ff9770] text-[#242424] rounded-lg border-2 border-[#242424] font-bold"
              >
                Previous
              </button>
              <span className="text-[#242424]">
                {currentIndex + 1} of {flashcards.length}
              </span>
              <button 
                onClick={handleNextCard} 
                className="px-4 py-2 bg-[#ff9770] text-[#242424] rounded-lg border-2 border-[#242424] font-bold"
              >
                Next
              </button>
            </div>
            
            {/* The actual flashcard */}
            <div 
              className="h-64 w-full border-4 border-[#242424] rounded-xl bg-white shadow-lg cursor-pointer transition-all duration-500 perspective relative"
              onClick={() => setFlipped(!flipped)}
              style={{
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Front of card */}
              <div 
                className={`absolute inset-0 backface-hidden flex items-center justify-center p-6 bg-[#e9ff70] rounded-lg ${flipped ? 'opacity-0' : 'opacity-100'}`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-xl font-bold text-center text-[#242424]">
                  {flashcards[currentIndex]?.question}
                </p>
              </div>
              
              {/* Back of card */}
              <div 
                className={`absolute inset-0 backface-hidden flex items-center justify-center p-6 bg-[#70d6ff] rounded-lg ${flipped ? 'opacity-100' : 'opacity-0'}`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <p className="text-xl font-bold text-center text-[#242424]">
                  {flashcards[currentIndex]?.answer}
                </p>
              </div>
              
              {/* Category badge */}
              <div className="absolute top-3 right-3 px-3 py-1 bg-[#ff70a6] text-xs font-bold rounded-full border border-[#242424] z-10">
                {flashcards[currentIndex]?.category}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 mb-8">
            <p className="text-lg text-[#242424]">No flashcards available. Create some below!</p>
          </div>
        )}

        {/* Create new flashcard form */}
        <div className="bg-white p-6 rounded-xl border-4 border-[#242424] shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-[#242424]">Create New Flashcard</h2>
          <form onSubmit={handleCreateCard}>
            <div className="mb-4">
              <label className="block text-[#242424] font-bold mb-2">Category</label>
              <input 
                type="text" 
                value={newCard.category} 
                onChange={(e) => mergeNewCard({ category: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#242424] rounded-lg focus:outline-none focus:border-[#ff70a6]"
                placeholder="Enter category" 
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-[#242424] font-bold mb-2">Question</label>
              <textarea 
                value={newCard.question} 
                onChange={(e) => mergeNewCard({ question: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#242424] rounded-lg focus:outline-none focus:border-[#ff70a6]" 
                rows="3"
                placeholder="Enter your question" 
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-[#242424] font-bold mb-2">Answer</label>
              <textarea 
                value={newCard.answer} 
                onChange={(e) => mergeNewCard({ answer: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#242424] rounded-lg focus:outline-none focus:border-[#ff70a6]" 
                rows="3"
                placeholder="Enter the answer" 
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full px-4 py-2 bg-[#70d6ff] text-[#242424] rounded-lg border-2 border-[#242424] font-bold hover:bg-[#ff70a6] transition-colors"
            >
              Create Flashcard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}