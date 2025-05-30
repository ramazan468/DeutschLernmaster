import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TestTab from "@/components/test-tab";
import WordListTab from "@/components/word-list-tab";
import FavoritesTab from "@/components/favorites-tab";
import CategoriesTab from "@/components/categories-tab";
import WordCardTab from "@/components/word-card-tab";
import AddWordTab from "@/components/add-word-tab";
import type { Word } from "@shared/schema";

type TabType = 'test' | 'wordlist' | 'favorites' | 'categories' | 'wordcard' | 'addword';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('test');
  const [selectedWordForCard, setSelectedWordForCard] = useState<Word | null>(null);
  const [isWordCardModalOpen, setIsWordCardModalOpen] = useState(false);

  const tabs = [
    { id: 'test', label: 'Test', icon: 'clipboard-check' },
    { id: 'wordlist', label: 'Word List', icon: 'list' },
    { id: 'favorites', label: 'Favorites', icon: 'heart' },
    { id: 'categories', label: 'Categories', icon: 'tag' },
    { id: 'wordcard', label: 'Word Card', icon: 'credit-card' },
    { id: 'addword', label: 'Add Word', icon: 'plus' },
  ];

  const handleOpenWordCard = (word: Word) => {
    setSelectedWordForCard(word);
    setIsWordCardModalOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'test':
        return <TestTab />;
      case 'wordlist':
        return <WordListTab onOpenWordCard={handleOpenWordCard} />;
      case 'favorites':
        return <FavoritesTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'wordcard':
        return <WordCardTab />;
      case 'addword':
        return <AddWordTab />;
      default:
        return <TestTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <i className="fas fa-language text-primary text-2xl"></i>
              <h1 className="text-xl font-semibold text-foreground">Deutsch Lernen</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Progress: 245 words learned</span>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <i className="fas fa-user text-primary-foreground text-sm"></i>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                <i className={`fas fa-${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
}
